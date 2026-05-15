import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '@/lib/hooks'
import { useAuthStore } from '@/store/auth.store'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const { mutate: loginMutate, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    loginMutate(data, {
      onSuccess: (res) => {
        login(res.user, res.token)
        navigate('/dashboard')
      },
    })
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your LinkMetrics workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5">Email</label>
          <Input {...register('email')} type="email" placeholder="you@company.com" />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5">Password</label>
          <Input {...register('password')} type="password" placeholder="••••••••" />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm rounded-lg bg-red-50 border border-red-100 px-3 py-2">
            {(error as { response?: { data?: { error?: string } } }).response?.data?.error ||
              'Login failed'}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="w-full h-11">
          {isPending ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        No account?{' '}
        <Link to="/register" className="text-accent font-medium hover:underline">
          Create one free
        </Link>
      </p>
    </AuthLayout>
  )
}
