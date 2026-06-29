import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const { personId } = req.query;
  if (!personId) { res.status(400).json({ error: 'personId required' }); return; }
  const cargas = await prisma.carga.findMany({
    where:   { personId: String(personId) },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(cargas);
});

router.post('/', async (req, res) => {
  const { personId, name } = req.body;
  if (!personId || !name) { res.status(400).json({ error: 'personId and name required' }); return; }

  const existing = await prisma.carga.findMany({ where: { personId } });
  const maxSort  = existing.reduce((m, c) => Math.max(m, c.sortOrder), -1);

  const carga = await prisma.carga.create({
    data: {
      personId,
      name,
      slots:     {},
      sortOrder: maxSort + 1,
      isDefault: existing.length === 0,
    },
  });
  res.json(carga);
});

router.put('/:id/default', async (req, res) => {
  const carga = await prisma.carga.findUnique({ where: { id: req.params.id } });
  if (!carga) { res.status(404).json({ error: 'not found' }); return; }

  const [, updated] = await prisma.$transaction([
    prisma.carga.updateMany({ where: { personId: carga.personId }, data: { isDefault: false } }),
    prisma.carga.update({ where: { id: carga.id }, data: { isDefault: true } }),
  ]);
  res.json(updated);
});

router.put('/:id', async (req, res) => {
  const { name, slots, sortOrder } = req.body;
  const data: Record<string, unknown> = {};
  if (name !== undefined)      data.name      = name;
  if (slots !== undefined)     data.slots     = slots;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const carga = await prisma.carga.update({ where: { id: req.params.id }, data });
  res.json(carga);
});

router.delete('/:id', async (req, res) => {
  const carga = await prisma.carga.findUnique({ where: { id: req.params.id } });
  if (!carga) { res.status(404).json({ error: 'not found' }); return; }

  const siblings = await prisma.carga.findMany({ where: { personId: carga.personId } });
  if (siblings.length <= 1) {
    res.status(400).json({ error: 'cannot delete the last carga' });
    return;
  }

  await prisma.carga.delete({ where: { id: carga.id } });

  if (carga.isDefault) {
    const next = siblings
      .filter(c => c.id !== carga.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (next) {
      await prisma.carga.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  res.status(204).send();
});

export default router;
