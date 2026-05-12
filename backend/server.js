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
const SITE_URL = (process.env.SITE_URL || 'http://localhost').replace(/\/$/, '');
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbz-39eh6sNYHCdl6R9eAW6iL-dg9iHMQgTRnMhXk35EZfdzuElpMmwhdQlorx9AYaFc/exec';
const APPS_SCRIPT_TOKEN = process.env.APPS_SCRIPT_TOKEN || 'visibly-relay-2026';
const TEAM_EMAIL = process.env.TEAM_EMAIL || 'hola@visibly.cl';
const TEAM_CC_EMAIL = process.env.TEAM_CC_EMAIL || 'domen.newman@gmail.com';
const PAYMENT_DETAILS = {
  bank: process.env.PAYMENT_BANK || 'Banco por definir',
  accountType: process.env.PAYMENT_ACCOUNT_TYPE || 'Tipo de cuenta por definir',
  holder: process.env.PAYMENT_ACCOUNT_HOLDER || 'Titular por definir',
  rut: process.env.PAYMENT_ACCOUNT_RUT || 'RUT por definir',
  accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || 'Cuenta por definir',
  confirmationEmail: process.env.PAYMENT_CONFIRMATION_EMAIL || 'hola@visibly.cl'
};

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.'
});
app.use('/api/contact', limiter);

app.use(express.json({ limit: '10mb' }));

const validateContact = [
  body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('negocio').trim().isLength({ min: 2, max: 200 }).withMessage('Negocio debe tener entre 2 y 200 caracteres'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Teléfono inválido'),
  body('contactPreference').optional({ checkFalsy: true }).isIn(['whatsapp', 'email', 'meet']).withMessage('Preferencia de contacto inválida'),
  body('resumen').trim().isLength({ min: 10, max: 2000 }).withMessage('Resumen inválido'),
  body('total').isNumeric().withMessage('Total debe ser numérico'),
  body('modulos').isArray().withMessage('Módulos debe ser un array'),
  body('addons').isArray().withMessage('Addons debe ser un array'),
  body('consultSelected').optional().isBoolean().withMessage('Estado de consulta inválido'),
  body('flowType').optional({ checkFalsy: true }).isIn(['consulta', 'servicio']).withMessage('Flujo inválido')
];

const createTransporter = () => ({
  sendMail: email => postToAppsScript({
    flowType: 'emailRelay',
    token: APPS_SCRIPT_TOKEN,
    to: email.to,
    cc: email.cc || '',
    replyTo: email.replyTo || '',
    subject: email.subject,
    html: email.html || '',
    text: email.text || ''
  })
});

const sanitizeText = value => String(value || '').replace(/[<>\"&]/g, '');

const postToAppsScript = async payload => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const text = await response.text();
    let result = {};

    try {
      result = text ? JSON.parse(text) : {};
    } catch (error) {
      throw new Error(`Respuesta inválida de Apps Script: ${text.slice(0, 120)}`);
    }

    if (!response.ok || result.success === false) {
      throw new Error(result.message || `Apps Script respondió ${response.status}`);
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
};

const buildFollowUpLink = (path, payload) => {
  const params = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return `${SITE_URL}${path}?${params.toString()}`;
};

const prettifyContactPreference = preference => {
  const labels = {
    whatsapp: 'WhatsApp',
    email: 'email',
    meet: 'videollamada'
  };

  return labels[preference] || 'tu medio preferido';
};

const isConsultOnlyFlow = ({ modulos, consultSelected, flowType }) => {
  if (flowType === 'consulta') return true;
  return Boolean(consultSelected) && Array.isArray(modulos) && modulos.length === 0;
};

const renderServiceClientEmail = ({ nombre, resumen, contactPreference, diagnosticoLink }) => `
  <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; color: #0a2332;">
    <h1 style="color: #4cbbb8;">Hola ${nombre},</h1>
    <p>Gracias por tu interés en Visibly.</p>
    <p>Aquí está tu cotización:</p>
    <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${resumen}</pre>
    <p><strong>Implementación:</strong> 5–7 días hábiles.</p>
    <p><strong>Para iniciar se requiere el 50% del total al confirmar.</strong></p>
    <p>El siguiente paso es completar tu diagnóstico para que lleguemos a la primera conversación con contexto real.</p>
    <p>
      <a href="${diagnosticoLink}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#0a2332; color:#ffffff; text-decoration:none; font-weight:500;">
        Completar diagnóstico DIGIT →
      </a>
    </p>
    <p>Te contactaremos en menos de 24 horas por ${prettifyContactPreference(contactPreference)}.</p>
    <p>Equipo Visibly<br>hola@visibly.cl</p>
  </div>
`;

const renderConsultClientEmail = ({ nombre, contactPreference, consultaLink }) => `
  <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; color: #0a2332;">
    <h1 style="color: #4cbbb8;">Hola ${nombre},</h1>
    <p>Gracias por agendar tu consulta de orientación con Visibly.</p>
    <p>Para dejarla confirmada, el siguiente paso es completar tu preparación previa, revisar los datos de transferencia y reservar tu horario.</p>
    <div style="background:#f8f9fa; border-radius:12px; padding:16px; margin:18px 0;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#148080; margin-bottom:10px; font-weight:500;">Datos de transferencia</div>
      <p style="margin:0 0 8px;"><strong>Banco:</strong> ${PAYMENT_DETAILS.bank}</p>
      <p style="margin:0 0 8px;"><strong>Tipo de cuenta:</strong> ${PAYMENT_DETAILS.accountType}</p>
      <p style="margin:0 0 8px;"><strong>Titular:</strong> ${PAYMENT_DETAILS.holder}</p>
      <p style="margin:0 0 8px;"><strong>RUT:</strong> ${PAYMENT_DETAILS.rut}</p>
      <p style="margin:0;"><strong>N.º de cuenta:</strong> ${PAYMENT_DETAILS.accountNumber}</p>
    </div>
    <p>Puedes reservar tu horario desde ya, pero <strong>la reunión queda confirmada solo cuando recibamos el pago</strong>.</p>
    <p>Si no se acredita dentro de <strong>24 horas</strong>, el cupo se libera.</p>
    <p>
      <a href="${consultaLink}" style="display:inline-block; padding:12px 18px; border-radius:999px; background:#0a2332; color:#ffffff; text-decoration:none; font-weight:500;">
        Completar preparación y agendar →
      </a>
    </p>
    <p>Si ya transferiste, puedes enviar el comprobante a <strong>${PAYMENT_DETAILS.confirmationEmail}</strong>.</p>
    <p>Si prefieres, también puedes respondernos por ${prettifyContactPreference(contactPreference)}.</p>
    <p>Equipo Visibly<br>hola@visibly.cl</p>
  </div>
`;

const renderTeamEmail = ({ nombre, negocio, email, phone, contactPreference, resumen, modulos, addons, flowType, followUpLink }) => `
  <div style="font-family: 'DM Sans', sans-serif; color: #0a2332;">
    <h2>${flowType === 'consulta' ? 'Nueva consulta de orientación' : 'Nueva cotización'}</h2>
    <p><strong>Cliente:</strong> ${nombre}</p>
    <p><strong>Negocio:</strong> ${negocio}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>WhatsApp:</strong> ${phone || '—'}</p>
    <p><strong>Contacto preferido:</strong> ${prettifyContactPreference(contactPreference)}</p>
    <p><strong>Flujo:</strong> ${flowType}</p>
    <h3>Configuración:</h3>
    <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${resumen}</pre>
    <p><strong>Módulos:</strong> ${modulos.join(', ') || 'Ninguno'}</p>
    <p><strong>Addons:</strong> ${addons.join(', ') || 'Ninguno'}</p>
    <p><strong>Link de seguimiento:</strong> <a href="${followUpLink}">${followUpLink}</a></p>
  </div>
`;

app.post('/api/contact', validateContact, async (req, res) => {
  try {
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
      addons,
      consultSelected,
      flowType
    } = req.body;

    const sanitizedNombre = sanitizeText(nombre);
    const sanitizedNegocio = sanitizeText(negocio);
    const sanitizedResumen = sanitizeText(resumen);
    const safeEmail = sanitizeText(email);
    const safePhone = sanitizeText(phone);
    const safeModules = modulos.map(sanitizeText);
    const safeAddons = addons.map(sanitizeText);
    const consultOnly = isConsultOnlyFlow({ modulos: safeModules, consultSelected, flowType });
    const resolvedFlowType = consultOnly ? 'consulta' : 'servicio';

    const basePayload = {
      nombre: sanitizedNombre,
      email: safeEmail,
      negocio: sanitizedNegocio,
      phone: safePhone,
      total
    };

    const diagnosticoLink = buildFollowUpLink('/visibly_diagnostico', {
      ...basePayload,
      modulos: safeModules.join(',')
    });
    const consultaLink = buildFollowUpLink('/visibly_consulta', basePayload);
    const followUpLink = consultOnly ? consultaLink : diagnosticoLink;

    const transporter = createTransporter();

    const clientEmail = {
      from: `"Visibly" <${process.env.SMTP_USER}>`,
      to: email,
      replyTo: TEAM_EMAIL,
      subject: consultOnly ? 'Tu consulta de orientación Visibly' : 'Tu cotización Visibly',
      html: consultOnly
        ? renderConsultClientEmail({
            nombre: sanitizedNombre,
            contactPreference,
            consultaLink
          })
        : renderServiceClientEmail({
            nombre: sanitizedNombre,
            resumen: sanitizedResumen,
            contactPreference,
            diagnosticoLink
          })
    };

    const teamEmail = {
      from: `"Visibly Website" <${process.env.SMTP_USER}>`,
      to: TEAM_EMAIL,
      cc: TEAM_CC_EMAIL,
      replyTo: safeEmail,
      subject: `${consultOnly ? 'Nueva consulta' : 'Nueva cotización'} — ${sanitizedNombre} (${sanitizedNegocio}) — $${Number(total).toLocaleString('es-CL')}`,
      html: renderTeamEmail({
        nombre: sanitizedNombre,
        negocio: sanitizedNegocio,
        email: safeEmail,
        phone: safePhone,
        contactPreference,
        resumen: sanitizedResumen,
        modulos: safeModules,
        addons: safeAddons,
        flowType: resolvedFlowType,
        followUpLink
      })
    };

    await Promise.all([
      transporter.sendMail(clientEmail),
      transporter.sendMail(teamEmail)
    ]);

    res.json({
      success: true,
      message: 'Cotización enviada exitosamente',
      flowType: resolvedFlowType,
      followUpLink
    });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

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
