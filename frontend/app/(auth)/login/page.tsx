'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginSchema } from '@/lib/schemas'
import type { LoginFormData } from '@/lib/schemas'
import { LogoMark } from '@/components/ui'
import { ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
    setServerError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const parsed = loginSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors: Partial<LoginFormData> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof LoginFormData
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })

      if (result?.error) {
        setServerError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setServerError('Error al iniciar sesión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="w-full max-w-[400px] animate-fade-up"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Logo — mobile only */}
      <div className="flex items-center gap-2.5 mb-10 md:hidden">
        <LogoMark size={26} color="#ff6600" />
        <span
          className="font-bold text-base text-[#1a1612]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          PYMES-AI
        </span>
      </div>

      {/* Encabezado */}
      <div className="mb-8 animate-fade-up animate-delay-100">
        <h2
          className="text-[#1a1612] mb-1.5 leading-tight"
          style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700 }}
        >
          Bienvenido de nuevo
        </h2>
        <p className="text-[#6b6258] text-sm">
          Ingresa tus credenciales para continuar.
        </p>
      </div>

      {/* Error de servidor */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 p-4 bg-[#fff0ee] rounded-xl border border-[#ffd0c8]"
        >
          <AlertCircle size={16} className="text-[#dc2626] shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-sm font-medium text-[#dc2626]">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5 animate-fade-up animate-delay-200">

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[#1a1612] tracking-wide uppercase mb-2"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="tu@correo.com"
            className="w-full bg-white border border-[#ede8e1] rounded-xl px-4 py-3 text-sm text-[#1a1612] placeholder:text-[#c4bdb5]
              focus:outline-none focus:border-[#ff6600] focus:ring-[3px] focus:ring-[rgba(255,102,0,.10)]
              transition-[border-color,box-shadow] duration-150 ease-out"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium text-[#dc2626]">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-[#1a1612] tracking-wide uppercase mb-2"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="w-full bg-white border border-[#ede8e1] rounded-xl px-4 py-3 text-sm text-[#1a1612] placeholder:text-[#c4bdb5]
              focus:outline-none focus:border-[#ff6600] focus:ring-[3px] focus:ring-[rgba(255,102,0,.10)]
              transition-[border-color,box-shadow] duration-150 ease-out"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs font-medium text-[#dc2626]">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="group w-full mt-2 flex items-center justify-center gap-2
            bg-[#ff6600] text-white font-semibold py-3 rounded-xl
            hover:bg-[#e55a00] hover:shadow-[0_8px_24px_rgba(255,102,0,.35)]
            active:scale-[0.97] transition-[background-color,box-shadow,transform] duration-150 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Ingresar
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>

      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-[#6b6258] animate-fade-up animate-delay-300">
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          className="font-semibold text-[#1a1612] hover:text-[#ff6600] transition-colors duration-150 ease-out"
        >
          Regístrate
        </Link>
      </p>
    </div>
  )
}
