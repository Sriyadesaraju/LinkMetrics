import { prisma } from '../utils/prisma'

export const WorkspaceRepository = {
  async create(name: string, userId: string) {
    return prisma.workspace.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: { members: true },
    })
  },

  async findByUser(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        _count: { select: { links: true } },
      },
    })
  },

  // Authorization lookup: is this user a member of this workspace?
  // Uses the WorkspaceMember composite PK (workspaceId, userId).
  async findMembership(workspaceId: string, userId: string) {
    return prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    })
  },
}