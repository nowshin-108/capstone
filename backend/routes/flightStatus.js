import { API_KEY, API_SECRET, GOOGLE_MAPS_API_KEY } from "../config.js";
import Amadeus from "amadeus";
import express from "express";
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../auth.js';
import axios from 'axios';

const prisma = new PrismaClient();
const router = express.Router();
const amadeus = new Amadeus({
clientId: API_KEY,
clientSecret: API_SECRET,
});

// Flight status endpoint
router.get('/flight-status', authenticateUser, async (req, res) => {
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

    res.status(201).json(newTrip);
} catch (error) {
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

    // Transform the data to match the TripCard component structure
    const tripsData = upcomingTrips.map(trip => ({
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
    }));

    res.json(tripsData);
} catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming trips' });
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

    const formattedTrip = {
        ...trip,
        flightStatus: trip.flightStatus || 'Scheduled',
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

export default router;