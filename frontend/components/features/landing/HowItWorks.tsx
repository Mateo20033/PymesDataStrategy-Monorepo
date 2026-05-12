import { UploadCloud, Cpu, CheckCircle2 } from "lucide-react";
import { FadeUp } from "@/components/ui";

const steps = [
  {
    number: "01",
    icon: UploadCloud,
    title: "Carga Segura",
    description:
      "Sube tu archivo Excel o CSV. Todos los datos viajan cifrados y se almacenan en un entorno seguro y aislado.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "Inferencia IA",
    description:
      "El agente detecta tipos de datos, inconsistencias y errores, y aplica transformaciones inteligentes automáticamente.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Tú Apruebas",
    description:
      "Revisas cada cambio propuesto, aceptas o rechazas con un clic, y descargas el archivo limpio con reporte de auditoría.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">

        <FadeUp>
          <div className="mb-20">
            <p
              className="text-[#ff6600] text-sm font-semibold tracking-widest uppercase mb-4"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              El proceso
            </p>
            <h2
              className="text-[#1a1612] leading-tight max-w-xl"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
            >
              Cómo Funciona
            </h2>
          </div>
        </FadeUp>

        <div className="space-y-px">
          {steps.map(({ number, icon: Icon, title, description }, i) => (
            <FadeUp key={number} delay={i * 100}>
              <div className="group grid grid-cols-[80px_1fr_auto] md:grid-cols-[120px_1fr_auto] items-center gap-6 md:gap-12 py-8 border-t border-[#ede8e1] last:border-b">

                {/* Número */}
                <span
                  className="text-[#d4cfc8] group-hover:text-[#ff6600] transition-colors duration-200 ease-out"
                  style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700 }}
                >
                  {number}
                </span>

                {/* Contenido */}
                <div>
                  <h3
                    className="text-[#1a1612] mb-2"
                    style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", fontWeight: 700 }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-[#6b6258] leading-relaxed max-w-xl"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {description}
                  </p>
                </div>

                {/* Icono */}
                <div className="w-12 h-12 rounded-xl bg-[#f7f5f2] group-hover:bg-[#fff0e6] flex items-center justify-center shrink-0 transition-colors duration-200 ease-out">
                  <Icon size={22} className="text-[#6b6258] group-hover:text-[#ff6600] transition-colors duration-200 ease-out" strokeWidth={1.5} />
                </div>

              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
