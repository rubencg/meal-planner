import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const proteins = await prisma.protein.findMany({ orderBy: { name: 'asc' } });
  res.json(proteins);
});

router.post('/', async (req, res) => {
  const { name, lossPercent, notes } = req.body;
  if (!name) { res.status(400).json({ error: 'name required' }); return; }
  const protein = await prisma.protein.create({ data: { name, lossPercent: lossPercent ?? 0, notes } });
  res.status(201).json(protein);
});

router.put('/:id', async (req, res) => {
  const { id, ...data } = req.body;
  const protein = await prisma.protein.update({ where: { id: req.params.id }, data });
  res.json(protein);
});

router.delete('/:id', async (req, res) => {
  await prisma.protein.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
