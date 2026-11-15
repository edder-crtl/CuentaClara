import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta configurar ${name} en .env.local.`);
  }
  return value;
}

if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
  throw new Error("No se permite crear usuarios de prueba en producción.");
}

if (process.env.ALLOW_TEST_USER_SEED !== "true") {
  throw new Error("Activa ALLOW_TEST_USER_SEED=true solo para desarrollo local.");
}

const supabaseUrl = requiredEnv("SUPABASE_URL");
const parsedUrl = new URL(supabaseUrl);
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsedUrl.hostname)) {
  throw new Error("El usuario de prueba solo se puede crear en un Supabase local.");
}

if (requiredEnv("VITE_SUPABASE_URL") !== supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL y SUPABASE_URL deben apuntar al mismo Supabase local.");
}

if (requiredEnv("VITE_SUPABASE_PUBLISHABLE_KEY") !== requiredEnv("SUPABASE_PUBLISHABLE_KEY")) {
  throw new Error("Las claves publicables del cliente y del servidor deben coincidir.");
}

const email = requiredEnv("TEST_USER_EMAIL");
const password = process.env.TEST_USER_PASSWORD;
if (!password) {
  throw new Error("Falta configurar TEST_USER_PASSWORD en .env.local.");
}
const name = requiredEnv("TEST_USER_NAME");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
if (serviceRoleKey.startsWith("sb_publishable_")) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY debe ser una clave secreta de servidor.");
}

function createSupabaseFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      (apiKey.startsWith("sb_publishable_") || apiKey.startsWith("sb_secret_")) &&
      headers.get("Authorization") === `Bearer ${apiKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  global: { fetch: createSupabaseFetch(serviceRoleKey) },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { nombre: name },
});

if (error) {
  throw new Error(`No se pudo crear el usuario de prueba: ${error.message}`);
}

console.log(`Usuario de prueba creado: ${name} (${data.user.email}).`);
