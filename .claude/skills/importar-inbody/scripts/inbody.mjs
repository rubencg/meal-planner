#!/usr/bin/env node
// Helper del skill importar-inbody: lista, compara y guarda registros InBody contra la API de Tiki.
//
// Uso:
//   node inbody.mjs list  <personId>         [--api URL]
//   node inbody.mjs diff  <record.json>      [--api URL]
//   node inbody.mjs apply <record.json>      [--api URL]
//
// Si ya existe un registro de la misma persona con la misma fecha, `apply` lo actualiza (PUT)
// en lugar de crear un duplicado.
//
// URL por defecto: $TIKI_API_URL o https://ubuntu-apps.tailfd8200.ts.net:8080/api (producción vía Tailscale)

import { readFileSync } from 'node:fs';

const FIELDS = [
  ['weight',                'Peso',              'kg'],
  ['skeletalMusclePercent', '% Músculo',         '%'],
  ['skeletalMuscleMass',    'Peso músculo',      'kg'],
  ['bodyFatPercent',        '% Grasa',           '%'],
  ['bodyFatMass',           'Peso grasa',        'kg'],
  ['bmi',                   'IMC',               ''],
  ['waistHipRatio',         'Cintura-Cadera',    ''],
  ['visceralFatLevel',      'Grasa visceral',    'nivel'],
];
const KEYS = FIELDS.map(([k]) => k);

const args = process.argv.slice(2);
const apiIdx = args.indexOf('--api');
const API = (apiIdx >= 0 ? args.splice(apiIdx, 2)[1] : process.env.TIKI_API_URL || 'https://ubuntu-apps.tailfd8200.ts.net:8080/api')
  .replace(/\/$/, '');
const [cmd, arg] = args;

async function http(method, path, body) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body:    body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.error(`No se pudo conectar a ${API} (${e.cause?.code ?? e.message}). ¿Está corriendo el backend / Tailscale?`);
    process.exit(2);
  }
  if (!res.ok) {
    console.error(`${method} ${path} → ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  return res.status === 204 ? null : res.json();
}

function readRecord(path) {
  if (!path) { console.error('Falta la ruta al record.json'); process.exit(1); }
  const r = JSON.parse(readFileSync(path, 'utf8'));
  if (!r.personId) { console.error('Falta personId'); process.exit(1); }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date ?? '')) { console.error(`Fecha inválida "${r.date}" (usa YYYY-MM-DD)`); process.exit(1); }
  for (const k of Object.keys(r)) {
    if (k === 'personId' || k === 'date') continue;
    if (!KEYS.includes(k)) { console.error(`Campo inválido "${k}"`); process.exit(1); }
    if (typeof r[k] !== 'number' || Number.isNaN(r[k])) { console.error(`"${k}" debe ser número`); process.exit(1); }
  }
  if (r.visceralFatLevel !== undefined && !Number.isInteger(r.visceralFatLevel)) {
    console.error('visceralFatLevel debe ser entero'); process.exit(1);
  }
  return r;
}

const fmt = (v, unit) => (v === undefined || v === null ? '—' : `${v}${unit ? ` ${unit}` : ''}`);

async function findSameDate(r) {
  const records = await http('GET', `/inbody?personId=${encodeURIComponent(r.personId)}`);
  return { records, existing: records.find(x => x.date === r.date) };
}

if (cmd === 'list') {
  if (!arg) { console.error('Uso: list <personId>'); process.exit(1); }
  const records = await http('GET', `/inbody?personId=${encodeURIComponent(arg)}`);
  if (!records.length) { console.log(`Sin registros para ${arg}.`); process.exit(0); }
  console.log(['Fecha', ...FIELDS.map(([, l]) => l)].join(' | '));
  for (const r of records) console.log([r.date, ...FIELDS.map(([k]) => r[k] ?? '—')].join(' | '));
} else if (cmd === 'diff') {
  const r = readRecord(arg);
  const { records, existing } = await findSameDate(r);
  const prev = [...records].filter(x => x.date < r.date).pop();
  console.log(`Persona: ${r.personId} · Fecha: ${r.date} · API: ${API}`);
  console.log(existing
    ? `⚠ Ya existe un registro con esta fecha (id ${existing.id}). apply lo ACTUALIZARÁ.`
    : `Registro nuevo. apply lo CREARÁ.`);
  console.log('');
  const head = existing ? ['Campo', 'Actual', 'Nuevo'] : ['Campo', `Anterior (${prev?.date ?? '—'})`, 'Nuevo'];
  console.log(head.join(' | '));
  const base = existing ?? prev ?? {};
  for (const [k, label, unit] of FIELDS) {
    const changed = existing && r[k] !== undefined && existing[k] !== r[k] ? '  ← cambia' : '';
    console.log(`${label} | ${fmt(base[k], unit)} | ${fmt(r[k], unit)}${changed}`);
  }
} else if (cmd === 'apply') {
  const r = readRecord(arg);
  const { existing } = await findSameDate(r);
  if (existing) {
    const { personId, ...data } = r;
    const saved = await http('PUT', `/inbody/${existing.id}`, data);
    console.log(`Actualizado registro ${saved.id} (${saved.personId}, ${saved.date}).`);
  } else {
    const saved = await http('POST', '/inbody', r);
    console.log(`Creado registro ${saved.id} (${saved.personId}, ${saved.date}).`);
  }
} else {
  console.error('Uso: node inbody.mjs <list|diff|apply> [personId|record.json] [--api URL]');
  process.exit(1);
}
