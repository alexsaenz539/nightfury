# Supabase · Night Fury Tattoo

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**, pega y ejecuta [`schema.sql`](./schema.sql).
3. En **Authentication > Users**, crea manualmente la cuenta de Jacqueline. No habilites registro público.
4. En el SQL Editor, ejecuta la última sentencia comentada de `schema.sql`, reemplazando el correo, para promover esa cuenta a `admin`.
5. Configura en el frontend únicamente la URL del proyecto y la publishable/anon key. Nunca expongas `service_role`.
6. Entra a `/admin` con esa cuenta. Desde ahí crea la configuración, hero, estilos, trabajos de portafolio y preguntas frecuentes. La landing no publica datos demo si estas tablas están vacías.

El bucket `night-fury-media` acepta imágenes de hasta 10 MB y video MP4. La landing solo puede consultar contenido publicado o visible; las solicitudes de cotización solo pueden leerse desde una cuenta administradora.
