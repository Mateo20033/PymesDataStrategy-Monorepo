"use client";

import { usePathname } from "next/navigation";

export function AuthTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="w-full min-h-screen flex items-center justify-center p-8">
      {children}
    </div>
  );
}
