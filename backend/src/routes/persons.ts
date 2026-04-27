import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res) => {
  const persons = await prisma.person.findMany({ orderBy: { id: 'asc' } });
  res.json(persons);
});

router.post('/', async (req, res) => {
  const { id, name } = req.body;
  if (!id || !name) { res.status(400).json({ error: 'id and name required' }); return; }
  const person = await prisma.person.create({ data: { id, name } });
  res.status(201).json(person);
});

router.put('/:id', async (req, res) => {
  const { name } = req.body;
  const person = await prisma.person.update({ where: { id: req.params.id }, data: { name } });
  res.json(person);
});

router.delete('/:id', async (req, res) => {
  await prisma.person.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
