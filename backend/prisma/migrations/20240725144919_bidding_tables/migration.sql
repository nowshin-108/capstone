/*
  Warnings:

  - Added the required column `scheduledDepartureTime` to the `Flight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "scheduledDepartureTime" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Bidding" (
    "biddingId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "passengerId" INTEGER NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "expirationTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Bidding_pkey" PRIMARY KEY ("biddingId")
);

-- CreateTable
CREATE TABLE "Bid" (
    "bidId" SERIAL NOT NULL,
    "biddingId" TEXT NOT NULL,
    "bidderId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "bidderSeatNumber" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("bidId")
);

-- AddForeignKey
ALTER TABLE "Bidding" ADD CONSTRAINT "Bidding_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("flightId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bidding" ADD CONSTRAINT "Bidding_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("passengerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_biddingId_fkey" FOREIGN KEY ("biddingId") REFERENCES "Bidding"("biddingId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "Passenger"("passengerId") ON DELETE RESTRICT ON UPDATE CASCADE;
