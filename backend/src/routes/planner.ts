import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart) { res.status(400).json({ error: 'weekStart required' }); return; }
  const entries = await prisma.plannerEntry.findMany({
    where:   { weekStart: String(weekStart) },
    include: { protein: true },
  });
  res.json(entries);
});

router.post('/', async (req, res) => {
  const { weekStart, personId, day, slot, proteinId, cookedGrams } = req.body;
  if (!weekStart || !personId || !day || !slot) {
    res.status(400).json({ error: 'weekStart, personId, day, slot required' });
    return;
  }
  const entry = await prisma.plannerEntry.upsert({
    where:  { weekStart_personId_day_slot: { weekStart, personId, day, slot } },
    update: { proteinId: proteinId ?? null, cookedGrams: cookedGrams ?? null },
    create: { weekStart, personId, day, slot, proteinId: proteinId ?? null, cookedGrams: cookedGrams ?? null },
    include: { protein: true },
  });
  res.json(entry);
});

router.delete('/', async (req, res) => {
  const { weekStart, personId, day, slot } = req.query;
  if (!weekStart || !personId) { res.status(400).json({ error: 'weekStart and personId required' }); return; }

  if (day && slot) {
    await prisma.plannerEntry.deleteMany({
      where: { weekStart: String(weekStart), personId: String(personId), day: String(day), slot: String(slot) },
    });
  } else {
    await prisma.plannerEntry.deleteMany({
      where: { weekStart: String(weekStart), personId: String(personId) },
    });
  }
  res.status(204).send();
});

export default router;
