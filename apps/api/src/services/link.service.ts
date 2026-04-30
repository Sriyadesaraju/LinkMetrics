import { z } from "zod";
import { LinkRepository } from "../repositories/link.repository";
import { generateUniqueSlug } from "../utils/slug";
import { parseRequestMeta } from "../utils/parseRequest";

const urlSchema = z.string().url("Invalid URL format");

const slugSchema = z
  .string()
  .min(3, "Custom slug must be at least 3 characters")
  .max(50, "Custom slug must be under 50 characters")
  .regex(
    /^[a-zA-Z0-9-]+$/,
    "Slug can only contain letters, numbers, and hyphens",
  );

export const LinkService = {
  async shorten(data: {
    originalUrl: string;
    customSlug?: string;
    workspaceId: string;
    userId: string;
  }) {
    // 1. Validate URL
    urlSchema.parse(data.originalUrl);

    // 2. Determine slug
    let slug: string;

    if (data.customSlug) {
      slugSchema.parse(data.customSlug);
      const existing = await LinkRepository.findBySlug(data.customSlug);
      if (existing) {
        const err: any = new Error("This custom slug is already taken");
        err.status = 409;
        throw err;
      }
      slug = data.customSlug;
    } else {
      slug = await generateUniqueSlug();
    }

    // 3. Create link
    const link = await LinkRepository.create({
      workspaceId: data.workspaceId,
      userId: data.userId,
      slug,
      originalUrl: data.originalUrl,
    });

    const baseUrl = process.env.BASE_URL || "http://localhost:3000";

    return {
      id: link.id,
      slug: link.slug,
      originalUrl: link.originalUrl,
      shortUrl: `${baseUrl}/${link.slug}`,
      createdAt: link.createdAt,
    };
  },

  async listLinks(workspaceId: string) {
    const links = await LinkRepository.findByWorkspace(workspaceId);
    return links.map((link) => ({
      id: link.id,
      slug: link.slug,
      originalUrl: link.originalUrl,
      shortUrl: `${process.env.BASE_URL || "http://localhost:3000"}/${link.slug}`,
      clicks: link._count.clicks,
      createdAt: link.createdAt,
    }));
  },

  async getStats(slug: string, workspaceId: string) {
    const link = await LinkRepository.findBySlug(slug);

    if (!link || link.workspaceId !== workspaceId) {
      const err: any = new Error("Link not found");
      err.status = 404;
      throw err;
    }

    const totalClicks = await LinkRepository.getClickCount(link.id);
    return { slug, totalClicks, originalUrl: link.originalUrl };
  },

  async handleRedirect(
    slug: string,
    meta: {
      ip: string;
      userAgent: string;
      referrer: string;
    },
  ) {
    const link = await LinkRepository.findBySlug(slug);

    if (!link || !link.isActive) return null;

    if (link.expiresAt && link.expiresAt < new Date()) return null;

    // Parse metadata (IP hash, device, country, etc.)
    const parsed = parseRequestMeta(
      meta.ip,
      meta.userAgent,
      meta.referrer,
      process.env.JWT_SECRET as string,
    );

    // Fire and forget logging
    setImmediate(() => {
      LinkRepository.logClick({
        linkId: link.id,
        ipHash: parsed.ipHash,
        country: parsed.country ?? undefined,
        city: parsed.city ?? undefined,
        deviceType: parsed.deviceType ?? undefined,
        browser: parsed.browser ?? undefined,
        os: parsed.os ?? undefined,
        referrer: parsed.referrer ?? undefined,
      }).catch(console.error);
    });

    return link.originalUrl;
  },
  async getAnalytics(
    slug: string,
    workspaceId: string,
    from?: string,
    to?: string,
  ) {
    const link = await LinkRepository.findBySlug(slug);

    if (!link || link.workspaceId !== workspaceId) {
      const err: any = new Error("Link not found");
      err.status = 404;
      throw err;
    }

    const fromDate = from
      ? new Date(from)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const raw = await LinkRepository.getAnalytics(link.id, fromDate, toDate);

    return {
      totalClicks: raw.totalClicks,
      byCountry: raw.byCountry.filter((r) => r.country !== null),
      byDevice: raw.byDevice.filter((r) => r.deviceType !== null),
      byBrowser: raw.byBrowser.filter((r) => r.browser !== null),
      byReferrer: raw.byReferrer.filter(
        (r) => r.referrer !== null && r.referrer !== "",
      ),
    };
  },
};
