import Image from "next/image";
import Link from "next/link";
import { LogoMark } from "@/components/ui";

const productLinks = [
  { label: "Cómo Funciona", href: "#como-funciona" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Seguridad IA", href: "#seguridad" },
  { label: "Dashboard", href: "/dashboard" },
];

const legalLinks = [
  { label: "Términos de Uso", href: "/terminos" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Tratamiento de Datos", href: "/datos" },
  { label: "FAQ", href: "#faq" },
];

export function LandingFooter() {
  return (
    <footer className="bg-[#1a1612] text-white pt-16 pb-10 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12 pb-12 border-b border-[#2e2924]">

          {/* Logo + descripción */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-2">
              <LogoMark size={24} color="#ff6600" />
              <span
                className="font-bold text-base text-white tracking-wide"
                style={{ fontFamily: "var(--font-display)" }}
              >
                PYMES-AI
              </span>
            </Link>
            <p
              className="text-[#6b6258] text-sm leading-relaxed max-w-xs"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Plataforma ETL con Inteligencia Artificial y Human-in-the-Loop
              para PYMES en Bogotá. Limpia, estandariza y audita tus datos en minutos.
            </p>
          </div>

          {/* Producto */}
          <div>
            <h4
              className="text-[#ff6600] text-xs font-semibold tracking-widest uppercase mb-5"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Producto
            </h4>
            <ul className="space-y-3">
              {productLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[#6b6258] hover:text-white text-sm font-medium transition-colors duration-150 ease-out"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              className="text-[#ff6600] text-xs font-semibold tracking-widest uppercase mb-5"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Legal
            </h4>
            <ul className="space-y-3">
              {legalLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[#6b6258] hover:text-white text-sm font-medium transition-colors duration-150 ease-out"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div
            className="text-[#3a3530] text-xs space-y-1 text-center md:text-left"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <p>© 2026 Proyecto de Grado GIIS — SW-005. Fundación Universitaria Compensar.</p>
            <p>Bogotá D.C., Colombia.</p>
          </div>
          <Image
            src="/compensar-logo.png"
            alt="Fundación Universitaria Compensar"
            width={100}
            height={40}
            className="object-contain opacity-30 hover:opacity-60 transition-opacity duration-200 ease-out"
          />
        </div>

      </div>
    </footer>
  );
}
