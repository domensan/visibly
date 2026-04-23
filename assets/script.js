// ===== ANIMACIONES DE PLATAFORMAS =====
const pts = ['pt0','pt1','pt2','pt3','pt4'];
let cur = 0;
setInterval(() => {
  document.getElementById(pts[cur]).classList.remove('active');
  cur = (cur + 1) % pts.length;
  document.getElementById(pts[cur]).classList.add('active');
}, 1800);

// ===== CALCULADORA =====
const IVA = 0.19;
const MODS = {
  web: { name:'Sitio web', base:400000, mant:70000 },
  rrss: { name:'Redes sociales', base:200000, mant:40000 },
  marca: { name:'Marca personal', base:180000, mant:0 },
  branding: { name:'Branding', base:400000, mant:0 }
};
const ADDS = {
  'web-google':{ name:'Google Business optimizado', p:80000 },
  'web-seo':{ name:'SEO local', p:70000 },
  'web-formulario':{ name:'Formulario de agendamiento', p:60000 },
  'web-dashboard':{ name:'Dashboard de métricas', p:90000 },
  'rrss-bio':{ name:'Bio + highlights Instagram', p:50000 },
  'rrss-contenido':{ name:'Pack contenido inicial (6 posts)', p:120000 },
  'rrss-guia':{ name:'Guía de RRSS en Canva', p:80000 },
  'rrss-stories':{ name:'Templates de stories editables', p:40000 },
  'rrss-estrategia':{ name:'Estrategia de contenido 3 meses', p:80000 },
  'marca-linkedin':{ name:'LinkedIn optimizado', p:70000 },
  'marca-bio':{ name:'Bio profesional multipropósito', p:60000 },
  'marca-pitch':{ name:'Kit de presentación digital', p:90000 },
  'brand-manual':{ name:'Manual de marca básico', p:150000 },
  'brand-papeleria':{ name:'Papelería digital', p:120000 },
  'brand-kit':{ name:'Kit de redes sociales', p:100000 },
  'brand-naming':{ name:'Naming', p:150000 },
  'brand-mockups':{ name:'Aplicación de marca', p:80000 }
};
const fmt = n => '$' + Math.round(n).toLocaleString('es-CL');
const chk = '<svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const API_CONTACT_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '3001'
  ? 'http://localhost:3001/api/contact'
  : '/api/contact';
let selMods = new Set(), selAdds = new Set(), hasConsult = false, hasFollow = false, radioVals = {};
const ADDON_MODULES = {
  'web-google': 'web',
  'web-seo': 'web',
  'web-formulario': 'web',
  'web-dashboard': 'web',
  'rrss-bio': 'rrss',
  'rrss-contenido': 'rrss',
  'rrss-guia': 'rrss',
  'rrss-stories': 'rrss',
  'rrss-estrategia': 'rrss',
  'marca-linkedin': 'marca',
  'marca-bio': 'marca',
  'marca-pitch': 'marca',
  'brand-manual': 'branding',
  'brand-papeleria': 'branding',
  'brand-kit': 'branding',
  'brand-naming': 'branding',
  'brand-mockups': 'branding'
};

function clearAddonsFor(moduleId) {
  Object.entries(ADDON_MODULES).forEach(([addonId, owner]) => {
    if (!moduleId || owner === moduleId) {
      selAdds.delete(addonId);
      const check = document.getElementById('ck-' + addonId);
      if (check) {
        check.classList.remove('on');
        check.innerHTML = '';
      }
    }
  });
}

function clearFollow() {
  hasFollow = false;
  const block = document.getElementById('cfollow-block');
  const check = document.getElementById('cfw-check');
  if (block) block.classList.remove('selected');
  if (check) check.innerHTML = '';
}

function clearConsult() {
  hasConsult = false;
  const consult = document.getElementById('cc-consult');
  const check = document.getElementById('cc-check');
  if (consult) consult.classList.remove('selected');
  if (check) check.innerHTML = '';
}

function clearModules() {
  selMods.clear();
  document.querySelectorAll('.cmod.selected').forEach(module => module.classList.remove('selected'));
}

function updateHint() {
  const any = selMods.size > 0 || hasConsult;
  const btn = document.getElementById('btn-next1');
  btn.disabled = !any; btn.style.opacity = any ? '1' : '.4';
  let p = [];
  if (selMods.size > 0) p.push(selMods.size + ' módulo' + (selMods.size > 1 ? 's' : ''));
  if (hasConsult) p.push('consulta');
  document.getElementById('mod-hint').textContent = p.length ? p.join(' + ') + ' seleccionado' + (p.length > 1 ? 's' : '') : 'Selecciona al menos una opción para continuar';
}
function toggleMod(id, el) {
  clearConsult();
  if (selMods.has(id)) {
    selMods.delete(id);
    el.classList.remove('selected');
    clearAddonsFor(id);
    if (selMods.size === 0) clearFollow();
  }
  else {
    selMods.add(id);
    el.classList.add('selected');
  }
  updateHint();
  updatePrice();
}
function toggleConsult() {
  hasConsult = !hasConsult;
  const c = document.getElementById('cc-consult'), ch = document.getElementById('cc-check');
  if (hasConsult) {
    clearModules();
    clearAddonsFor();
    clearFollow();
    c.classList.add('selected');
    ch.innerHTML = chk;
  }
  else { c.classList.remove('selected'); ch.innerHTML = ''; }
  updateHint();
  updatePrice();
}
function toggleFollow() {
  hasFollow = !hasFollow;
  const fb = document.getElementById('cfollow-block'), fc = document.getElementById('cfw-check');
  if (hasFollow) { fb.classList.add('selected'); fc.innerHTML = chk; }
  else { fb.classList.remove('selected'); fc.innerHTML = ''; }
  updatePrice();
}
function toggleAddon(id, el) {
  const c = document.getElementById('ck-' + id);
  if (selAdds.has(id)) { selAdds.delete(id); c.classList.remove('on'); c.innerHTML = ''; }
  else { selAdds.add(id); c.classList.add('on'); c.innerHTML = chk; }
  updatePrice();
}
function selRadio(g, v, el) {
  radioVals[g] = v;
  document.querySelectorAll('#rg-' + g + ' .radio-it').forEach(r => { r.classList.remove('sel'); r.querySelector('.radio-dot').innerHTML = ''; });
  el.classList.add('sel');
}
function calc() {
  let neto = 0, mant = 0;
  selMods.forEach(m => { neto += MODS[m].base; mant += MODS[m].mant; });
  selAdds.forEach(a => { if (ADDS[a] && selMods.has(ADDON_MODULES[a])) neto += ADDS[a].p; });
  if (hasConsult) neto += 25000;
  if (hasFollow && selMods.size > 0) neto += 270000;
  return { neto, iva: neto * IVA, total: neto * (1 + IVA), mant, mantTotal: mant * (1 + IVA) };
}
function getActiveAddons() {
  return Array.from(selAdds).filter(addonId => ADDS[addonId] && selMods.has(ADDON_MODULES[addonId]));
}
function updatePrice() {
  const { neto, iva, total, mant, mantTotal } = calc();
  document.getElementById('p-neto').textContent = fmt(neto);
  document.getElementById('p-iva').textContent = fmt(iva);
  document.getElementById('p-total').textContent = fmt(total);
  document.getElementById('p-mant').textContent = mantTotal > 0 ? fmt(mantTotal) + '/mes (c/IVA)' : '—';
}
function goStep2() {
  Object.keys(ADDON_MODULES).forEach(addonId => {
    if (!selMods.has(ADDON_MODULES[addonId])) {
      selAdds.delete(addonId);
      const check = document.getElementById('ck-' + addonId);
      if (check) {
        check.classList.remove('on');
        check.innerHTML = '';
      }
    }
  });
  if (selMods.size === 0) clearFollow();
  ['web','rrss','marca','branding'].forEach(m => document.getElementById('ca-' + m).style.display = selMods.has(m) ? 'block' : 'none');
  document.getElementById('ca-consult').style.display = hasConsult ? 'block' : 'none';
  document.getElementById('ca-follow').style.display = selMods.size > 0 ? 'block' : 'none';
  updatePrice(); goCalcStep(2);
}
function goStep3() {
  const { neto, iva, total, mant, mantTotal } = calc();
  let html = '';
  if (hasConsult) html += `<div class="csummary-line"><span>Consulta de orientación</span><span>$25.000</span></div>`;
  selMods.forEach(m => html += `<div class="csummary-line"><span>${MODS[m].name} (base)</span><span>${fmt(MODS[m].base)}</span></div>`);
  getActiveAddons().forEach(a => html += `<div class="csummary-line"><span>${ADDS[a].name}</span><span>+${fmt(ADDS[a].p)}</span></div>`);
  if (hasFollow && selMods.size > 0) html += `<div class="csummary-line" style="color:#185FA5"><span>Acompañamiento activo 3 meses</span><span>+$270.000</span></div>`;
  document.getElementById('summary-items').innerHTML = html;
  document.getElementById('s-neto').textContent = fmt(neto);
  document.getElementById('s-iva').textContent = fmt(iva);
  document.getElementById('s-total').textContent = fmt(total);
  const mr = document.getElementById('s-mant-row');
  if (mantTotal > 0) { mr.innerHTML = `<span>Mantención mensual (c/IVA)</span><span>${fmt(mantTotal)}/mes</span>`; mr.style.display = 'flex'; }
  else mr.style.display = 'none';
  goCalcStep(3);
}
function goCalcStep(n) {
  document.querySelectorAll('.cscreen').forEach(s => s.classList.remove('active'));
  document.getElementById('cs' + n).classList.add('active');
  for (let i = 1; i <= 4; i++) {
    const d = document.getElementById('csd' + i);
    d.classList.remove('done', 'active');
    if (i < n) d.classList.add('done');
    else if (i === n) d.classList.add('active');
  }
}
async function enviar() {
  const nombre = document.getElementById('f-nombre').value.trim();
  const negocio = document.getElementById('f-negocio').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  if (!nombre || !email || !negocio) { alert('Por favor completa nombre, negocio y email.'); return; }
  document.getElementById('btn-enviar').style.display = 'none';
  document.getElementById('enviando').style.display = 'block';
  const { neto, iva, total, mantTotal } = calc();
  let mLines = [], aLines = [];
  if (hasConsult) mLines.push('✓ Consulta de orientación: $25.000');
  selMods.forEach(m => mLines.push('✓ ' + MODS[m].name + ': ' + fmt(MODS[m].base)));
  getActiveAddons().forEach(a => aLines.push('  + ' + ADDS[a].name + ': ' + fmt(ADDS[a].p)));
  if (hasFollow && selMods.size > 0) aLines.push('  + Acompañamiento activo 3 meses: $270.000');
  const resumen = [...mLines, ...aLines, '\nSubtotal neto: ' + fmt(neto), 'IVA (19%): ' + fmt(iva), 'Total: ' + fmt(total)].join('\n');
  const pref = radioVals['contacto'] || '';
  try {
    const response = await fetch(API_CONTACT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        negocio,
        email,
        phone,
        contactPreference: pref,
        resumen,
        total,
        modulos: Array.from(selMods),
        addons: getActiveAddons()
      })
    });
    const data = await response.json();
    if (data.success) {
      showSuccess(neto, iva, total, mantTotal);
    } else {
      throw new Error(data.message || 'Error desconocido');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('btn-enviar').style.display = 'block';
    document.getElementById('enviando').style.display = 'none';
    alert('Hubo un problema enviando la cotización. Por favor intenta de nuevo.');
  }
}
function showSuccess(neto, iva, total, mantTotal) {
  let html = '';
  const row = (n, p, c) => `<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--border);color:${c||'var(--muted)'}"><span>${n}</span><span>${p}</span></div>`;
  if (hasConsult) html += row('Consulta de orientación', '$25.000');
  selMods.forEach(m => html += row(MODS[m].name, fmt(MODS[m].base)));
  getActiveAddons().forEach(a => html += row(ADDS[a].name, '+' + fmt(ADDS[a].p)));
  if (hasFollow && selMods.size > 0) html += row('Acompañamiento activo 3 meses', '+$270.000', '#185FA5');
  html += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:6px 0 2px;color:var(--muted);opacity:.7;border-top:1px solid var(--border);margin-top:4px"><span>IVA (19%)</span><span>${fmt(iva)}</span></div>`;
  html += `<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:500;padding:4px 0 0;color:var(--navy)"><span>Total con IVA</span><span>${fmt(total)}</span></div>`;
  if (mantTotal > 0) html += `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);padding:4px 0 0"><span>Mantención mensual (c/IVA)</span><span>${fmt(mantTotal)}/mes</span></div>`;
  document.getElementById('final-summary').innerHTML = html;
  goCalcStep(5);
  document.querySelectorAll('.cs-dot').forEach(d => { d.classList.remove('active'); d.classList.add('done'); });
}

// ===== FAQ =====
function toggleFaq(el) {
  const item = el.parentElement;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}
