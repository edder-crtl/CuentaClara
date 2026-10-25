import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña — CUENTACLARA" },
      { name: "description", content: "Crea una contraseña nueva para tu cuenta de CUENTACLARA." },
      { property: "og:title", content: "Nueva contraseña — CUENTACLARA" },
      { property: "og:description", content: "Crea una contraseña nueva para tu cuenta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [esRecuperacion, setEsRecuperacion] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // El enlace del correo llega con #type=recovery en el hash
    if (window.location.hash.includes("type=recovery")) {
      setEsRecuperacion(true);
      return;
    }
    // Con PKCE la sesión de recuperación ya pudo haberse aplicado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEsRecuperacion(Boolean(session));
    });
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmacion) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setCargando(true);
    const { error } = await supabase.auth.updateUser({ password });
    setCargando(false);
    if (error) {
      toast.error("No pudimos guardar la contraseña. Vuelve a pedir el enlace.");
      return;
    }
    toast.success("Contraseña actualizada");
    navigate({ to: "/" });
  }

  return (
    <AppShell>
      <section className="settle-in mx-auto max-w-md border border-line bg-card p-6 sm:p-8">
        <p className="mb-2 text-sm text-ink-soft">CUENTACLARA</p>
        <h1 className="font-display text-2xl font-bold">Crea tu contraseña nueva</h1>

        {esRecuperacion === null && (
          <p className="mt-4 text-sm text-ink-soft">Verificando tu enlace…</p>
        )}

        {esRecuperacion === false && (
          <>
            <p className="mt-4 text-sm text-ink-soft">
              Este enlace venció o ya se usó. Pide uno nuevo desde la pantalla de entrada.
            </p>
            <Button
              type="button"
              onClick={() => navigate({ to: "/auth" })}
              className="mt-6 h-11 w-full bg-accent text-paper hover:bg-accent/90"
            >
              Ir a entrar
            </Button>
          </>
        )}

        {esRecuperacion && (
          <form onSubmit={guardar} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs font-semibold">Contraseña nueva</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold">Repite la contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
              />
            </label>
            <Button
              type="submit"
              disabled={cargando}
              className="h-11 w-full bg-accent text-paper hover:bg-accent/90"
            >
              Guardar contraseña
            </Button>
          </form>
        )}
      </section>
    </AppShell>
  );
}
