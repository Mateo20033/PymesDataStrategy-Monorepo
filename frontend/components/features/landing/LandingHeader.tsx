"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/ui";

const navLinks = [
  { href: "#como-funciona", label: "Cómo Funciona" },
  { href: "#beneficios", label: "Beneficios" },
  { href: "#seguridad", label: "Seguridad IA" },
  { href: "#faq", label: "FAQ" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-[background-color,box-shadow] duration-200 ease-out"
      style={{
        backgroundColor: scrolled ? "rgba(247,245,242,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,.06)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <LogoMark size={26} color="#ff6600" />
          <span
            className="font-bold text-base text-[#1a1612] transition-colors duration-150 ease-out group-hover:text-[#ff6600]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
          >
            PYMES-AI
          </span>
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="relative px-3 py-1.5 text-sm font-medium text-[#6b6258] rounded-lg
                transition-colors duration-150 ease-out
                hover:text-[#1a1612] hover:bg-[#ede8e1]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTAs */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-medium text-[#6b6258] px-4 py-2 rounded-lg
              transition-colors duration-150 ease-out
              hover:text-[#1a1612] hover:bg-[#ede8e1]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold bg-[#ff6600] text-white px-4 py-2 rounded-lg
              transition-[background-color,box-shadow,transform] duration-150 ease-out
              hover:bg-[#e55a00] hover:shadow-[0_4px_16px_rgba(255,102,0,.35)]
              active:scale-[0.97]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Dashboard →
          </Link>
        </div>
      </div>
    </header>
  );
}
