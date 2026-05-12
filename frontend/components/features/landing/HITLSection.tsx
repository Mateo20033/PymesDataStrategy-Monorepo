import { AlertTriangle, Check, X } from "lucide-react";
import { FadeUp } from "@/components/ui";

export function HITLSection() {
  return (
    <section className="py-24 px-6 bg-[#1a1612] overflow-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Texto */}
        <div>
          <FadeUp>
            <span
              className="inline-block bg-[#ff6600] text-white text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Human-in-the-Loop
            </span>
          </FadeUp>

          <FadeUp delay={80}>
            <h2
              className="text-white leading-[0.95] mb-8"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 700 }}
            >
              La IA sugiere.
              <br />
              <span className="text-[#ff6600]">Tú decides.</span>
            </h2>
          </FadeUp>

          <FadeUp delay={160}>
            <p
              className="text-[#9c9189] text-lg leading-relaxed max-w-md"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              No somos una caja negra. La IA perfila las anomalías, pero el
              sistema se detiene y te presenta una interfaz clara para que
              apruebes o descartes cada acción antes de modificar un solo dato.
            </p>
          </FadeUp>
        </div>

        {/* Mockup card */}
        <FadeUp delay={200}>
          <div className="relative">
            {/* Glow de fondo */}
            <div
              className="absolute inset-0 rounded-3xl opacity-20 blur-3xl"
              style={{ background: "#ff6600" }}
              aria-hidden
            />

            <div className="relative bg-white rounded-2xl p-7 shadow-[0_32px_64px_rgba(0,0,0,.4)]" style={{ rotate: "1.5deg" }}>

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-[#1a1612] text-white font-semibold text-xs px-3 py-1.5 rounded-lg" style={{ fontFamily: "var(--font-sans)" }}>
                    Columna: Salario
                  </div>
                  <AlertTriangle size={16} className="text-[#ff6600]" strokeWidth={2} />
                </div>
                <span className="text-xs text-[#6b6258]" style={{ fontFamily: "var(--font-sans)" }}>15 anomalías</span>
              </div>

              {/* Descripción */}
              <p className="text-[#1a1612] font-semibold mb-5 text-sm" style={{ fontFamily: "var(--font-sans)" }}>
                Se detectaron <strong>15 registros</strong> con formato de texto en columna numérica.
              </p>

              {/* Sugerencia IA */}
              <div className="bg-[#fff8f4] rounded-xl p-4 mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff6600] mb-1.5" style={{ fontFamily: "var(--font-sans)" }}>
                  Sugerencia IA
                </p>
                <p className="font-semibold text-sm text-[#1a1612]" style={{ fontFamily: "var(--font-sans)" }}>
                  Convertir a numérico · Rellenar con promedio si falla
                </p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  className="flex items-center gap-2 bg-[#1a1612] text-white font-semibold px-4 py-2.5 rounded-xl text-sm
                    transition-[background-color,transform] duration-150 ease-out hover:bg-[#ff6600] active:scale-[0.97]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Aprobar
                </button>
                <button
                  className="flex items-center gap-2 text-[#6b6258] font-semibold px-4 py-2.5 rounded-xl text-sm border border-[#ede8e1]
                    transition-[background-color,color,transform] duration-150 ease-out hover:bg-[#f7f5f2] active:scale-[0.97]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  <X size={14} strokeWidth={2.5} />
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </FadeUp>

      </div>
    </section>
  );
}
