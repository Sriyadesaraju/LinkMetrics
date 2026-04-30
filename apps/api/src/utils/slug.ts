import { nanoid } from 'nanoid'
import { LinkRepository } from '../repositories/link.repository'

export async function generateUniqueSlug(): Promise<string> {
  const MAX_ATTEMPTS = 5

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const slug = nanoid(7) // 7 chars = 56 billion combinations
    const existing = await LinkRepository.findBySlug(slug)
    if (!existing) return slug
  }

  throw new Error('Could not generate unique slug after 5 attempts')
}