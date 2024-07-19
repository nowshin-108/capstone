-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Trip" (
    "tripId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "carrierCode" TEXT NOT NULL,
    "flightNumber" INTEGER NOT NULL,
    "departureAirportCode" TEXT NOT NULL,
    "arrivalAirportCode" TEXT NOT NULL,
    "scheduledDepartureDate" TEXT NOT NULL,
    "scheduledDepartureTime" TEXT NOT NULL,
    "scheduledArrivalTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("tripId")
);

-- CreateTable
CREATE TABLE "Segment" (
    "segmentId" SERIAL NOT NULL,
    "tripId" INTEGER NOT NULL,
    "boardPointCode" TEXT NOT NULL,
    "offPointCode" TEXT NOT NULL,
    "scheduledSegmentDuration" TEXT NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("segmentId")
);

-- CreateTable
CREATE TABLE "Flight" (
    "flightId" TEXT NOT NULL,
    "carrierCode" TEXT NOT NULL,
    "flightNumber" INTEGER NOT NULL,
    "scheduledDepartureDate" TEXT NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("flightId")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "passengerId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "flightId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("passengerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_userId_carrierCode_flightNumber_scheduledDepartureDate_key" ON "Trip"("userId", "carrierCode", "flightNumber", "scheduledDepartureDate");

-- CreateIndex
CREATE UNIQUE INDEX "Flight_carrierCode_flightNumber_scheduledDepartureDate_key" ON "Flight"("carrierCode", "flightNumber", "scheduledDepartureDate");

-- CreateIndex
CREATE UNIQUE INDEX "Passenger_flightId_seatNumber_key" ON "Passenger"("flightId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Passenger_flightId_userId_key" ON "Passenger"("flightId", "userId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("tripId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("flightId") ON DELETE RESTRICT ON UPDATE CASCADE;
