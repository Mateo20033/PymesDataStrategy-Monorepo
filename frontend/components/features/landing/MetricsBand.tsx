import { FadeUp } from "@/components/ui";

const metrics = [
  { value: "50k", label: "Registros por Archivo" },
  { value: "<3m", label: "Tiempo de Procesamiento" },
  { value: "100%", label: "Trazabilidad para Auditoría" },
];

export function MetricsBand() {
  return (
    <section className="bg-[#1a1612] py-16 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2e2924]">
        {metrics.map(({ value, label }, i) => (
          <FadeUp key={label} delay={i * 80}>
            <div className="bg-[#1a1612] px-10 py-10 text-center">
              <div
                className="text-[#ff6600] mb-2 leading-none"
                style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 7vw, 5rem)", fontWeight: 700 }}
              >
                {value}
              </div>
              <div
                className="text-[#9c9189] text-sm font-medium tracking-wide uppercase"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {label}
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}
