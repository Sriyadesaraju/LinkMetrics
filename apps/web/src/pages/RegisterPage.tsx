import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '@/lib/hooks'
import { useAuthStore } from '@/store/auth.store'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const { mutate: registerMutate, isPending, error } = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    registerMutate(data, {
      onSuccess: (res) => {
        login(res.user, res.token)
        navigate('/dashboard')
      },
    })
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start shortening and tracking links in minutes"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5">Work email</label>
          <Input {...register('email')} type="email" placeholder="you@company.com" />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5">Password</label>
          <Input {...register('password')} type="password" placeholder="Min. 8 characters" />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm rounded-lg bg-red-50 border border-red-100 px-3 py-2">
            {(error as { response?: { data?: { error?: string } } }).response?.data?.error ||
              'Registration failed'}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full h-11">
          {isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
