import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";
import { redis } from "../utils/redis";

type LinkWithClicks = Prisma.LinkGetPayload<{
  include: { _count: { select: { clicks: true } } };
}>;

export const LinkRepository = {
  async findBySlug(slug: string) {
    return prisma.link.findUnique({ where: { slug } });
  },
  async findByUrl(originalUrl: string, workspaceId: string) {
    return prisma.link.findFirst({
      where: { originalUrl, workspaceId, isActive: true },
    });
  },

  async findByWorkspace(workspaceId: string): Promise<LinkWithClicks[]> {
    return prisma.link.findMany({
      where: { workspaceId, isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { clicks: true } }, // click count in one query
      },
    });
  },

  async create(data: {
    workspaceId: string;
    userId: string;
    slug: string;
    originalUrl: string;
    expiresAt?: Date;
  }) {
    return prisma.link.create({ data });
  },

  async softDelete(slug: string, workspaceId: string) {
    const result = await prisma.link.updateMany({
      where: { slug, workspaceId },
      data: { isActive: false },
    });
    // Invalidate cache so redirect stops working immediately
    await redis.del(`link:${slug}`);
    return result;
  },

  async getClickCount(linkId: string) {
    return prisma.clickEvent.count({ where: { linkId } });
  },

  async logClick(data: {
    linkId: string;
    ipHash: string;
    country?: string;
    city?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    referrer?: string;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run both writes in parallel — raw event + aggregate update
    await Promise.all([
      prisma.clickEvent.create({
        data: {
          linkId: data.linkId,
          ipHash: data.ipHash,
          country: data.country ?? null,
          city: data.city ?? null,
          deviceType: data.deviceType ?? null,
          browser: data.browser ?? null,
          os: data.os ?? null,
          referrer: data.referrer ?? null,
        },
      }),

      prisma.clickAggregateDaily.upsert({
        where: {
          linkId_date: {
            linkId: data.linkId,
            date: today,
          },
        },
        update: { clicks: { increment: 1 } },
        create: {
          linkId: data.linkId,
          date: today,
          country: data.country ?? null,
          deviceType: data.deviceType ?? null,
          browser: data.browser ?? null,
          clicks: 1,
        },
      }),
    ]);
  },

  async getAnalytics(linkId: string, from: Date, to: Date) {
    // Total clicks still from raw events (accurate)
    // Grouped analytics from pre-aggregated table (fast)
    const [totalClicks, aggregates, byDay] = await Promise.all([
      prisma.clickEvent.count({
        where: { linkId, timestamp: { gte: from, lte: to } },
      }),

      prisma.clickAggregateDaily.findMany({
        where: {
          linkId,
          date: { gte: from, lte: to },
        },
      }),

      prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT
        DATE("timestamp")::text AS date,
        COUNT(*)::int AS count
      FROM "ClickEvent"
      WHERE "linkId" = ${linkId}
        AND "timestamp" >= ${from}
        AND "timestamp" <= ${to}
      GROUP BY DATE("timestamp")
      ORDER BY DATE("timestamp") ASC
    `,
    ]);

    // Aggregate the pre-computed rows in JavaScript
    // This is fast because there are at most (days × countries × devices × browsers) rows
    const countryMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const browserMap = new Map<string, number>();

    for (const row of aggregates) {
      if (row.country) {
        countryMap.set(
          row.country,
          (countryMap.get(row.country) ?? 0) + row.clicks,
        );
      }
      if (row.deviceType) {
        deviceMap.set(
          row.deviceType,
          (deviceMap.get(row.deviceType) ?? 0) + row.clicks,
        );
      }
      if (row.browser) {
        browserMap.set(
          row.browser,
          (browserMap.get(row.browser) ?? 0) + row.clicks,
        );
      }
    }

    const toSortedArray = (map: Map<string, number>) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

    return {
      totalClicks,
      byCountry: toSortedArray(countryMap).slice(0, 10),
      byDevice: toSortedArray(deviceMap),
      byBrowser: toSortedArray(browserMap).slice(0, 5),
      byDay,
    };
  },
  async getRawClicksForExport(linkId: string, from: Date, to: Date) {
    return prisma.clickEvent.findMany({
      where: { linkId, timestamp: { gte: from, lte: to } },
      select: {
        timestamp: true,
        country: true,
        city: true,
        deviceType: true,
        browser: true,
        os: true,
        referrer: true,
      },
      orderBy: { timestamp: "desc" },
    });
  },
};
