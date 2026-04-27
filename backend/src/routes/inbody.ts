import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  const { personId } = req.query;
  const records = await prisma.inBodyRecord.findMany({
    where:   personId ? { personId: String(personId) } : undefined,
    orderBy: { date: 'asc' },
  });
  res.json(records);
});

router.post('/', async (req, res) => {
  const { personId, date, ...rest } = req.body;
  if (!personId || !date) { res.status(400).json({ error: 'personId and date required' }); return; }
  const record = await prisma.inBodyRecord.create({ data: { personId, date, ...rest } });
  res.status(201).json(record);
});

router.put('/:id', async (req, res) => {
  const { id, personId, createdAt, ...data } = req.body;
  const record = await prisma.inBodyRecord.update({ where: { id: req.params.id }, data });
  res.json(record);
});

router.delete('/:id', async (req, res) => {
  await prisma.inBodyRecord.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
