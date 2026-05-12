"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#f7f5f2] min-h-[88vh] flex items-center">

      {/* Warm glow accent — naranja muy sutil en esquina */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, #ff6600 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-6 py-24 w-full grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 items-center">

        {/* ── Columna izquierda: texto ── */}
        <div className="flex flex-col items-start">

          {/* Badge */}
          <div className="animate-fade-up animate-delay-100 inline-flex items-center gap-2 bg-white border border-[#e8e3dc] text-[#ff6600] text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8 shadow-[0_1px_4px_rgba(0,0,0,.06)]">
            <Sparkles size={12} strokeWidth={2.5} />
            Exclusivo para PYMES en Bogotá
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up animate-delay-200 text-[#1a1612] leading-[0.95] tracking-tight mb-6"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 8vw, 6.5rem)", fontWeight: 700 }}
          >
            Limpia tus Datos.{" "}
            <br />
            <span className="text-[#ff6600]">Multiplica</span>
            <br />
            tu Valor.
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up animate-delay-300 text-[#6b6258] text-lg leading-relaxed max-w-[42ch] mb-10" style={{ fontFamily: "var(--font-sans)" }}>
            Deja de perder horas ordenando Excels. Nuestro agente de IA
            audita, estandariza y limpia hasta{" "}
            <strong className="text-[#1a1612] font-semibold">50.000 registros</strong>{" "}
            en minutos.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up animate-delay-400 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 bg-[#ff6600] text-white font-semibold px-6 py-3 rounded-xl
                transition-[background-color,box-shadow,transform] duration-150 ease-out
                hover:bg-[#cc5200] hover:shadow-[0_8px_24px_rgba(255,102,0,.35)]
                active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Iniciar Transformación
              <ArrowRight
                size={16}
                strokeWidth={2.5}
                className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              href="#como-funciona"
              className="inline-flex items-center gap-2 text-[#1a1612] font-medium text-sm
                transition-colors duration-150 ease-out hover:text-[#ff6600]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Ver cómo funciona
            </Link>
          </div>

          {/* Social proof */}
          <div className="animate-fade-up animate-delay-500 flex items-center gap-3 mt-10">
            <div className="flex -space-x-2">
              {["bg-[#ff6600]", "bg-[#1a1612]", "bg-[#e8e3dc]"].map((color, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full border-2 border-[#f7f5f2] ${color}`}
                />
              ))}
            </div>
            <p className="text-sm text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>
              <strong className="text-[#1a1612] font-semibold">+40 PYMES</strong> ya transformaron sus datos
            </p>
          </div>
        </div>

        {/* ── Columna derecha: mockup visual ── */}
        <div className="animate-fade-up animate-delay-300 relative flex items-center justify-center lg:justify-end">

          {/* Blob de fondo */}
          <div
            className="absolute inset-0 rounded-[40%_60%_55%_45%/40%_45%_55%_60%] opacity-[0.07]"
            style={{ background: "#ff6600", transform: "rotate(-6deg) scale(1.1)" }}
            aria-hidden
          />

          {/* Card mockup principal */}
          <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,.10)] overflow-hidden border border-[#ede8e1]">

            {/* Header del mockup */}
            <div className="bg-[#1a1612] px-5 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#ff6600]" />
                <span className="w-3 h-3 rounded-full bg-[#3a3530]" />
                <span className="w-3 h-3 rounded-full bg-[#3a3530]" />
              </div>
              <span className="text-xs text-[#6b6258] font-medium tracking-wide" style={{ fontFamily: "var(--font-sans)" }}>
                ventas_q1_2024.xlsx — Analizando
              </span>
            </div>

            {/* Contenido del mockup */}
            <div className="p-6 space-y-4">

              {/* Barra de progreso */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>Limpiando dataset</span>
                  <span className="text-xs text-[#ff6600] font-bold">87%</span>
                </div>
                <div className="h-1.5 bg-[#f0ece6] rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff6600] rounded-full" style={{ width: "87%" }} />
                </div>
              </div>

              {/* Anomalías detectadas */}
              <div className="space-y-2">
                {[
                  { label: "Valores nulos corregidos", count: "1.204", color: "bg-emerald-500" },
                  { label: "Outliers detectados", count: "312", color: "bg-[#ff6600]" },
                  { label: "Formatos estandarizados", count: "8.901", color: "bg-sky-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#f0ece6] last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>{item.count}</span>
                  </div>
                ))}
              </div>

              {/* Botón de acción */}
              <div className="pt-1">
                <div className="w-full bg-[#ff6600] text-white text-xs font-semibold text-center py-2.5 rounded-lg" style={{ fontFamily: "var(--font-sans)" }}>
                  Revisar sugerencias de IA →
                </div>
              </div>
            </div>
          </div>

          {/* Chip flotante — métrica */}
          <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-white border border-[#ede8e1] rounded-xl px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,.08)] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#fff0e6] flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-[#ff6600]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] text-[#6b6258] leading-none mb-0.5" style={{ fontFamily: "var(--font-sans)" }}>Tiempo ahorrado</p>
              <p className="text-sm font-bold text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>4.2 hrs / dataset</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
