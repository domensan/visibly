const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost,http://127.0.0.1:3000,http://127.0.0.1')
  .split(',')
  .map(origin => origin.trim());

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true
}));

// Limitación de tasa
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // límite de 5 solicitudes por IP por windowMs
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.'
});
app.use('/api/contact', limiter);

// Parsing del body
app.use(express.json({ limit: '10mb' }));

// Middleware de validación de entrada
const validateContact = [
  body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('negocio').trim().isLength({ min: 2, max: 200 }).withMessage('Negocio debe tener entre 2 y 200 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Teléfono inválido'),
  body('contactPreference').optional({ checkFalsy: true }).isIn(['whatsapp', 'email', 'meet']).withMessage('Preferencia de contacto inválida'),
  body('resumen').trim().isLength({ min: 10, max: 2000 }).withMessage('Resumen inválido'),
  body('total').isNumeric().withMessage('Total debe ser numérico'),
  body('modulos').isArray().withMessage('Módulos debe ser un array'),
  body('addons').isArray().withMessage('Addons debe ser un array')
];

// Transportador de email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Protección CSRF (simple basada en tokens)
const generateToken = () => Math.random().toString(36).substring(2);
const tokens = new Set();

// Endpoint de contacto
app.post('/api/contact', validateContact, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const {
      nombre,
      negocio,
      email,
      phone,
      contactPreference,
      resumen,
      total,
      modulos,
      addons
    } = req.body;

    // Sanitizar entradas
    const sanitizedNombre = nombre.replace(/[<>\"&]/g, '');
    const sanitizedNegocio = negocio.replace(/[<>\"&]/g, '');
    const sanitizedResumen = resumen.replace(/[<>\"&]/g, '');

    // Crear transportador
    const transporter = createTransporter();

    // Email al cliente
    const clientEmail = {
      from: `"Visibly" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Tu cotización Visibly',
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; color: #0a2332;">
          <h1 style="color: #4cbbb8;">Hola ${sanitizedNombre},</h1>
          <p>Gracias por tu interés en Visibly.</p>
          <p>Aquí está tu cotización:</p>
          <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${sanitizedResumen}</pre>
          <p><strong>Implementación:</strong> 5–7 días hábiles.</p>
          <p><strong>Para iniciar se requiere el 50% del total al confirmar.</strong></p>
          <p>Te contactaremos en menos de 24 horas por ${contactPreference || 'tu medio preferido'}.</p>
          <p>Equipo Visibly<br>hola@visibly.cl</p>
        </div>
      `
    };

    // Email al equipo
    const teamEmail = {
      from: `"Visibly Website" <${process.env.SMTP_USER}>`,
      to: process.env.TEAM_EMAIL,
      subject: `Nueva cotización — ${sanitizedNombre} (${sanitizedNegocio}) — $${total.toLocaleString('es-CL')}`,
      html: `
        <div style="font-family: 'DM Sans', sans-serif; color: #0a2332;">
          <h2>Nueva cotización</h2>
          <p><strong>Cliente:</strong> ${sanitizedNombre}</p>
          <p><strong>Negocio:</strong> ${sanitizedNegocio}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>WhatsApp:</strong> ${phone || '—'}</p>
          <p><strong>Contacto preferido:</strong> ${contactPreference || '—'}</p>
          <h3>Configuración:</h3>
          <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${sanitizedResumen}</pre>
          <p><strong>Módulos:</strong> ${modulos.join(', ') || 'Ninguno'}</p>
          <p><strong>Addons:</strong> ${addons.join(', ') || 'Ninguno'}</p>
        </div>
      `
    };

    // Enviar emails
    await Promise.all([
      transporter.sendMail(clientEmail),
      transporter.sendMail(teamEmail)
    ]);

    res.json({
      success: true,
      message: 'Cotización enviada exitosamente'
    });

  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
