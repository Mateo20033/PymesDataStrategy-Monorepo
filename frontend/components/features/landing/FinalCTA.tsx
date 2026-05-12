import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeUp } from "@/components/ui";

export function FinalCTA() {
  return (
    <section className="py-32 px-6 bg-[#ff6600] overflow-hidden relative">

      {/* Textura sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, #000 0px, #000 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #000 0px, #000 1px, transparent 1px, transparent 40px)",
        }}
        aria-hidden
      />

      <div className="relative max-w-5xl mx-auto text-center">

        <FadeUp>
          <h2
            className="text-white leading-[0.9] mb-10"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(3rem, 10vw, 8rem)", fontWeight: 700 }}
          >
            Deja de limpiar
            <br />
            manualmente.
            <br />
            <span className="opacity-60">Empieza a decidir.</span>
          </h2>
        </FadeUp>

        <FadeUp delay={120}>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 bg-white text-[#1a1612] font-bold text-lg px-8 py-4 rounded-xl
              transition-[background-color,box-shadow,transform] duration-150 ease-out
              hover:bg-[#1a1612] hover:text-white hover:shadow-[0_16px_48px_rgba(0,0,0,.3)]
              active:scale-[0.97]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Probar el MVP
            <ArrowRight
              size={18}
              strokeWidth={2.5}
              className="transition-transform duration-150 ease-out group-hover:translate-x-1"
            />
          </Link>
        </FadeUp>

      </div>
    </section>
  );
}
