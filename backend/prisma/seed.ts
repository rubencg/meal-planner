import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Persons
  await prisma.person.upsert({ where: { id: 'ruben' },   update: {}, create: { id: 'ruben',   name: 'Ruben'   } });
  await prisma.person.upsert({ where: { id: 'sarahi' },  update: {}, create: { id: 'sarahi',  name: 'Sarahi'  } });

  // Proteins
  const proteins = [
    { id: 'p1', name: 'Pechuga de Pollo',   lossPercent: 20, notes: '' },
    { id: 'p2', name: 'Carne Molida (90%)', lossPercent: 25, notes: '' },
    { id: 'p3', name: 'Salmón',             lossPercent: 15, notes: '' },
    { id: 'p4', name: 'Atún (en agua)',      lossPercent: 0,  notes: 'Sin cocción' },
    { id: 'p5', name: 'Claras de Huevo',    lossPercent: 10, notes: '' },
    { id: 'p6', name: 'Camarones',          lossPercent: 18, notes: '' },
    { id: 'p7', name: 'Tilapia',            lossPercent: 17, notes: '' },
    { id: 'p8', name: 'Pavo Molido',        lossPercent: 22, notes: '' },
  ];
  for (const p of proteins) {
    await prisma.protein.upsert({ where: { id: p.id }, update: p, create: p });
  }

  // InBody records
  const inbody = [
    { id: 'ib1', personId: 'ruben',   date: '2025-01-10', weight: 185, skeletalMuscleMass: 85, bodyFatMass: 25, bodyFatPercent: 13.5, bmi: 26.1, visceralFatLevel: 8, bmr: 1950, recommendedCalories: 2300, waistHipRatio: 0.85 },
    { id: 'ib2', personId: 'ruben',   date: '2025-02-08', weight: 182, skeletalMuscleMass: 87, bodyFatMass: 22, bodyFatPercent: 12.1, bmi: 25.7, visceralFatLevel: 7, bmr: 1970, recommendedCalories: 2350, waistHipRatio: 0.84 },
    { id: 'ib3', personId: 'ruben',   date: '2025-03-07', weight: 179, skeletalMuscleMass: 89, bodyFatMass: 19, bodyFatPercent: 10.6, bmi: 25.2, visceralFatLevel: 6, bmr: 1990, recommendedCalories: 2400, waistHipRatio: 0.83 },
    { id: 'ib4', personId: 'ruben',   date: '2025-04-04', weight: 177, skeletalMuscleMass: 90, bodyFatMass: 17, bodyFatPercent:  9.6, bmi: 24.9, visceralFatLevel: 5, bmr: 2010, recommendedCalories: 2420, waistHipRatio: 0.82 },
    { id: 'ib5', personId: 'sarahi',  date: '2025-01-10', weight: 135, skeletalMuscleMass: 52, bodyFatMass: 30, bodyFatPercent: 22.2, bmi: 22.1, visceralFatLevel: 5, bmr: 1450, recommendedCalories: 1700, waistHipRatio: 0.78 },
    { id: 'ib6', personId: 'sarahi',  date: '2025-02-08', weight: 132, skeletalMuscleMass: 53, bodyFatMass: 27, bodyFatPercent: 20.5, bmi: 21.6, visceralFatLevel: 4, bmr: 1470, recommendedCalories: 1750, waistHipRatio: 0.77 },
    { id: 'ib7', personId: 'sarahi',  date: '2025-03-07', weight: 130, skeletalMuscleMass: 54, bodyFatMass: 25, bodyFatPercent: 19.2, bmi: 21.3, visceralFatLevel: 4, bmr: 1490, recommendedCalories: 1780, waistHipRatio: 0.76 },
    { id: 'ib8', personId: 'sarahi',  date: '2025-04-04', weight: 128, skeletalMuscleMass: 55, bodyFatMass: 23, bodyFatPercent: 18.0, bmi: 21.0, visceralFatLevel: 3, bmr: 1510, recommendedCalories: 1800, waistHipRatio: 0.75 },
  ];
  for (const r of inbody) {
    await prisma.inBodyRecord.upsert({ where: { id: r.id }, update: r, create: r });
  }

  // Meal plans
  const mealPlans = [
    {
      personId: 'ruben',
      slots: {
        desayuno:    { protein: 50, carbs: 60, fruit: 0,   notes: '' },
        snack1:      { protein: 30, carbs: 30, fruit: 0.5, notes: '½ taza de berries' },
        almuerzo:    { protein: 60, carbs: 70, fruit: 0,   notes: '' },
        snack2:      { protein: 30, carbs: 25, fruit: 0.5, notes: '½ taza de fruta' },
        cena:        { protein: 55, carbs: 50, fruit: 0,   notes: '' },
        preEntreno:  { protein: 25, carbs: 40, fruit: 0,   notes: '30 min antes' },
        postEntreno: { protein: 40, carbs: 30, fruit: 0,   notes: 'Inmediatamente después' },
      },
    },
    {
      personId: 'sarahi',
      slots: {
        desayuno:    { protein: 35, carbs: 45, fruit: 0,   notes: '' },
        snack1:      { protein: 20, carbs: 20, fruit: 0.5, notes: '½ taza de berries' },
        almuerzo:    { protein: 40, carbs: 50, fruit: 0,   notes: '' },
        snack2:      { protein: 20, carbs: 20, fruit: 0.5, notes: '½ taza de fruta' },
        cena:        { protein: 38, carbs: 35, fruit: 0,   notes: '' },
        preEntreno:  { protein: 18, carbs: 25, fruit: 0,   notes: '' },
        postEntreno: { protein: 28, carbs: 20, fruit: 0,   notes: '' },
      },
    },
  ];
  for (const mp of mealPlans) {
    await prisma.mealPlan.upsert({
      where:  { personId: mp.personId },
      update: { slots: mp.slots },
      create: mp,
    });
  }

  console.log('Seed complete ✓');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
