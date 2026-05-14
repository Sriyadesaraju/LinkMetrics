import { z } from "zod";
import { LinkRepository } from "../repositories/link.repository";
import { generateUniqueSlug } from "../utils/slug";
import { parseRequestMeta } from "../utils/parseRequest";
import { redis } from "../utils/redis";

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
    expiresAt?: Date;
  }) {
    // 1. Validate URL
    urlSchema.parse(data.originalUrl);
    // 2. Check for existing link with same URL in this workspace
    const duplicate = await LinkRepository.findByUrl(
      data.originalUrl,
      data.workspaceId,
    );
    if (duplicate) {
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      return {
        id: duplicate.id,
        slug: duplicate.slug,
        originalUrl: duplicate.originalUrl,
        shortUrl: `${baseUrl}/${duplicate.slug}`,
        createdAt: duplicate.createdAt,
        isDuplicate: true, // tells frontend to show a warning
      };
    }

    // 3. Determine slug
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

    // 4. Create link
    const link = await LinkRepository.create({
      workspaceId: data.workspaceId,
      userId: data.userId,
      slug,
      originalUrl: data.originalUrl,
      expiresAt: data.expiresAt,
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
    // 1. Check Redis cache first
    const cached = await redis.get<string>(`link:${slug}`);

    if (cached) {
      // Cache hit — fire analytics async and return immediately
      setImmediate(() => {
        LinkRepository.findBySlug(slug).then((link) => {
          if (!link) return;
          const parsed = parseRequestMeta(
            meta.ip,
            meta.userAgent,
            meta.referrer,
            process.env.JWT_SECRET as string,
          );
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
      });
      return cached;
    }

    // 2. Cache miss — query DB
    const link = await LinkRepository.findBySlug(slug);

    if (!link || !link.isActive) return null;
    if (link.expiresAt && link.expiresAt < new Date()) return null;

    // 3. Populate cache with 1 hour TTL
    await redis.setex(`link:${slug}`, 3600, link.originalUrl);

    // 4. Log click async
    const parsed = parseRequestMeta(
      meta.ip,
      meta.userAgent,
      meta.referrer,
      process.env.JWT_SECRET as string,
    );

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
      byCountry: raw.byCountry,
      byDevice: raw.byDevice,
      byBrowser: raw.byBrowser,
      byDay: raw.byDay,
      byReferrer: [], // referrer stays from raw events — add back if needed
    };
  },
  async exportAnalytics(
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

    const rows = await LinkRepository.getRawClicksForExport(
      link.id,
      fromDate,
      toDate,
    );
    return rows;
  },
};
