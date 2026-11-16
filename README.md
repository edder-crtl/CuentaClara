# CUENTACLARA

Simulador de crédito para pequeñas empresas en Colombia. La aplicación usa TanStack Start, React, Vite y Supabase.

## Desarrollo local

Requisitos: Bun y las variables de entorno de Supabase.

```sh
bun install
bun run dev
```

## Variables de entorno

Configura las variables de Supabase en un archivo `.env.local` local y en el entorno de despliegue. Puedes copiar `.env.example` para desarrollo; reemplaza sus valores de ejemplo por los que muestra `supabase status` al iniciar Supabase local.

| Variable | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase para el cliente web |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publicable para el cliente web |
| `SUPABASE_URL` | URL del proyecto Supabase en el servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable para el servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta para operaciones administrativas del servidor |
| `GROQ_API_KEY` | Clave secreta de Groq para generar recomendaciones |
| `GROQ_MODEL` | Identificador del modelo; por defecto, `openai/gpt-oss-120b` |

Las claves `VITE_*` se incluyen en el navegador; solo deben contener valores publicables. Nunca expongas una clave `service_role` en el cliente ni la incluyas en una variable `VITE_*`.

### Conectar un proyecto Supabase nuevo

La configuración local de Supabase no está vinculada a un proyecto remoto específico. Para conectar otro proyecto:

1. Crea el proyecto en Supabase y, en **Project Settings → API**, copia el **Project URL**, la clave **publishable** (`sb_publishable_...`) y la clave **secret** (`sb_secret_...`) para el servidor. No compartas la clave secret ni la guardes en Git.
2. En `.env.local`, configura `VITE_SUPABASE_URL` y `SUPABASE_URL` con el Project URL; configura `VITE_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_PUBLISHABLE_KEY` con la clave publicable. Configura `SUPABASE_SERVICE_ROLE_KEY` con la clave secret solo si vas a usar funciones de administración del servidor.
3. En la terminal, inicia sesión y enlaza las migraciones al Project ID que aparece en el URL del proyecto:

   ```sh
   supabase login
   supabase link --project-ref <project-id-nuevo>
   supabase db push
   ```

4. En **Authentication → URL Configuration**, configura la URL de la app y sus redirecciones. En **Authentication → Providers**, habilita los métodos de inicio de sesión que vayas a ofrecer.
5. Si el proyecto anterior tenía usuarios o datos que necesitas conservar, expórtalos e impórtalos por separado; cambiar las variables conecta la app al proyecto nuevo, pero no migra datos.

La app ya no selecciona el proyecto remoto anterior desde `supabase/config.toml`. Desconectarlo no elimina ni modifica ese proyecto ni sus datos.

## Autenticación y usuarios

La aplicación usa Supabase Auth: las cuentas se guardan en el esquema protegido `auth.users`, aparte de los datos de la aplicación. El perfil complementario está en `public.profiles`; las políticas RLS restringen cada fila al usuario cuyo ID coincide con `auth.uid()`. El rol se guarda por separado en `public.user_roles`: el registro público siempre crea usuarios `user`, cada cuenta puede consultar su propio rol y solo una operación administrativa puede cambiarlo. El cliente de navegador y el servidor deben apuntar al mismo proyecto de Supabase. La clave `SUPABASE_SERVICE_ROLE_KEY` es solo para el servidor y nunca debe tener el prefijo `VITE_`.

### Crear una cuenta admin y una user

Las cuentas se crean en Supabase; no pongas correos ni contraseñas reales en el código o en Git. En el proyecto correcto, abre **Authentication → Users → Add user → Create new user** y crea las dos cuentas con correos y contraseñas seguras (de al menos 12 caracteres). Confirma los correos si el proyecto lo requiere. El trigger crea automáticamente un perfil y asigna el rol `user` a cada cuenta nueva.

Para dar permisos de administrador solo a la primera cuenta, abre **SQL Editor**, cambia el correo de ejemplo y ejecuta:

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@tudominio.com'
);
```

La consulta debe afectar una fila. La segunda cuenta conserva el rol `user`; puedes comprobar ambos roles así:

```sql
SELECT u.email, r.role
FROM auth.users AS u
JOIN public.user_roles AS r ON r.user_id = u.id
WHERE u.email IN ('admin@tudominio.com', 'usuario@tudominio.com');
```

Aplica las migraciones al mismo proyecto al que apunta la app (`supabase db push` para el proyecto enlazado, o `supabase migration up` en local) antes de crear cuentas. El rol establece una base segura para diferenciar cuentas; la app todavía no incluye un panel ni acciones administrativas específicas. Antes de añadirlos, cada acción de admin también debe verificarse en el servidor o con políticas RLS; ocultar botones en el navegador no protege datos.

El inicio de sesión con Google ya está integrado en `/auth`. Para activarlo:

1. Crea credenciales OAuth de tipo aplicación web en Google Cloud Console.
2. En Supabase, abre **Authentication → Providers → Google**, actívalo y registra allí el Client ID y el Client Secret. No los agregues al repositorio ni los compartas en el chat.
3. Copia en Google la URL de callback que muestra esa pantalla de Supabase.
4. En **Authentication → URL Configuration** de Supabase, configura la URL de tu aplicación y agrega las URL de desarrollo y producción a la lista de redirecciones permitidas.
5. En la configuración de autenticación de Supabase, exige contraseñas de al menos 12 caracteres, activa la protección contra contraseñas filtradas si está disponible y limita los intentos de autenticación.

### Usuario de prueba local

El usuario de prueba está limitado deliberadamente a un Supabase local; el script rechaza direcciones de proyectos remotos y entornos de producción. No uses estas credenciales en producción.

1. Inicia el Supabase local con `supabase start`.
2. Copia `.env.example` a `.env.local` y reemplaza las claves de ejemplo por la URL, la clave publicable y la clave `service_role` que muestra `supabase status`.
3. Conserva las credenciales de prueba de `.env.example` o cámbialas en `.env.local`. Ese archivo está excluido de Git.
4. Ejecuta `bun run seed:test-user`. Se creará una cuenta confirmada por correo; el trigger de la base crea su perfil automáticamente.

El script requiere `ALLOW_TEST_USER_SEED=true` y solo acepta `localhost`, `127.0.0.1` o `::1`; no crea cuentas en el Supabase alojado.

Las recomendaciones usan la API de chat completions de Groq y el modelo `openai/gpt-oss-120b`. En desarrollo local, configura `GROQ_API_KEY` con una clave creada en Groq; `GROQ_MODEL` puede cambiarse por otro identificador disponible allí. En Docker Compose o en el despliegue, configura ambas variables en el servidor. La clave se usa solo en el servidor: no le agregues el prefijo `VITE_`. La función no envía datos a Groq hasta que la persona marca la autorización y solicita el análisis. En ese momento se envían el texto extraído del documento y las deudas confirmadas. Los PDF escaneados como imagen no tienen OCR.

## Despliegue con Docker

Desde `grow-your-loan`, configura las variables necesarias en un archivo `.env` y ejecuta:

```sh
docker compose up --build -d
```

La aplicación queda disponible en `http://localhost:3000` (o en el puerto definido por `PORT`). Consulta los registros con `docker compose logs -f web`.

## Despliegue en Vercel

1. Importa el repositorio de GitHub en Vercel y selecciona la carpeta `grow-your-loan` como raíz del proyecto si el repositorio contiene otras carpetas.
2. Usa `bun install` como comando de instalación y `bun run build` como comando de compilación. La configuración de Nitro genera el despliegue de servidor para Vercel.
3. Añade las variables de Supabase necesarias y `GROQ_API_KEY` y `GROQ_MODEL` en la configuración del proyecto de Vercel para Preview y Production. Mantén `SUPABASE_SERVICE_ROLE_KEY` y `GROQ_API_KEY` como variables secretas del servidor.
4. Después del primer despliegue, agrega el dominio `*.vercel.app` asignado por Vercel a las URL permitidas de Supabase Authentication. Configura la URL de producción del sitio y las URL de redirección de autenticación.
5. Configura Google OAuth en Supabase con las URL de producción y prueba el registro, el inicio de sesión y la recuperación de contraseña con el dominio de Vercel.

La autenticación y la base de datos continúan alojadas en el proyecto de Supabase configurado mediante variables de entorno.
