/*
  Warnings:

  - Changed the type of `flightNumber` on the `Trip` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "flightNumber",
ADD COLUMN     "flightNumber" INTEGER NOT NULL;
