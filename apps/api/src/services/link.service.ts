import { z } from "zod";
import { LinkRepository } from "../repositories/link.repository";
import { generateUniqueSlug } from "../utils/slug";
import { parseRequestMeta } from "../utils/parseRequest";
import { redis, linkCacheKey } from "../utils/redis";

const urlSchema = z.string().url("Invalid URL format");

// Shape stored in the redirect cache. expiresAt is an ISO string because Redis
// serializes to JSON (Date -> string); null means the link never expires.
type CachedLink = { id: string; url: string; expiresAt: string | null };

// Fire-and-forget click logging. Runs after the HTTP response is flushed
// (setImmediate) so analytics never adds latency to the redirect. Single path
// for both cache-hit and cache-miss so the two can't drift.
function logClickAsync(
  linkId: string,
  meta: { ip: string; userAgent: string; referrer: string },
) {
  setImmediate(() => {
    const parsed = parseRequestMeta(
      meta.ip,
      meta.userAgent,
      meta.referrer,
      process.env.JWT_SECRET as string,
    );
    LinkRepository.logClick({
      linkId,
      ipHash: parsed.ipHash,
      country: parsed.country ?? undefined,
      city: parsed.city ?? undefined,
      deviceType: parsed.deviceType ?? undefined,
      browser: parsed.browser ?? undefined,
      os: parsed.os ?? undefined,
      referrer: parsed.referrer ?? undefined,
    }).catch(console.error);
  });
}

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
    const key = linkCacheKey(slug);

    // 1. Cache hit — but re-validate expiry. A cached copy can outlive the
    //    link's validity (it expires by the clock, with nothing to evict it),
    //    so we must check here, not only on the miss path.
    const cached = await redis.get<CachedLink>(key);
    if (cached) {
      if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
        await redis.del(key); // expired mid-TTL — evict and fall through to 404
        return null;
      }
      logClickAsync(cached.id, meta); // reuse cached id — no second DB read
      return cached.url;
    }

    // 2. Cache miss — query DB and validate.
    const link = await LinkRepository.findBySlug(slug);
    if (!link || !link.isActive) return null;
    if (link.expiresAt && link.expiresAt < new Date()) return null;

    // 3. Populate cache (1h TTL) with everything the hit path needs.
    await redis.setex(key, 3600, {
      id: link.id,
      url: link.originalUrl,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
    } satisfies CachedLink);

    // 4. Log click async.
    logClickAsync(link.id, meta);

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
