import { ShieldCheck, Lock, Eye } from "lucide-react";
import { FadeUp } from "@/components/ui";

const pillars = [
  { icon: ShieldCheck, text: "Sin transmisión de datos personales" },
  { icon: Eye, text: "Solo metadatos estructurales" },
  { icon: Lock, text: "Procesamiento local del archivo" },
];

export function SecurityBadge() {
  return (
    <section id="seguridad" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Texto */}
        <div>
          <FadeUp>
            <span
              className="inline-block bg-[#fef3c7] text-[#d97706] text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-full mb-8"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Próximamente
            </span>
          </FadeUp>

          <FadeUp delay={80}>
            <h2
              className="text-[#1a1612] leading-tight mb-6"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
            >
              Tus datos nunca{" "}
              <span className="text-[#ff6600]">salen del servidor</span>
            </h2>
          </FadeUp>

          <FadeUp delay={160}>
            <p
              className="text-[#6b6258] text-lg leading-relaxed mb-10"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Con <strong className="text-[#1a1612] font-semibold">Inferencia Estratégica</strong>, el
              modelo de IA analiza únicamente los metadatos estructurales — tipos de columna,
              patrones estadísticos y rangos — sin procesar el contenido sensible de tus registros.
            </p>
          </FadeUp>

          <FadeUp delay={240}>
            <div className="space-y-3">
              {pillars.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#f7f5f2] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[#ff6600]" strokeWidth={2} />
                  </div>
                  <span
                    className="text-[#1a1612] font-medium"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>

        {/* Visual */}
        <FadeUp delay={120}>
          <div className="relative flex items-center justify-center">
            <div
              className="absolute w-72 h-72 rounded-full opacity-10 blur-3xl"
              style={{ background: "#ff6600" }}
              aria-hidden
            />
            <div className="relative bg-[#1a1612] rounded-2xl p-12 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#ff6600] flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(255,102,0,.4)]">
                <Lock size={36} className="text-white" strokeWidth={1.5} />
              </div>
              <h3
                className="text-white mb-3"
                style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", fontWeight: 700 }}
              >
                Inferencia Estratégica
              </h3>
              <p
                className="text-[#9c9189] text-sm leading-relaxed"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Metadatos únicamente. Jamás el contenido real de tus celdas.
              </p>
            </div>
          </div>
        </FadeUp>

      </div>
    </section>
  );
}
