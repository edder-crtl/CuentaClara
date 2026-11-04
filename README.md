# CUENTACLARA

Simulador de crédito para pequeñas empresas en Colombia. La aplicación usa TanStack Start, React, Vite y Supabase.

## Desarrollo local

Requisitos: Bun y las variables de entorno de Supabase.

```sh
bun install
bun run dev
```

## Variables de entorno

Configura estas variables en un archivo `.env` local y en el entorno de despliegue:

| Variable | Uso |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase para el cliente web |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publicable para el cliente web |
| `SUPABASE_URL` | URL del proyecto Supabase en el servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable para el servidor |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta para operaciones administrativas del servidor |
| `XAI_API_KEY` | Clave secreta de xAI para generar recomendaciones con Grok |
| `GROK_MODEL` | Identificador del modelo; por defecto, `grok-4.7` |

Las claves `VITE_*` se incluyen en el navegador; solo deben contener valores publicables. Nunca expongas una clave `service_role` en el cliente ni la incluyas en una variable `VITE_*`.

Las recomendaciones usan la API de Responses de xAI y el modelo `grok-4.7`. En desarrollo local, configura `XAI_API_KEY` con tu clave de xAI y `GROK_MODEL=grok-4.7`; puedes cambiar el identificador por otro modelo disponible en tu cuenta. En Docker Compose o en el despliegue, configura ambas variables en el servidor. La clave se usa solo en el servidor: no le agregues el prefijo `VITE_`. La función no envía datos a xAI hasta que la persona marca la autorización y solicita el análisis. En ese momento se envían el texto extraído del documento y las deudas confirmadas. Los PDF escaneados como imagen no tienen OCR.

## Despliegue con Docker

Desde `grow-your-loan`, configura las variables necesarias en un archivo `.env` y ejecuta:

```sh
docker compose up --build -d
```

La aplicación queda disponible en `http://localhost:3000` (o en el puerto definido por `PORT`). Consulta los registros con `docker compose logs -f web`.

## Despliegue en Vercel

1. Importa el repositorio de GitHub en Vercel y selecciona la carpeta `grow-your-loan` como raíz del proyecto si el repositorio contiene otras carpetas.
2. Usa `bun install` como comando de instalación y `bun run build` como comando de compilación. La configuración de Nitro genera el despliegue de servidor para Vercel.
3. Añade las variables de Supabase necesarias y `XAI_API_KEY` y `GROK_MODEL` en la configuración del proyecto de Vercel para Preview y Production. Mantén `SUPABASE_SERVICE_ROLE_KEY` y `XAI_API_KEY` como variables secretas del servidor.
4. Después del primer despliegue, agrega el dominio `*.vercel.app` asignado por Vercel a las URL permitidas de Supabase Authentication. Configura la URL de producción del sitio y las URL de redirección de autenticación.
5. Prueba el registro, el inicio de sesión, la recuperación de contraseña y las rutas protegidas con el dominio de Vercel.

La autenticación y la base de datos continúan alojadas en el proyecto de Supabase existente.
