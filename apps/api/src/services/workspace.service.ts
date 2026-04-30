import { WorkspaceRepository } from '../repositories/workspace.repository'

export const WorkspaceService = {
  async create(name: string, userId: string) {
    const workspace = await WorkspaceRepository.create(name, userId)
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    }
  },

  async listForUser(userId: string) {
    return WorkspaceRepository.findByUser(userId)
  },
}