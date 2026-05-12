// ============================================================
// VISIBLY™ — Google Apps Script
// Formulario DIGIT™ Etapa D
// 
// INSTRUCCIONES DE INSTALACIÓN:
// 1. Abre el Google Sheet: https://docs.google.com/spreadsheets/d/1SSKvxhRQpULQYELr1RFUZ6lNjrgxC6Vbd4XG7OkRjf0
// 2. Extensiones → Apps Script
// 3. Pega este código reemplazando todo lo que hay
// 4. Guarda (Ctrl+S)
// 5. Implementar → Nueva implementación
// 6. Tipo: Aplicación web
// 7. Ejecutar como: Yo (tu cuenta Google)
// 8. Quién tiene acceso: Cualquier persona
// 9. Implementar → Copia la URL del Web App → pégala en el formulario HTML
// ============================================================

const SHEET_ID = '1SSKvxhRQpULQYELr1RFUZ6lNjrgxC6Vbd4XG7OkRjf0';
const SHEET_NAME = 'Diagnósticos DIGIT™';
const TEAM_EMAIL = 'hola@visibly.cl';
const CONSULTA_SHEET_NAME = 'Consultas de orientacion';
const TEAM_CC_EMAIL = 'domen.newman@gmail.com';
const RELAY_TOKEN = 'visibly-relay-2026';
const FROM_NAME = 'Visibly™';

// Cabeceras de las columnas en el Sheet
const HEADERS = [
  'Fecha',
  'Nombre cliente',
  'Negocio',
  'Email',
  'WhatsApp',
  'Módulos contratados',
  'Nombre del negocio',
  'A qué se dedica',
  'Antigüedad',
  'Cliente ideal',
  'Cómo lo encuentran hoy',
  'Objetivo digital',
  'Urgencia',
  'Percepción del precio',
  'Tiene sitio web',
  'URL web actual',
  'Qué debe hacer el sitio',
  'Nota adicional web',
  'Redes actuales',
  'Frecuencia de publicación',
  'Tipo de contenido',
  'Tono de comunicación',
  'Tiene fotos/videos',
  'LinkedIn',
  'URL LinkedIn',
  'Percepción de marca',
  'Para qué usaría la marca personal',
  'Referencias visuales (texto)',
  'Cómo encontró Visibly',
  'Disponibilidad para llamada',
  'Contacto preferido'
];

const CONSULTA_HEADERS = [
  'Fecha',
  'Nombre cliente',
  'Negocio',
  'Email',
  'WhatsApp',
  'Total',
  'Negocio actual',
  'Temas a conversar',
  'Prioridad',
  'Presencia actual',
  'Links',
  'Intentos previos',
  'Resultado esperado',
  'Estado de pago',
  'Nota pago'
];

// ============================================================
// MANEJADOR PRINCIPAL — recibe el POST del formulario
// ============================================================
function doPost(e) {
  try {
    // Parsear el body del request
    const data = JSON.parse(e.postData.contents);
    if (data.flowType === 'emailRelay') {
      return handleEmailRelay(data);
    }

    // Validaciones básicas
    if (!data.email || !data.nombre) {
      return jsonResponse({ success: false, message: 'Faltan datos obligatorios.' });
    }

    // Sanitizar todos los campos
    const clean = sanitize(data);

    if (clean.flowType === 'consulta' || clean.temas || clean.prioridad) {
      writeConsultToSheet(clean);
      sendConsultTeamEmail(clean);
      sendConsultClientEmail(clean);

      return jsonResponse({ success: true, message: 'Preparacion de consulta recibida correctamente.' });
    }

    // 1. Escribir en el Sheet
    writeToSheet(clean);

    // 2. Enviar email al equipo Visibly
    sendTeamEmail(clean);

    // 3. Enviar email de confirmación al cliente
    sendClientEmail(clean);

    return jsonResponse({ success: true, message: 'Diagnóstico recibido correctamente.' });

  } catch (err) {
    console.error('Error en doPost:', err);
    return jsonResponse({ success: false, message: 'Error interno. Por favor intenta de nuevo.' });
  }
}

// ============================================================
// INICIALIZAR SHEET — crea la hoja con cabeceras si no existe
// ============================================================
function initSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);

    // Formatear cabeceras
    const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#0a2332');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);

    // Ajustar ancho de columnas
    sheet.setColumnWidth(1, 140);  // Fecha
    sheet.setColumnWidth(2, 160);  // Nombre
    sheet.setColumnWidth(3, 180);  // Negocio
    sheet.setColumnWidth(4, 200);  // Email
    sheet.setColumnWidth(5, 160);  // WhatsApp
    for (let i = 6; i <= HEADERS.length; i++) {
      sheet.setColumnWidth(i, 220);
    }
  }

  return sheet;
}

// ============================================================
// ESCRIBIR FILA EN EL SHEET
// ============================================================
function writeToSheet(d) {
  const sheet = initSheet();

  const row = [
    new Date(),                          // Fecha
    d.nombre,                            // Nombre cliente
    d.negocio,                           // Negocio
    d.email,                             // Email
    d.phone || '—',                      // WhatsApp
    d.modulos || '—',                    // Módulos contratados
    d.nombreNegocio || '—',              // Nombre del negocio
    d.dedicacion || '—',                 // A qué se dedica
    d.antiguedad || '—',                 // Antigüedad
    d.clienteIdeal || '—',              // Cliente ideal
    d.comoEncuentran || '—',            // Cómo lo encuentran hoy
    d.objetivo || '—',                   // Objetivo digital
    d.urgencia || '—',                   // Urgencia
    d.percepcionPrecio || '—',          // Percepción del precio
    d.tieneWeb || '—',                   // Tiene sitio web
    d.urlWeb || '—',                     // URL web actual
    d.queHaceWeb || '—',                 // Qué debe hacer el sitio
    d.notaWeb || '—',                    // Nota adicional web
    d.redesActuales || '—',             // Redes actuales
    d.frecuencia || '—',                 // Frecuencia de publicación
    d.tipoContenido || '—',             // Tipo de contenido
    d.tonoComun || '—',                  // Tono de comunicación
    d.tieneFotos || '—',                 // Tiene fotos/videos
    d.tieneLinkedin || '—',             // LinkedIn
    d.urlLinkedin || '—',               // URL LinkedIn
    d.percepcionMarca || '—',           // Percepción de marca
    d.paraQueMarca || '—',              // Para qué usaría la marca personal
    d.referenciasTexto || '—',          // Referencias visuales
    d.comoEncontro || '—',              // Cómo encontró Visibly
    d.disponibilidad || '—',            // Disponibilidad para llamada
    d.contactoPreferido || '—'          // Contacto preferido
  ];

  sheet.appendRow(row);

  // Alternar color de filas para legibilidad
  const lastRow = sheet.getLastRow();
  if (lastRow % 2 === 0) {
    sheet.getRange(lastRow, 1, 1, HEADERS.length).setBackground('#f8f8f6');
  }
}

function initConsultSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(CONSULTA_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONSULTA_SHEET_NAME);
    sheet.appendRow(CONSULTA_HEADERS);

    const headerRange = sheet.getRange(1, 1, 1, CONSULTA_HEADERS.length);
    headerRange.setBackground('#0a2332');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    sheet.setFrozenRows(1);

    for (let i = 1; i <= CONSULTA_HEADERS.length; i++) {
      sheet.setColumnWidth(i, i <= 6 ? 160 : 220);
    }
  }

  return sheet;
}

function writeConsultToSheet(d) {
  const sheet = initConsultSheet();
  const row = [
    new Date(),
    d.nombre,
    d.negocio,
    d.email,
    d.phone || '—',
    d.total || '—',
    d.negocioActual || '—',
    d.temas || '—',
    d.prioridad || '—',
    d.presenciaActual || '—',
    d.links || '—',
    d.intentos || '—',
    d.resultadoEsperado || '—',
    d.estadoPago || '—',
    d.notaPago || '—'
  ];

  sheet.appendRow(row);

  const lastRow = sheet.getLastRow();
  if (lastRow % 2 === 0) {
    sheet.getRange(lastRow, 1, 1, CONSULTA_HEADERS.length).setBackground('#f8f8f6');
  }
}

// ============================================================
// EMAIL AL EQUIPO VISIBLY
// ============================================================
function sendTeamEmail(d) {
  const subject = `🎯 Nuevo diagnóstico DIGIT™ — ${d.nombre} (${d.negocio})`;

  const body = `
NUEVO DIAGNÓSTICO DIGIT™ — Etapa D
=====================================

DATOS DEL CLIENTE
-----------------
Nombre:          ${d.nombre}
Negocio:         ${d.negocio}
Email:           ${d.email}
WhatsApp:        ${d.phone || '—'}
Módulos:         ${d.modulos || '—'}
Contacto pref.:  ${d.contactoPreferido || '—'}
Disponibilidad:  ${d.disponibilidad || '—'}

SU NEGOCIO
----------
Nombre negocio:  ${d.nombreNegocio || '—'}
Se dedica a:     ${d.dedicacion || '—'}
Antigüedad:      ${d.antiguedad || '—'}
Cliente ideal:   ${d.clienteIdeal || '—'}
Cómo lo enc.:    ${d.comoEncuentran || '—'}

OBJETIVOS
---------
Objetivo:        ${d.objetivo || '—'}
Urgencia:        ${d.urgencia || '—'}
Precio:          ${d.percepcionPrecio || '—'}

${d.modulos && d.modulos.includes('web') ? `
SITIO WEB
---------
Tiene web:       ${d.tieneWeb || '—'}
URL actual:      ${d.urlWeb || '—'}
Qué debe hacer:  ${d.queHaceWeb || '—'}
Nota:            ${d.notaWeb || '—'}
` : ''}

${d.modulos && d.modulos.includes('rrss') ? `
REDES SOCIALES
--------------
Redes actuales:  ${d.redesActuales || '—'}
Frecuencia:      ${d.frecuencia || '—'}
Tipo contenido:  ${d.tipoContenido || '—'}
Tono:            ${d.tonoComun || '—'}
Tiene fotos:     ${d.tieneFotos || '—'}
` : ''}

${d.modulos && d.modulos.includes('marca') ? `
MARCA PERSONAL
--------------
LinkedIn:        ${d.tieneLinkedin || '—'}
URL LinkedIn:    ${d.urlLinkedin || '—'}
Percepción:      ${d.percepcionMarca || '—'}
Para qué:        ${d.paraQueMarca || '—'}
` : ''}

REFERENCIAS
-----------
${d.referenciasTexto || '—'}

CÓMO LLEGÓ
----------
Fuente:          ${d.comoEncontro || '—'}

=====================================
Ver todos los diagnósticos en el Sheet:
https://docs.google.com/spreadsheets/d/${SHEET_ID}
=====================================
  `.trim();

  GmailApp.sendEmail(TEAM_EMAIL, subject, body, {
    name: FROM_NAME,
    cc: TEAM_CC_EMAIL,
    replyTo: d.email
  });
}

// ============================================================
// EMAIL DE CONFIRMACIÓN AL CLIENTE
// ============================================================
function sendClientEmail(d) {
  const subject = 'Visibly™ — Recibimos tu diagnóstico';

  const body = `
Hola ${d.nombre},

Recibimos tu diagnóstico correctamente. Gracias por tomarte el tiempo de completarlo.

Esto nos permite llegar a nuestra primera conversación con todo el contexto — sin preguntas básicas, directo a lo que importa.

¿QUÉ PASA AHORA?
-----------------
Revisaremos tu diagnóstico y te contactaremos en menos de 24 horas por ${d.contactoPreferido || 'el medio que prefieras'}.

La próxima etapa del Método DIGIT™ es Idear — donde definiremos juntos la dirección visual y de comunicación de tu proyecto.

RESUMEN DE LO QUE NOS CONTASTE
--------------------------------
Negocio:        ${d.nombreNegocio || d.negocio}
Módulos:        ${d.modulos || '—'}
Objetivo:       ${d.objetivo || '—'}
Urgencia:       ${d.urgencia || '—'}

Si tienes alguna duda antes de que te contactemos, puedes escribirnos directamente a:
hola@visibly.cl

Nos vemos pronto.

Humberto y Natalia
Equipo Visibly™
https://visibly.cl
  `.trim();

  GmailApp.sendEmail(d.email, subject, body, {
    name: FROM_NAME,
    replyTo: TEAM_EMAIL
  });
}

// ============================================================
// SANITIZACIÓN DE DATOS
// ============================================================
function sendConsultTeamEmail(d) {
  const subject = `Nueva preparacion de consulta - ${d.nombre} (${d.negocio})`;

  const body = `
NUEVA PREPARACION DE CONSULTA
=============================

DATOS DEL CLIENTE
-----------------
Nombre:          ${d.nombre}
Negocio:         ${d.negocio}
Email:           ${d.email}
WhatsApp:        ${d.phone || '—'}
Total:           ${d.total || '—'}

PREPARACION
-----------
Negocio actual:  ${d.negocioActual || '—'}
Temas:           ${d.temas || '—'}
Prioridad:       ${d.prioridad || '—'}
Presencia:       ${d.presenciaActual || '—'}
Links:           ${d.links || '—'}
Intentos prev.:  ${d.intentos || '—'}
Resultado esp.:  ${d.resultadoEsperado || '—'}

PAGO
----
Estado:          ${d.estadoPago || '—'}
Nota:            ${d.notaPago || '—'}

=====================================
Ver todos los registros en el Sheet:
https://docs.google.com/spreadsheets/d/${SHEET_ID}
=====================================
  `.trim();

  GmailApp.sendEmail(TEAM_EMAIL, subject, body, {
    name: FROM_NAME,
    cc: TEAM_CC_EMAIL,
    replyTo: d.email
  });
}

function sendConsultClientEmail(d) {
  const subject = 'Visibly - Recibimos tu preparacion de consulta';

  const body = `
Hola ${d.nombre},

Recibimos tu preparacion para la consulta correctamente.

Revisaremos lo que nos compartiste antes de la reunion para llegar con contexto y aprovechar mejor el tiempo.

RESUMEN
-------
Negocio:   ${d.negocioActual || d.negocio}
Temas:     ${d.temas || '—'}
Prioridad: ${d.prioridad || '—'}
Pago:      ${d.estadoPago || '—'}

Si tienes alguna duda antes de la reunion, puedes escribirnos directamente a:
hola@visibly.cl

Nos vemos pronto.

Humberto y Natalia
Equipo Visibly
https://visibly.cl
  `.trim();

  GmailApp.sendEmail(d.email, subject, body, {
    name: FROM_NAME,
    replyTo: TEAM_EMAIL
  });
}

function handleEmailRelay(data) {
  if (data.token !== RELAY_TOKEN) {
    return jsonResponse({ success: false, message: 'Token invalido.' });
  }

  if (!data.to || !data.subject || (!data.html && !data.text)) {
    return jsonResponse({ success: false, message: 'Faltan datos de email.' });
  }

  const options = {
    name: FROM_NAME
  };

  if (data.html) options.htmlBody = data.html;
  if (data.cc) options.cc = data.cc;
  if (data.replyTo) options.replyTo = data.replyTo;

  const textBody = data.text || stripHtml(data.html);
  GmailApp.sendEmail(data.to, data.subject, textBody, options);

  return jsonResponse({ success: true, message: 'Email enviado correctamente.' });
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitize(data) {
  const clean = {};
  for (const key in data) {
    if (typeof data[key] === 'string') {
      // Eliminar caracteres peligrosos, limitar longitud
      clean[key] = data[key]
        .replace(/<[^>]*>/g, '')     // strip HTML tags
        .replace(/[<>"'`]/g, '')     // strip dangerous chars
        .trim()
        .substring(0, 2000);          // max 2000 chars por campo
    } else if (Array.isArray(data[key])) {
      clean[key] = data[key].join(', ');
    } else {
      clean[key] = data[key];
    }
  }
  return clean;
}

// ============================================================
// RESPUESTA JSON
// ============================================================
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// TEST — ejecuta esto manualmente para verificar que funciona
// ============================================================
function test() {
  const testData = {
    nombre: 'Test Cliente',
    negocio: 'Clínica Dental Test',
    email: TEAM_CC_EMAIL,
    phone: '+56 9 1234 5678',
    modulos: 'web, rrss',
    nombreNegocio: 'Clínica Dental Test',
    dedicacion: 'Dentista especialista en ortodoncia',
    antiguedad: 'Más de 3 años',
    clienteIdeal: 'Familias con niños en edad escolar',
    comoEncuentran: 'Por recomendación principalmente',
    objetivo: 'Llenar mi agenda, recibir más consultas online',
    urgencia: 'En el próximo mes',
    percepcionPrecio: 'Me parece justo para lo que necesito',
    tieneWeb: 'No',
    redesActuales: 'Instagram',
    frecuencia: 'Muy de vez en cuando',
    tipoContenido: 'Tips y consejos de mi área',
    tonoComun: 'Cercano y directo',
    tieneFotos: 'Tengo poco',
    comoEncontro: 'Google',
    disponibilidad: 'Esta semana',
    contactoPreferido: 'WhatsApp'
  };

  const e = { postData: { contents: JSON.stringify(testData) } };
  const result = doPost(e);
  console.log(result.getContent());
}
