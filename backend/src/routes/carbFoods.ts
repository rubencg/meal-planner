import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const { personId } = req.query;
  if (!personId) { res.status(400).json({ error: 'personId required' }); return; }
  const carbFoods = await prisma.carbFood.findMany({
    where:   { personId: String(personId) },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
  res.json(carbFoods);
});

router.post('/', async (req, res) => {
  const { personId, name, unitLabel, unitsPerPortion, notes, sortOrder } = req.body;
  if (!personId || !name || !unitLabel || unitsPerPortion == null) {
    res.status(400).json({ error: 'personId, name, unitLabel, unitsPerPortion required' });
    return;
  }
  if (typeof unitsPerPortion !== 'number' || unitsPerPortion <= 0) {
    res.status(400).json({ error: 'unitsPerPortion must be a number greater than 0' });
    return;
  }
  const carbFood = await prisma.carbFood.create({
    data: { personId, name, unitLabel, unitsPerPortion, notes, sortOrder: sortOrder ?? 0 },
  });
  res.status(201).json(carbFood);
});

router.put('/:id', async (req, res) => {
  const { id, ...data } = req.body;
  if (data.unitsPerPortion != null && (typeof data.unitsPerPortion !== 'number' || data.unitsPerPortion <= 0)) {
    res.status(400).json({ error: 'unitsPerPortion must be a number greater than 0' });
    return;
  }
  const carbFood = await prisma.carbFood.update({ where: { id: req.params.id }, data });
  res.json(carbFood);
});

router.delete('/:id', async (req, res) => {
  await prisma.carbFood.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
