import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/have', async (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart) { res.status(400).json({ error: 'weekStart required' }); return; }
  const rows = await prisma.shoppingHave.findMany({ where: { weekStart: String(weekStart) } });
  res.json(rows.map(r => r.proteinId));
});

router.post('/have', async (req, res) => {
  const { weekStart, proteinId, have } = req.body;
  if (!weekStart || !proteinId) { res.status(400).json({ error: 'weekStart and proteinId required' }); return; }

  if (have) {
    await prisma.shoppingHave.upsert({
      where:  { weekStart_proteinId: { weekStart, proteinId } },
      update: {},
      create: { weekStart, proteinId },
    });
  } else {
    await prisma.shoppingHave.deleteMany({ where: { weekStart, proteinId } });
  }
  res.status(204).send();
});

export default router;
