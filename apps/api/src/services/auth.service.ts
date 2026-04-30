import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repositories/user.repository'

const JWT_SECRET = process.env.JWT_SECRET as string

export const AuthService = {
  async register(email: string, password: string) {
    // 1. Check if email already exists
    const existing = await UserRepository.findByEmail(email)
    if (existing) {
      const err: any = new Error('Email already in use')
      err.status = 409
      throw err
    }

    // 2. Hash the password (never store plain text)
    const passwordHash = await bcrypt.hash(password, 12)

    // 3. Create the user
    const user = await UserRepository.create({ email, passwordHash })

    // 4. Sign a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return { token, user: { id: user.id, email: user.email } }
  },

  async login(email: string, password: string) {
    // 1. Find user — use same error message for wrong email OR wrong password
    //    (security: don't reveal which one is wrong)
    const user = await UserRepository.findByEmail(email)
    if (!user) {
      const err: any = new Error('Invalid credentials')
      err.status = 401
      throw err
    }

    // 2. Compare password with stored hash
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      const err: any = new Error('Invalid credentials')
      err.status = 401
      throw err
    }

    // 3. Sign a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return { token, user: { id: user.id, email: user.email } }
  },
}