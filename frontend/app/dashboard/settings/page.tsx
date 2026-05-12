"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, { error: "El nombre debe tener al menos 2 caracteres" }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const inputBase = cn(
  "w-full px-4 py-2.5 rounded-xl border border-[#ede8e1] bg-white",
  "text-sm text-[#1a1612] placeholder:text-[#9c9189]",
  "focus:outline-none focus:border-[#ff6600] focus:ring-[3px] focus:ring-[rgba(255,102,0,.10)]",
  "transition-[border-color,box-shadow] duration-150 ease-out"
);

export default function SettingsPage() {
  const { user, accessToken } = useAuth();
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = profileSchema.safeParse({ name });
    if (!result.success) {
      const fieldErrors: Partial<ProfileFormData> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileFormData;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.patch(
        API_ENDPOINTS.auth.updateMe(),
        { name: result.data.name },
        accessToken
      );
      toast.success("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      toast.error("Error al guardar los cambios. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 py-8">

        {/* Header */}
        <div className="flex justify-between items-end mb-8 pb-6 border-b border-[#ede8e1]">
          <div>
            <h2
              className="text-[#1a1612] leading-tight"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700 }}
            >
              Configuración
            </h2>
            <p
              className="text-[#6b6258] text-sm mt-1"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Gestiona tu perfil y preferencias de cuenta.
            </p>
          </div>
        </div>

        <div className="max-w-lg space-y-6">

          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-[#ede8e1] p-6 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl bg-[#ff6600] text-white font-bold text-xl flex items-center justify-center shrink-0"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p
                className="font-semibold text-[#1a1612] text-sm truncate"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {user?.name ?? "—"}
              </p>
              <p
                className="text-xs text-[#6b6258] mt-0.5 truncate"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {user?.email ?? "—"}
              </p>
            </div>
          </div>

          {/* Profile form */}
          <div className="bg-white rounded-xl border border-[#ede8e1] p-6">
            <h3
              className="text-xs font-semibold tracking-widest uppercase text-[#6b6258] mb-5"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Perfil de Usuario
            </h3>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Nombre */}
              <div>
                <label
                  htmlFor="settings-name"
                  className="block text-xs font-semibold uppercase tracking-wide text-[#6b6258] mb-1.5"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Nombre
                </label>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  disabled={isSaving}
                  className={cn(inputBase, errors.name && "border-red-400 focus:border-red-400 focus:ring-red-100")}
                  style={{ fontFamily: "var(--font-sans)" }}
                />
                {errors.name && (
                  <p
                    className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-500"
                    style={{ fontFamily: "var(--font-sans)" }}
                  >
                    <AlertCircle className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email read-only */}
              <div>
                <label
                  htmlFor="settings-email"
                  className="block text-xs font-semibold uppercase tracking-wide text-[#6b6258] mb-1.5"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Correo Electrónico
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                  className={cn(
                    inputBase,
                    "bg-[#f7f5f2] text-[#9c9189] cursor-not-allowed focus:ring-0 focus:border-[#ede8e1]"
                  )}
                  style={{ fontFamily: "var(--font-sans)" }}
                />
                <p
                  className="mt-1.5 text-xs text-[#9c9189]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  El correo electrónico no se puede modificar.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSaving}
                className={cn(
                  "w-full py-2.5 px-6 rounded-xl font-semibold text-sm",
                  "bg-[#ff6600] text-white hover:bg-[#e55a00]",
                  "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-[background-color,transform] duration-150 ease-out",
                  "flex items-center justify-center gap-2"
                )}
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="bg-white rounded-xl border border-[#ede8e1] p-6">
            <h3
              className="text-xs font-semibold tracking-widest uppercase text-[#6b6258] mb-4"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Cuenta
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm font-semibold text-[#1a1612]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Plan actual
                </p>
                <p
                  className="text-xs text-[#6b6258] mt-0.5"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  Free — hasta 3 datasets activos
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#f7f5f2] text-[#6b6258] border border-[#ede8e1]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Free
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
