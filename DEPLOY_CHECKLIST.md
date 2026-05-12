# Deploy Checklist Visibly

Checklist para subir `visibly.cl` a DigitalOcean.

## 1. Datos Que Faltan Antes De Deploy

- App Password de Google para `hola@visibly.cl`.
- URL final del Web App de Google Apps Script conectada.
- Google Sheet de produccion: `1SSKvxhRQpULQYELr1RFUZ6lNjrgxC6Vbd4XG7OkRjf0`.
- Link final de agenda/Google Calendar para consultas conectado.
- Datos bancarios reales para la consulta.
- Telefono real de contacto si se mostrara en la web.

## 2. Archivos A Actualizar

- `.env` en el servidor, basado en `.env.production.example`.
- `forms/cliente-intake/visibly_apps_script.gs`: pegar version actualizada en Google Apps Script y publicar nueva implementacion.

## 3. DNS

- `A visibly.cl` apuntando a la IP del Droplet.
- `CNAME www` apuntando a `visibly.cl`.
- Mantener MX de Google Workspace.
- Mantener TXT SPF, DKIM y DMARC ya configurados.

## 4. Backend En El Droplet

```bash
cd /var/www/visibly-web/backend
npm install --omit=dev
cp ../.env.production.example .env
nano .env
node --check server.js
node server.js
```

Cuando el servidor responda bien:

```bash
npm install -g pm2
pm2 start server.js --name visibly-backend
pm2 save
pm2 startup
```

## 5. Nginx

Configurar Nginx para servir los archivos estaticos y pasar `/api` al backend.

```nginx
server {
    listen 80;
    server_name visibly.cl www.visibly.cl;

    root /var/www/visibly-web;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Luego:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d visibly.cl -d www.visibly.cl
```

## 6. Pruebas Finales

- Abrir `https://visibly.cl`.
- Abrir `https://visibly.cl/api/health`.
- Enviar una cotizacion desde la calculadora.
- Confirmar correo al cliente.
- Confirmar aviso en `hola@visibly.cl`.
- Confirmar copia en `domen.newman@gmail.com`.
- Abrir link de `visibly_consulta` generado por correo.
- Abrir link de `visibly_diagnostico` generado por correo.
- Enviar formulario de consulta.
- Enviar formulario de diagnostico.
- Confirmar que el Google Sheet recibe datos.
- Probar en celular.
- Revisar consola del navegador.

## 7. Pendiente Post Deploy

- Dejar DMARC en `p=none` unos dias.
- Si todo envia bien y no hay otros servicios mandando como `@visibly.cl`, subir DMARC gradualmente a `quarantine`.
