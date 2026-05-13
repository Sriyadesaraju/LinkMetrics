import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";

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
  }) {
    return prisma.link.create({ data });
  },

  async softDelete(slug: string, workspaceId: string) {
    return prisma.link.updateMany({
      where: { slug, workspaceId },
      data: { isActive: false },
    });
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
    return prisma.clickEvent.create({
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
    });
  },

  async getAnalytics(linkId: string, from: Date, to: Date) {
    const where = { linkId, timestamp: { gte: from, lte: to } };

    const [totalClicks, byCountry, byDevice, byBrowser, byReferrer, byDay] =
      await Promise.all([
        prisma.clickEvent.count({ where }),

        prisma.clickEvent.groupBy({
          by: ["country"],
          where,
          _count: { country: true },
          orderBy: { _count: { country: "desc" } },
          take: 10,
        }),

        prisma.clickEvent.groupBy({
          by: ["deviceType"],
          where,
          _count: { deviceType: true },
          orderBy: { _count: { deviceType: "desc" } },
        }),

        prisma.clickEvent.groupBy({
          by: ["browser"],
          where,
          _count: { browser: true },
          orderBy: { _count: { browser: "desc" } },
          take: 5,
        }),

        prisma.clickEvent.groupBy({
          by: ["referrer"],
          where,
          _count: { referrer: true },
          orderBy: { _count: { referrer: "desc" } },
          take: 5,
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

    return {
      totalClicks,
      byCountry,
      byDevice,
      byBrowser,
      byReferrer,
      byDay,
    };
  },
};
