import express from 'express';
import cors from 'cors';

import personsRouter   from './routes/persons';
import inbodyRouter    from './routes/inbody';
import proteinsRouter  from './routes/proteins';
import mealPlansRouter from './routes/mealPlans';
import plannerRouter   from './routes/planner';
import shoppingRouter  from './routes/shopping';
import carbFoodsRouter from './routes/carbFoods';

const app  = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/persons',    personsRouter);
app.use('/api/inbody',     inbodyRouter);
app.use('/api/proteins',   proteinsRouter);
app.use('/api/meal-plans', mealPlansRouter);
app.use('/api/planner',    plannerRouter);
app.use('/api/shopping',   shoppingRouter);
app.use('/api/carb-foods', carbFoodsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`Tiki API running on http://localhost:${PORT}`);
});
