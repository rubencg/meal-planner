-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InBodyRecord" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weight" DOUBLE PRECISION,
    "skeletalMuscleMass" DOUBLE PRECISION,
    "bodyFatMass" DOUBLE PRECISION,
    "bodyFatPercent" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "visceralFatLevel" INTEGER,
    "bmr" INTEGER,
    "recommendedCalories" INTEGER,
    "waistHipRatio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InBodyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protein" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lossPercent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "Protein_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "slots" JSONB NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerEntry" (
    "id" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "proteinId" TEXT,
    "cookedGrams" INTEGER,

    CONSTRAINT "PlannerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarbFood" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "unitsPerPortion" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarbFood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerCarb" (
    "id" TEXT NOT NULL,
    "plannerEntryId" TEXT NOT NULL,
    "carbFoodId" TEXT NOT NULL,
    "portions" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlannerCarb_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingHave" (
    "id" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "proteinId" TEXT NOT NULL,

    CONSTRAINT "ShoppingHave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InBodyRecord_personId_idx" ON "InBodyRecord"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_personId_key" ON "MealPlan"("personId");

-- CreateIndex
CREATE INDEX "PlannerEntry_weekStart_idx" ON "PlannerEntry"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "PlannerEntry_weekStart_personId_day_slot_key" ON "PlannerEntry"("weekStart", "personId", "day", "slot");

-- CreateIndex
CREATE INDEX "CarbFood_personId_idx" ON "CarbFood"("personId");

-- CreateIndex
CREATE INDEX "PlannerCarb_plannerEntryId_idx" ON "PlannerCarb"("plannerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingHave_weekStart_proteinId_key" ON "ShoppingHave"("weekStart", "proteinId");

-- AddForeignKey
ALTER TABLE "InBodyRecord" ADD CONSTRAINT "InBodyRecord_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerEntry" ADD CONSTRAINT "PlannerEntry_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerEntry" ADD CONSTRAINT "PlannerEntry_proteinId_fkey" FOREIGN KEY ("proteinId") REFERENCES "Protein"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarbFood" ADD CONSTRAINT "CarbFood_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerCarb" ADD CONSTRAINT "PlannerCarb_plannerEntryId_fkey" FOREIGN KEY ("plannerEntryId") REFERENCES "PlannerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannerCarb" ADD CONSTRAINT "PlannerCarb_carbFoodId_fkey" FOREIGN KEY ("carbFoodId") REFERENCES "CarbFood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
