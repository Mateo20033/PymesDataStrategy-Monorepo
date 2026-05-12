import { TrendingUp, Users, Package } from "lucide-react";
import { FadeUp } from "@/components/ui";

const cases = [
  {
    icon: TrendingUp,
    title: "Ventas",
    description:
      "Limpia y normaliza reportes de ventas. Detecta duplicados, corrige fechas y estandariza nombres de productos para análisis más precisos.",
  },
  {
    icon: Users,
    title: "Nómina",
    description:
      "Valida datos de empleados, detecta inconsistencias en salarios y formatos antes de procesar pagos. Evita errores costosos.",
  },
  {
    icon: Package,
    title: "Inventario",
    description:
      "Unifica catálogos, detecta SKUs duplicados y corrige unidades de medida inconsistentes. Mantén tu inventario siempre confiable.",
  },
];

export function UseCases() {
  return (
    <section id="beneficios" className="py-24 px-6 bg-[#f7f5f2]">
      <div className="max-w-6xl mx-auto">

        <FadeUp>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <p
                className="text-[#ff6600] text-sm font-semibold tracking-widest uppercase mb-4"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Casos de uso
              </p>
              <h2
                className="text-[#1a1612] leading-tight"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
              >
                Diseñado para cada área
              </h2>
            </div>
            <p
              className="text-[#6b6258] max-w-xs leading-relaxed md:text-right"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Un solo sistema para los datos de toda la empresa.
            </p>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-px bg-[#ede8e1]">
          {cases.map(({ icon: Icon, title, description }, i) => (
            <FadeUp key={title} delay={i * 80}>
              <div className="group bg-[#f7f5f2] hover:bg-white p-8 transition-colors duration-200 ease-out h-full flex flex-col">
                <div className="mb-auto">
                  <div className="w-10 h-10 rounded-xl bg-[#ede8e1] group-hover:bg-[#fff0e6] flex items-center justify-center mb-6 transition-colors duration-200 ease-out">
                    <Icon size={20} className="text-[#6b6258] group-hover:text-[#ff6600] transition-colors duration-200 ease-out" strokeWidth={1.5} />
                  </div>
                  <h3
                    className="text-[#1a1612] mb-3"
                    style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-[#6b6258] leading-relaxed"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {description}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-[#ede8e1]">
                  <span
                    className="text-xs font-semibold text-[#ff6600] tracking-wide"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    Ver ejemplo →
                  </span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

      </div>
    </section>
  );
}
