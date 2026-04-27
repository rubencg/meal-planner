import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/:personId', async (req, res) => {
  const plan = await prisma.mealPlan.findUnique({ where: { personId: req.params.personId } });
  if (!plan) {
    res.json({ personId: req.params.personId, slots: {} });
    return;
  }
  res.json(plan);
});

router.put('/:personId', async (req, res) => {
  const { slots } = req.body;
  const plan = await prisma.mealPlan.upsert({
    where:  { personId: req.params.personId },
    update: { slots },
    create: { personId: req.params.personId, slots },
  });
  res.json(plan);
});

export default router;
