import type { ReactNode } from 'react'
import { LogoMark, AuthTransition } from '@/components/ui'
import Link from 'next/link'

const features = [
  "Detección automática de anomalías en tus datos",
  "Correcciones asistidas por IA con aprobación humana",
  "Datasets listos para análisis en minutos",
]

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo — branding ── */}
      <div className="hidden md:flex flex-col flex-1 bg-[#1a1612] px-14 py-12 relative overflow-hidden">

        {/* Glow naranja sutil */}
        <div
          className="pointer-events-none absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #ff6600 0%, transparent 65%)" }}
          aria-hidden
        />

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 mb-auto">
          <LogoMark size={28} color="#ff6600" />
          <span
            className="font-bold text-base text-white tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            PYMES-AI
          </span>
        </Link>

        {/* Contenido central */}
        <div className="mb-auto pt-24">
          <h1
            className="text-white leading-[0.92] mb-8"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(3rem, 5.5vw, 5rem)",
              fontWeight: 700,
            }}
          >
            Limpia tus datos.
            <br />
            <span className="text-[#ff6600]">Multiplica</span>
            <br />
            tu valor.
          </h1>

          <ul className="space-y-4">
            {features.map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <span
                  className="text-[#ff6600] font-bold text-xs mt-0.5 shrink-0 tabular-nums"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  0{i + 1}
                </span>
                <span
                  className="text-[#9c9189] text-sm leading-snug"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer del panel */}
        <p
          className="text-[#3a3530] text-xs"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          © 2026 Fundación Universitaria Compensar
        </p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="w-full md:w-[520px] bg-[#f7f5f2]">
        <AuthTransition>{children}</AuthTransition>
      </div>

    </div>
  )
}
