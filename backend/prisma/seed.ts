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

  // Cargas — planes completos por intensidad de entrenamiento, con todos sus slots
  const cargasByPerson: Record<string, Array<{ id: string; name: string; isDefault: boolean; sortOrder: number; slots: any }>> = {
    ruben: [
      {
        id: 'carga-ruben-baja', name: 'Carga baja', isDefault: true, sortOrder: 0,
        slots: {
          entrenamiento: { text: 'Antes: 1 rice cake con 1 cdita de cacahuate. Durante: suero. Terminando: 1 medida de proteína y ½ tza de fresas.' },
          desayuno: { protein: 90, carbs: 1, notes: '' },
          snack1:   { text: '½ tza de fruta y ½ medida de proteína' },
          almuerzo: { protein: 90, carbs: 2, notes: '' },
          snack2:   { text: '½ tza de fruta y ½ medida de proteína' },
          cena:     { protein: 90, carbs: 2, notes: '' },
        },
      },
      {
        id: 'carga-ruben-alta', name: 'Carga alta', isDefault: false, sortOrder: 1,
        slots: {
          entrenamiento: { text: 'Antes: 3 rice cake con 1 cdita de cacahuate. Durante: suero. Terminando: 1 medida de proteína y ½ tza de fresas + 2 cdas de avena.' },
          desayuno: { protein: 120, carbs: 1, notes: '' },
          snack1:   { text: '½ tza de fruta' },
          almuerzo: { protein: 160, carbs: 2, notes: '' },
          snack2:   { text: '½ tza de fruta y ½ tza de yogurt griego o ½ medida de proteína' },
          cena:     { protein: 160, carbs: 2, notes: '' },
        },
      },
    ],
    sarahi: [
      {
        id: 'carga-sarahi-base', name: 'Carga base', isDefault: true, sortOrder: 0,
        slots: {
          entrenamiento: { text: 'Antes: ½ medida de proteína y ½ tza de fruta. Durante: suero. Terminando: ½ medida de proteína.' },
          desayuno: { protein: 160, carbs: 2, notes: '' },
          snack1:   { text: '½ tza de fruta y ½ medida de proteína' },
          almuerzo: { protein: 200, carbs: 2, notes: '' },
          snack2:   { text: '1 tza de fruta y ½ medida de proteína' },
          cena:     { protein: 200, carbs: 2, notes: '' },
        },
      },
    ],
  };

  for (const [personId, list] of Object.entries(cargasByPerson)) {
    for (const c of list) {
      await prisma.carga.upsert({
        where:  { id: c.id },
        update: { name: c.name, isDefault: c.isDefault, sortOrder: c.sortOrder, slots: c.slots, personId },
        create: { id: c.id, personId, name: c.name, isDefault: c.isDefault, sortOrder: c.sortOrder, slots: c.slots },
      });
    }
  }

  // CarbFood catalog
  const carbFoods = [
    { name: 'Tortilla de maíz',  unitLabel: 'pza',     unitsPerPortion: 1   },
    { name: 'Tostada sanísimo',  unitLabel: 'pza',     unitsPerPortion: 2   },
    { name: 'Quinoa',            unitLabel: 'tza',     unitsPerPortion: 0.5 },
    { name: 'Salmitas',          unitLabel: 'paquete', unitsPerPortion: 1   },
    { name: 'Camote',            unitLabel: 'tza',     unitsPerPortion: 0.5 },
    { name: 'Arroz',             unitLabel: 'tza',     unitsPerPortion: 0.5 },
    { name: 'Pan integral',      unitLabel: 'reb',     unitsPerPortion: 1   },
    { name: 'Avena',             unitLabel: 'tza',     unitsPerPortion: 0.5 },
    { name: 'Pasta',             unitLabel: 'tza',     unitsPerPortion: 0.5 },
    { name: 'Waffles de camote', unitLabel: 'pza',     unitsPerPortion: 2   },
  ];

  for (const personId of ['ruben', 'sarahi']) {
    for (let i = 0; i < carbFoods.length; i++) {
      const f = carbFoods[i];
      const id = `cf-${personId}-${i + 1}`;
      await prisma.carbFood.upsert({
        where:  { id },
        update: { ...f, personId, sortOrder: i },
        create: { id, ...f, personId, sortOrder: i },
      });
    }
  }

  console.log('Seed complete ✓');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
