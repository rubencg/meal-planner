#!/usr/bin/env node
// Helper del skill importar-plan: lista, compara y aplica cargas contra la API de Tiki.
//
// Uso:
//   node cargas.mjs list                 [--api URL]
//   node cargas.mjs diff  <plan.json>    [--api URL]
//   node cargas.mjs apply <plan.json>    [--api URL]
//
// URL por defecto: $TIKI_API_URL o https://ubuntu-apps.tailfd8200.ts.net:8080/api (producción vía Tailscale)

import { readFileSync } from 'node:fs';

const STRUCTURED = ['desayuno', 'almuerzo', 'cena'];
const SLOTS      = ['entrenamiento', 'desayuno', 'snack1', 'almuerzo', 'snack2', 'cena'];
const LABELS     = {
  entrenamiento: 'Entrenamiento', desayuno: 'Desayuno', snack1: 'Colación 12:30',
  almuerzo: 'Comida', snack2: 'Colación 6:30', cena: 'Cena',
};

const args = process.argv.slice(2);
const apiIdx = args.indexOf('--api');
const API = (apiIdx >= 0 ? args.splice(apiIdx, 2)[1] : process.env.TIKI_API_URL || 'https://ubuntu-apps.tailfd8200.ts.net:8080/api')
  .replace(/\/$/, '');
const [cmd, planPath] = args;

async function http(method, path, body) {
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body:    body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.error(`No se pudo conectar a ${API} (${e.cause?.code ?? e.message}). ¿Está corriendo el backend?`);
    process.exit(2);
  }
  if (!res.ok) {
    console.error(`${method} ${path} → ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  return res.status === 204 ? null : res.json();
}

function readPlan(path) {
  if (!path) { console.error('Falta la ruta al plan.json'); process.exit(1); }
  const plan = JSON.parse(readFileSync(path, 'utf8'));
  for (const p of plan.persons ?? []) {
    for (const c of p.cargas ?? []) {
      for (const slot of Object.keys(c.slots ?? {})) {
        if (!SLOTS.includes(slot)) { console.error(`Slot inválido "${slot}" en ${p.personId}/${c.name}`); process.exit(1); }
      }
    }
  }
  return plan;
}

// Los slots del PDF reemplazan a los actuales, pero se conservan las carbSelections
// elegidas en la app (el PDF no las trae).
function mergeSlots(current = {}, incoming = {}) {
  const out = {};
  for (const slot of SLOTS) {
    const next = incoming[slot];
    if (next === undefined) { if (current[slot]) out[slot] = current[slot]; continue; }
    if (STRUCTURED.includes(slot) && current[slot]?.carbSelections && !next.carbSelections) {
      out[slot] = { ...next, carbSelections: current[slot].carbSelections };
    } else {
      out[slot] = next;
    }
  }
  return out;
}

function fmt(slot, d) {
  if (!d || Object.keys(d).length === 0) return '—';
  if (STRUCTURED.includes(slot)) {
    const parts = [];
    if (d.protein !== undefined) parts.push(`${d.protein} g prot`);
    if (d.carbs   !== undefined) parts.push(`${d.carbs} porc carbs`);
    if (d.notes)                 parts.push(`notas: ${d.notes}`);
    return parts.join(' · ') || '—';
  }
  return (d.text ?? '—').replace(/\n/g, ' / ');
}

async function resolve(plan) {
  const ops = [];
  for (const p of plan.persons) {
    const existing = await http('GET', `/cargas?personId=${encodeURIComponent(p.personId)}`);
    for (const c of p.cargas) {
      const target = c.id ? existing.find(e => e.id === c.id) : null;
      if (c.id && !target) { console.error(`Carga ${c.id} no existe para ${p.personId}`); process.exit(1); }
      ops.push({ personId: p.personId, plan: c, target, slots: mergeSlots(target?.slots, c.slots) });
    }
  }
  return ops;
}

async function list() {
  const persons = await http('GET', '/persons');
  const out = [];
  for (const p of persons) {
    const cargas = await http('GET', `/cargas?personId=${encodeURIComponent(p.id)}`);
    out.push({ personId: p.id, name: p.name, cargas: cargas.map(({ id, name, isDefault, sortOrder, slots }) => ({ id, name, isDefault, sortOrder, slots })) });
  }
  console.log(JSON.stringify(out, null, 2));
}

async function diff(plan) {
  const ops = await resolve(plan);
  let changes = 0;
  for (const op of ops) {
    const title = op.target
      ? `${op.personId} · "${op.target.name}"${op.plan.name && op.plan.name !== op.target.name ? ` → renombrar a "${op.plan.name}"` : ''}`
      : `${op.personId} · NUEVA carga "${op.plan.name}"`;
    console.log(`\n## ${title}`);
    for (const slot of SLOTS) {
      const before = fmt(slot, op.target?.slots?.[slot]);
      const after  = fmt(slot, op.slots[slot]);
      if (before === after) { console.log(`  = ${LABELS[slot]}: ${after}`); continue; }
      changes++;
      console.log(`  ~ ${LABELS[slot]}:\n      antes:   ${before}\n      después: ${after}`);
    }
  }
  console.log(`\n${changes} slot(s) con cambios.`);
}

async function apply(plan) {
  const ops = await resolve(plan);
  for (const op of ops) {
    let id = op.target?.id;
    if (!id) {
      id = (await http('POST', '/cargas', { personId: op.personId, name: op.plan.name })).id;
      console.log(`Creada carga "${op.plan.name}" (${op.personId})`);
    }
    const body = { slots: op.slots };
    if (op.target && op.plan.name && op.plan.name !== op.target.name) body.name = op.plan.name;
    await http('PUT', `/cargas/${id}`, body);
    console.log(`Actualizada "${body.name ?? op.target?.name ?? op.plan.name}" (${op.personId})`);
  }
}

switch (cmd) {
  case 'list':  await list(); break;
  case 'diff':  await diff(readPlan(planPath)); break;
  case 'apply': await apply(readPlan(planPath)); break;
  default:
    console.error('Uso: node cargas.mjs <list|diff|apply> [plan.json] [--api URL]');
    process.exit(1);
}
