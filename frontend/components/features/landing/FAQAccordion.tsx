"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FadeUp } from "@/components/ui";

const faqItems = [
  {
    question: "¿Qué pasa si mi Excel tiene columnas desordenadas?",
    answer:
      "No hay problema. El sistema analiza automáticamente la estructura de tu archivo, detecta los tipos de datos por columna y aplica las reglas de limpieza de forma independiente. No necesitas reordenar nada antes de subir tu archivo.",
  },
  {
    question: "¿Necesito saber programar para usar las reglas de IA?",
    answer:
      "No. La interfaz está diseñada para usuarios de negocio sin conocimientos técnicos. La IA genera sugerencias en lenguaje natural y tú simplemente apruebas o rechazas cada acción con un clic.",
  },
  {
    question: "¿Cómo se garantiza que no pierdo mi información original?",
    answer:
      "Tu archivo original nunca se modifica. Trabajamos sobre una copia en memoria y te presentamos una vista previa de los cambios antes de aplicarlos. Puedes descargar tanto el archivo limpio como el original en cualquier momento.",
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section id="faq" className="py-24 px-6 bg-[#1a1612]">
      <div className="max-w-4xl mx-auto">

        <FadeUp>
          <h2
            className="text-white text-center mb-16 leading-tight"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 700 }}
          >
            Preguntas Frecuentes
          </h2>
        </FadeUp>

        <div>
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <FadeUp key={index} delay={index * 60}>
                <div className="border-t border-[#2e2924] last:border-b">
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="w-full flex items-start justify-between gap-6 py-7 text-left group"
                    aria-expanded={isOpen}
                  >
                    <span
                      className="text-base font-semibold text-white group-hover:text-[#ff6600] transition-colors duration-150 ease-out"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {item.question}
                    </span>
                    <div className="w-6 h-6 rounded-full border border-[#3a3530] flex items-center justify-center shrink-0 mt-0.5 transition-[border-color,background-color] duration-150 ease-out group-hover:border-[#ff6600]">
                      <Plus
                        size={14}
                        strokeWidth={2.5}
                        className="text-[#6b6258] group-hover:text-[#ff6600] transition-[transform,color] duration-200 ease-out"
                        style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                      />
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="text-[#9c9189] leading-relaxed pb-7"
                        style={{ fontFamily: "var(--font-sans)" }}
                      >
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>

      </div>
    </section>
  );
}
