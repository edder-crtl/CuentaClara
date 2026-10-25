import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — CUENTACLARA" },
      {
        name: "description",
        content:
          "Ingresa o crea tu cuenta para guardar simulaciones, solicitudes y tablas de amortización.",
      },
      { property: "og:title", content: "Entrar — CUENTACLARA" },
      {
        property: "og:description",
        content: "Accede a tus solicitudes de crédito y tu cartera guardada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modo, setModo] = useState<"entrar" | "registrar" | "recuperar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setCargando(false);
      if (error) {
        toast.error(
          error.message.toLowerCase().includes("confirm")
            ? "Debes confirmar tu correo antes de entrar. Revisa tu bandeja."
            : "Correo o contraseña incorrectos",
        );
        return;
      }
      toast.success("Bienvenido de vuelta");
      navigate({ to: "/" });
      return;
    }
    if (modo === "recuperar") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setCargando(false);
      if (error) {
        toast.error("No pudimos enviar el correo. Revisa que esté bien escrito.");
        return;
      }
      setCorreoEnviado(email);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
        emailRedirectTo: window.location.origin,
      },
    });
    setCargando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setCorreoEnviado(email);
      return;
    }
    toast.success("Cuenta creada. Bienvenido.");
    navigate({ to: "/" });
  }

  async function google() {
    const result = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (result.error) {
      toast.error("No se pudo iniciar sesión con Google");
      return;
    }
  }

  if (correoEnviado) {
    return (
      <AppShell>
        <section className="settle-in mx-auto max-w-md border border-line bg-card p-6 text-center sm:p-8">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-ok/10 text-ok">
            <MailCheck className="size-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Enviamos un enlace a <span className="font-semibold text-ink">{correoEnviado}</span>.
            Ábrelo para continuar. Si no lo ves, revisa la carpeta de spam.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCorreoEnviado(null);
              setModo("entrar");
            }}
            className="mt-6 h-11 w-full bg-paper shadow-none"
          >
            Volver a entrar
          </Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="settle-in mx-auto max-w-md border border-line bg-card p-6 sm:p-8">
        <p className="mb-2 text-sm text-ink-soft">CUENTACLARA</p>
        <h1 className="font-display text-2xl font-bold">
          {modo === "entrar" && "Entrar a tu cuenta"}
          {modo === "registrar" && "Crear cuenta"}
          {modo === "recuperar" && "Recuperar contraseña"}
        </h1>
        <p className="mt-1 text-xs text-ink-soft">
          {modo === "recuperar"
            ? "Te enviamos un enlace a tu correo para crear una contraseña nueva."
            : "Guarda simulaciones, solicitudes y tablas de amortización."}
        </p>

        <form onSubmit={enviar} className="mt-4 space-y-3">
          {modo === "registrar" && (
            <label className="block">
              <span className="text-xs font-semibold">Nombre o razón social</span>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
                placeholder="Panadería La Espiga"
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-semibold">Correo</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
              placeholder="tu@correo.com"
            />
          </label>
          {modo !== "recuperar" && (
            <label className="block">
              <span className="text-xs font-semibold">Contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm outline-none focus:border-accent"
              />
            </label>
          )}
          <Button
            type="submit"
            disabled={cargando}
            className="h-11 w-full bg-accent text-paper hover:bg-accent/90"
          >
            {modo === "entrar" && "Entrar"}
            {modo === "registrar" && "Crear cuenta"}
            {modo === "recuperar" && "Enviar enlace"}
          </Button>
        </form>

        {modo === "entrar" && (
          <button
            type="button"
            onClick={() => setModo("recuperar")}
            className="mt-3 w-full text-center text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Olvidé mi contraseña
          </button>
        )}

        {modo !== "recuperar" && (
          <Button
            type="button"
            variant="outline"
            onClick={google}
            className="mt-3 h-11 w-full bg-paper shadow-none"
          >
            Continuar con Google
          </Button>
        )}

        <Button
          type="button"
          variant="link"
          onClick={() => setModo(modo === "entrar" ? "registrar" : "entrar")}
          className="mt-4 w-full font-mono text-[11px] font-bold uppercase text-accent"
        >
          {modo === "entrar" ? "No tengo cuenta" : "Ya tengo cuenta"}
        </Button>
      </section>
    </AppShell>
  );
}
