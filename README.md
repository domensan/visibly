# Visibly™ — Activación Digital para Profesionales

Activamos tu presencia digital para que tus próximos clientes lleguen a ti — no a la competencia.

## Descripción del Proyecto

Visibly es una plataforma de activación digital diseñada para profesionales que quieren ser encontrados online. Ofrecemos servicios modulares de sitio web, redes sociales, marca personal y branding, con un enfoque en resultados medibles y procesos transparentes.

## Tecnologías

- **Frontend**: HTML5, CSS3 (sin frameworks), Vanilla JavaScript ES6+
- **Backend**: Node.js con Express
- **Email**: Nodemailer con SMTP
- **Seguridad**: Helmet, CORS, rate limiting, input validation
- **Despliegue**: Nginx + Ubuntu/Debian VPS

## Instalación y Desarrollo Local

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Un servidor SMTP (Gmail recomendado)

### Configuración

1. Clona el repositorio:
   ```bash
   git clone <repository-url>
   cd visibly-web
   ```

2. Instala dependencias del backend:
   ```bash
   cd backend
   npm install
   ```

3. Copia el archivo de variables de entorno:
   ```bash
   cp ../.env.example .env
   ```

4. Configura las variables de entorno en `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password
   TEAM_EMAIL=equipo@visibly.cl
   FRONTEND_URL=http://localhost:3000
   PORT=3001
   ```

   **Nota**: Para Gmail, necesitas generar una "App Password" en tu cuenta de Google.

5. Inicia el servidor backend:
   ```bash
   npm run dev  # Para desarrollo con nodemon
   # o
   npm start    # Para producción
   ```

6. Abre `index.html` en tu navegador o sirve los archivos estáticos.

## Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SMTP_HOST` | Host del servidor SMTP | `smtp.gmail.com` |
| `SMTP_PORT` | Puerto SMTP | `587` |
| `SMTP_SECURE` | Conexión segura (true/false) | `false` |
| `SMTP_USER` | Usuario SMTP | `tu-email@gmail.com` |
| `SMTP_PASS` | Contraseña SMTP | `tu-app-password` |
| `TEAM_EMAIL` | Email del equipo | `equipo@visibly.cl` |
| `FRONTEND_URL` | URL del frontend | `http://localhost:3000` |
| `PORT` | Puerto del servidor | `3001` |

## Despliegue en VPS

### Configuración de Nginx

1. Instala Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Configura el sitio:
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;

       root /var/www/visibly-web;
       index index.html;

       location / {
           try_files $uri $uri/ =404;
       }

       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Habilita SSL con Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

4. Configura PM2 para el backend:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name visibly-backend
   pm2 startup
   pm2 save
   ```

## Cómo Actualizar Precios en la Calculadora

Los precios están definidos en `assets/script.js` en las constantes `MODS` y `ADDS`:

```javascript
const MODS = {
  web: { name:'Sitio web', base:400000, mant:70000 },
  rrss: { name:'Redes sociales', base:200000, mant:40000 },
  marca: { name:'Marca personal', base:180000, mant:0 },
  branding: { name:'Branding', base:400000, mant:0 }
};

const ADDS = {
  'web-google': { name:'Google Business optimizado', p:80000 },
  // ... más addons
};
```

Para actualizar:
1. Modifica los valores en `script.js`
2. Reinicia el navegador para ver los cambios
3. Para despliegue, sube los archivos actualizados

## Estructura del Proyecto

```
visibly-web/
├── index.html              # Página principal
├── assets/
│   ├── style.css          # Estilos CSS
│   ├── script.js          # JavaScript del frontend
│   └── logo/              # Logos SVG
├── backend/
│   ├── server.js          # Servidor Node.js
│   └── package.json       # Dependencias backend
├── .env.example           # Variables de entorno ejemplo
├── .gitignore            # Archivos ignorados por Git
└── README.md             # Este archivo
```

## Seguridad

- Validación de entrada del lado del servidor
- Protección CSRF básica
- Rate limiting para prevenir spam
- Sanitización de inputs
- Headers de seguridad con Helmet
- CORS configurado

## Soporte

Para soporte técnico o consultas sobre el proyecto, contacta a hola@visibly.cl

## Licencia

© 2025 Visibly™ · Concón, Chile