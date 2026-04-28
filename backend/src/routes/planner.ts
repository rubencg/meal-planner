import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

const plannerInclude = {
  protein: true,
  carbs: { include: { carbFood: true } },
} as const;

router.get('/', async (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart) { res.status(400).json({ error: 'weekStart required' }); return; }
  const entries = await prisma.plannerEntry.findMany({
    where:   { weekStart: String(weekStart) },
    include: plannerInclude,
  });
  res.json(entries);
});

router.post('/', async (req, res) => {
  const { weekStart, personId, day, slot, proteinId, cookedGrams, carbs } = req.body;
  if (!weekStart || !personId || !day || !slot) {
    res.status(400).json({ error: 'weekStart, personId, day, slot required' });
    return;
  }

  const entry = await prisma.plannerEntry.upsert({
    where:  { weekStart_personId_day_slot: { weekStart, personId, day, slot } },
    update: { proteinId: proteinId ?? null, cookedGrams: cookedGrams ?? null },
    create: { weekStart, personId, day, slot, proteinId: proteinId ?? null, cookedGrams: cookedGrams ?? null },
  });

  if (carbs !== undefined) {
    const carbItems = carbs as Array<{ carbFoodId: string; portions: number }>;
    const deleteOp = prisma.plannerCarb.deleteMany({ where: { plannerEntryId: entry.id } });
    if (carbItems.length > 0) {
      await prisma.$transaction([
        deleteOp,
        prisma.plannerCarb.createMany({
          data: carbItems.map(c => ({
            plannerEntryId: entry.id,
            carbFoodId:     c.carbFoodId,
            portions:       c.portions,
          })),
        }),
      ]);
    } else {
      await prisma.$transaction([deleteOp]);
    }
  }

  const result = await prisma.plannerEntry.findUnique({
    where:   { id: entry.id },
    include: plannerInclude,
  });
  res.json(result);
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
