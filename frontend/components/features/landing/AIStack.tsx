import { ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/ui";

const models = [
  {
    label: "Motor Principal",
    name: "Gemini 2.5 Flash",
    description: "Rápido y optimizado para análisis estructural de datos tabulares a escala.",
    accent: "#ff6600",
  },
  {
    label: "Respaldo 1",
    name: "Claude 3 Haiku",
    description: "Precisión superior en razonamiento sobre anomalías complejas y reglas de negocio.",
    accent: "#9c9189",
  },
  {
    label: "Respaldo 2",
    name: "GPT-4o Mini",
    description: "Fallback con alta disponibilidad cuando los modelos primarios no responden.",
    accent: "#6b6258",
  },
];

export function AIStack() {
  return (
    <section className="py-24 px-6 bg-[#f7f5f2]">
      <div className="max-w-6xl mx-auto">

        <FadeUp>
          <div className="mb-4">
            <span
              className="inline-block bg-[#fef3c7] text-[#d97706] text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Próximamente
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <h2
              className="text-[#1a1612] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
            >
              Tolerancia a Fallos IA
            </h2>
            <p
              className="text-[#6b6258] max-w-sm leading-relaxed md:text-right"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Si el motor principal falla, el sistema escala automáticamente al siguiente modelo sin interrumpir tu trabajo.
            </p>
          </div>
        </FadeUp>

        <div className="flex flex-col md:flex-row items-stretch gap-px bg-[#ede8e1]">
          {models.map(({ label, name, description, accent }, i) => (
            <FadeUp key={name} delay={i * 100} className="flex-1">
              <div className="group bg-white hover:bg-[#f7f5f2] h-full p-8 transition-colors duration-200 ease-out flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <span
                    className="text-xs font-semibold tracking-widest uppercase"
                    style={{ color: accent, fontFamily: "var(--font-sans)" }}
                  >
                    {label}
                  </span>
                  {i < models.length - 1 && (
                    <ArrowRight size={14} className="text-[#d4cfc8] hidden md:block" strokeWidth={2} />
                  )}
                </div>
                <h3
                  className="text-[#1a1612] mb-3"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700 }}
                >
                  {name}
                </h3>
                <p
                  className="text-[#6b6258] leading-relaxed text-sm mt-auto"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

      </div>
    </section>
  );
}
