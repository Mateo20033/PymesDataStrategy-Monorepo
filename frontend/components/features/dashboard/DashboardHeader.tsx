import { type ReactNode } from "react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function DashboardHeader({
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between pb-6 border-b-2 border-black mb-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {description && (
          <p className="mt-1 text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
