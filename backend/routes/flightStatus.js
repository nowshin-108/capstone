import { API_KEY, API_SECRET, GOOGLE_MAPS_API_KEY } from "../config.js";
import Amadeus from "amadeus";
import express from "express";
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../auth.js';
import axios from 'axios';
import { getFlightStatus } from '../utils/flightUtils.js';

const prisma = new PrismaClient();
const router = express.Router();
const amadeus = new Amadeus({
clientId: API_KEY,
clientSecret: API_SECRET,
});

// Flight status endpoint for upcoming trip page
router.get('/flight-status', authenticateUser, async (req, res) => {
    try {
        const { carrierCode, flightNumber, scheduledDepartureDate } = req.query;
        if (!carrierCode || !flightNumber || !scheduledDepartureDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const response = await amadeus.schedule.flights.get({
            carrierCode, flightNumber, scheduledDepartureDate
        });
        const data = JSON.parse(response.body);
        const status = await getFlightStatus(carrierCode, flightNumber, scheduledDepartureDate); 
        res.json({data, status});
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching flight status', details: err.message });
    }
    });    

// Flight status endpoint for add trip page
router.get('/add-trip/flight-status', authenticateUser, async (req, res) => {
    try {
        const { carrierCode, flightNumber, scheduledDepartureDate } = req.query;
        if (!carrierCode || !flightNumber || !scheduledDepartureDate) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        const response = await amadeus.schedule.flights.get({
            carrierCode, flightNumber, scheduledDepartureDate
        });
        res.json(JSON.parse(response.body));
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while fetching flight status', details: err.message });
    }
    });

// Add trip endpoint
router.post('/add-trip', authenticateUser, async (req, res) => {
    try {
        const { carrierCode, flightNumber, departureAirportCode, arrivalAirportCode, scheduledDepartureDate, scheduledDepartureTime, scheduledArrivalTime, segments } = req.body;
        const userId = req.session.user.userId;
        const flightId = `${carrierCode}-${flightNumber}-${scheduledDepartureDate}`;

        const result = await prisma.$transaction(async (prisma) => {
            const flight = await prisma.flight.upsert({
                where: { flightId },
                update: {},
                create: {
                    flightId,
                    carrierCode,
                    flightNumber,
                    scheduledDepartureDate,
                    scheduledDepartureTime
                }
            });

            const newTrip = await prisma.trip.create({
                data: {
                    userId,
                    carrierCode,
                    flightNumber,
                    departureAirportCode,
                    arrivalAirportCode,
                    scheduledDepartureDate,
                    scheduledDepartureTime,
                    scheduledArrivalTime
                }
            });

            // Generate a random seat
            const generateRandomSeat = () => {
                const row = Math.floor(Math.random() * 30) + 1; // Assuming 30 rows
                const seat = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)];
                return `${row}${seat}`;
            };

            let seatAssigned = false;
            let attempts = 0;
            let seatNumber;
            
            // Allow system to try assigning a random seat multiple times in case the number is already taken
            while (!seatAssigned && attempts < 100) {
                seatNumber = generateRandomSeat();
                try {
                    await prisma.passenger.create({
                        data: {
                            userId,
                            flightId: flight.flightId,
                            seatNumber
                        }
                    });
                    seatAssigned = true;
                } catch (error) {
                    if (error.code === 'P2002') {
                        attempts++;
                    } else {
                        throw error;
                    }
                }
            }

            if (!seatAssigned) {
                throw new Error('Unable to assign a unique seat after multiple attempts');
            }

            // Create Segment records if there are multiple flight segments
            if (segments && segments.length > 0) {
                await Promise.all(segments.map(segment =>
                    prisma.segment.create({
                        data: {
                            tripId: newTrip.tripId,
                            boardPointCode: segment.boardPointCode,
                            offPointCode: segment.offPointCode,
                            scheduledSegmentDuration: segment.scheduledSegmentDuration
                        }
                    })
                ));
            }

            return { newTrip, seatNumber };
        });

        res.status(201).json({
            trip: result.newTrip,
            seatNumber: result.seatNumber
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add trip' });
    }
});


// Fetch upcoming trips for the authenticated user
router.get('/trips', authenticateUser, async (req, res) => {
try {
    const userId = req.session.user.userId;

    const upcomingTrips = await prisma.trip.findMany({
        where: {
            userId,
            scheduledDepartureDate: { gte: new Date().toISOString().slice(0, 10) },
        },
        include: { segments: true },
        orderBy: { scheduledDepartureDate: 'asc' },
    });

    const flightStatuses = await Promise.all(upcomingTrips.map(async (trip) => {
        try {
            const { status, error } = await getFlightStatus(trip.carrierCode, trip.flightNumber, trip.scheduledDepartureDate);
            return {
                tripId: trip.tripId,
                status: status.status, 
                departureDelay: status.departureDelay, 
                arrivalDelay: status.arrivalDelay,
                error: error
            };
            } catch (error) {
                console.error(`Error fetching status for trip ${trip.tripId}:`, error);
                return {
                    tripId: trip.tripId,
                    status: 'Scheduled',
                    error: 'Failed to fetch status'
                };
            }
        }));
    

    // Transform the data to match the TripCard component structure and include status
    const tripsData = upcomingTrips.map(trip => {
        const statusInfo = flightStatuses.find(s => s.tripId === trip.tripId);
        return {
            tripId: trip.tripId,
            carrierCode: trip.carrierCode,
            flightNumber: trip.flightNumber,
            departureAirportCode: trip.departureAirportCode,
            arrivalAirportCode: trip.arrivalAirportCode,
            scheduledDepartureDate: trip.scheduledDepartureDate,
            scheduledDepartureTime: trip.scheduledDepartureTime,
            scheduledArrivalTime: trip.scheduledArrivalTime,
            segments: trip.segments.map(segment => ({
            boardPointCode: segment.boardPointCode,
            scheduledSegmentDepartureTime: segment.scheduledSegmentDuration,
            })),
            status: statusInfo.status,
            statusError: statusInfo.error
        };
        });
        
    res.json(tripsData);
} catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming trips' });
}
});

// Fetch past trips for the authenticated user
router.get('/trips/past', authenticateUser, async (req, res) => {
    try {
        const userId = req.session.user.userId;
        const currentDateTime = new Date().toISOString();

        const pastTrips = await prisma.trip.findMany({
            where: {
                userId,
                scheduledDepartureTime: { lt: currentDateTime }
            },
            include: { segments: true },
            orderBy: { scheduledDepartureDate: 'desc' },
        });

        const tripsData = pastTrips.map(trip => ({
            tripId: trip.tripId,
            carrierCode: trip.carrierCode,
            flightNumber: trip.flightNumber,
            departureAirportCode: trip.departureAirportCode,
            arrivalAirportCode: trip.arrivalAirportCode,
            scheduledDepartureDate: trip.scheduledDepartureDate,
            scheduledDepartureTime: trip.scheduledDepartureTime,
            scheduledArrivalTime: trip.scheduledArrivalTime,
            segments: trip.segments.map(segment => ({
                boardPointCode: segment.boardPointCode,
                scheduledSegmentDepartureTime: segment.scheduledSegmentDuration,
            })),
            status: 'Completed'
        }));

        res.json(tripsData);
    } catch (error) {
        console.error('Error fetching past trips:', error);
        res.status(500).json({ error: 'Failed to fetch past trips' });
    }
});

// Delete trip endpoint
router.delete('/trips/:tripId', authenticateUser, async (req, res) => {
try {
    const tripId = parseInt(req.params.tripId);
    const userId = req.session.user.userId;

    const trip = await prisma.trip.findUnique({
        where: { tripId },
        select: { userId: true }
    });

    if (!trip) {
        return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.userId !== userId) {
        return res.status(403).json({ error: 'Not authorized to delete this trip' });
    }

    // Delete associated segments and the trip
    await prisma.$transaction([
        prisma.segment.deleteMany({ where: { tripId } }),
        prisma.trip.delete({ where: { tripId } })
    ]);

    res.status(200).json({ message: 'Trip deleted successfully' });
} catch (error) {
    res.status(500).json({ error: 'Failed to delete trip' });
}
});

// Get airline info endpoint
router.get('/airline-info/:carrierCode', authenticateUser, async (req, res) => {
try {
    const { carrierCode } = req.params;
    const response = await amadeus.referenceData.airlines.get({ airlineCodes: carrierCode });
    
    const airlineInfo = JSON.parse(response.body);
    if (airlineInfo.data && airlineInfo.data.length > 0) {
        res.json({ name: airlineInfo.data[0].businessName });
    } else {
        res.status(404).json({ error: 'Airline not found' });
    }
} catch (error) {
    res.status(500).json({ error: 'Failed to fetch airline info' });
}
});

// Get trip details endpoint
router.get('/trips/:tripId', authenticateUser, async (req, res) => {
try {
    const tripId = parseInt(req.params.tripId);
    const userId = req.session.user.userId;

    const trip = await prisma.trip.findUnique({
        where: { tripId },
        include: { segments: true }
    });

    if (!trip || trip.userId !== userId) {
        return res.status(404).json({ error: 'Trip not found' });
    }

    const flightId = `${trip.carrierCode}-${trip.flightNumber}-${trip.scheduledDepartureDate}`;
    const passenger = await prisma.passenger.findUnique({
        where: {
            flightId_userId: {
                flightId: flightId,
                userId: userId
            }
        },
        select: { seatNumber: true }
    }); 

    const formattedTrip = {
        ...trip,
        flightStatus: trip.flightStatus || 'Scheduled',
        seatNumber: passenger ? passenger.seatNumber : null
    };

    res.json(formattedTrip);
} catch (error) {
    res.status(500).json({ error: 'Failed to fetch trip details' });
}
});

// Get airport location endpoint
router.get('/airport-location/:code', async (req, res) => {
try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
            address: `${req.params.code} Airport`,
            key: GOOGLE_MAPS_API_KEY
        }
    });

    if (response.data.results && response.data.results.length > 0) {
        res.json({ location: response.data.results[0].geometry.location });
    } else {
        res.status(404).json({ error: 'Airport location not found' });
    }
} catch (error) {
    res.status(500).json({ error: 'Error fetching airport location' });
}
});

// Calculate route endpoint
router.post('/calculate-route', async (req, res) => {
try {
    const { origin, destination, departureTime } = req.body;

    // Get distance matrix data
    const matrixResponse = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${destination.lat},${destination.lng}`,
            departure_time: new Date(departureTime).getTime() / 1000,
            traffic_model: 'best_guess',
            key: GOOGLE_MAPS_API_KEY
        }
    });

    const element = matrixResponse.data.rows[0].elements[0];
    if (element.status === 'ZERO_RESULTS') {
        return res.json({
            error: 'No route found',
            message: 'Unable to calculate route. The origin and destination may be too far apart for driving directions.'
        });
    }

    // Get directions for route visualization
    const directionsResponse = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            key: GOOGLE_MAPS_API_KEY,
            travelMode: 'DRIVING'
        }
    });

    res.json({
        directions: directionsResponse.data,
        trafficData: {
            distance: element.distance.text,
            duration: element.duration_in_traffic.text,
            durationValue: element.duration_in_traffic.value,
        }
    });
} catch (error) {
    res.status(500).json({ error: 'Error calculating route', details: error.message });
}
});

// batch flight status check endpoint for upcoming trip list
router.post('/batch-flight-status', authenticateUser, async (req, res) => {
    try {
    const { flights } = req.body;
    const statuses = await Promise.all(flights.map(async (flight) => {
        const { status, error } = await getFlightStatus(flight.carrierCode, flight.flightNumber, flight.scheduledDepartureDate);
        return {
        tripId: flight.tripId,
        status: status.status, 
        departureDelay: status.departureDelay, 
        arrivalDelay: status.arrivalDelay,
        error: error
        };
    }));
    res.json(statuses);
    } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batch flight statuses' });
    }
});

export default router;
