import { X, Check } from "lucide-react";
import { FadeUp } from "@/components/ui";

const problems = [
  "Horas perdidas ordenando Excels manualmente",
  "Errores humanos que arruinan reportes clave",
  "Sin trazabilidad: no sabes quién cambió qué",
  "Imposible escalar: más datos = más caos",
];

const solutions = [
  "IA procesa hasta 50.000 registros en minutos",
  "Estandarización automática con reglas configurables",
  "Registro inmutable de cada transformación",
  "Escala con tu negocio sin añadir personal",
];

export function ProblemSolution() {
  return (
    <section className="py-24 px-6 bg-[#f7f5f2]">
      <div className="max-w-6xl mx-auto">

        <FadeUp>
          <h2
            className="text-[#1a1612] text-center mb-16 leading-tight"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            La realidad de la gestión de datos
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Problema */}
          <FadeUp delay={80}>
            <div className="bg-[#1a1612] rounded-2xl p-8 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <X size={16} className="text-white/60" strokeWidth={2.5} />
                </div>
                <span
                  className="text-sm font-semibold text-white/40 tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Sin nuestra solución
                </span>
              </div>
              <ul className="space-y-5">
                {problems.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span
                      className="text-[#ff6600] font-bold text-xs mt-1 shrink-0 tabular-nums"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className="text-white/60 font-medium leading-snug"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>

          {/* Solución */}
          <FadeUp delay={160}>
            <div className="bg-[#ff6600] rounded-2xl p-8 h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Check size={16} className="text-white" strokeWidth={2.5} />
                </div>
                <span
                  className="text-sm font-semibold text-white/70 tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Con PYMES-AI
                </span>
              </div>
              <ul className="space-y-5">
                {solutions.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span
                      className="text-[#1a1612] font-bold text-xs mt-1 shrink-0 tabular-nums"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className="text-white font-semibold leading-snug"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
