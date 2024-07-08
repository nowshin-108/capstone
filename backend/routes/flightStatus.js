import { API_KEY, API_SECRET } from "../config.js";
import Amadeus from "amadeus";
import express from "express";
import { PrismaClient } from '@prisma/client'; 
import { authenticateUser } from '../auth.js';

const prisma = new PrismaClient();
const router = express.Router();
const amadeus = new Amadeus({
    clientId: API_KEY,
    clientSecret: API_SECRET,
});

//flight search for adding trip - needs authentication
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


// saving static trip details on adding trip - needs authentication
router.post('/add-trip', authenticateUser, async (req, res) => {
    try {
        const { carrierCode, flightNumber, departureAirportCode, arrivalAirportCode, scheduledDepartureDate, scheduledDepartureTime, scheduledArrivalTime } = req.body;
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
        const { segments } = req.body;
        if (segments && segments.length > 0) {
            await Promise.all(segments.map(async (segment) => {
            await prisma.segment.create({
                data: {
                tripId: newTrip.tripId,
                boardPointCode: segment.boardPointCode,
                offPointCode: segment.offPointCode,
                scheduledSegmentDuration: segment.scheduledSegmentDuration
                }
            });
            }));
        }
    
        res.status(201).json(newTrip);
        } catch (error) {
        res.status(500).json({ error: 'Failed to add trip' });
        }
    });


// Route to fetch the upcoming trips for the authenticated user
router.get('/trips', authenticateUser, async (req, res) => {
    try {
    const userId = req.session.user.userId;

    // Fetch the upcoming trips for the user
    const upcomingTrips = await prisma.trip.findMany({
        where: {
        userId,
        scheduledDepartureDate: { gte: new Date().toISOString().slice(0, 10) },
        },
        include: {
        segments: true,
        },
        orderBy: {
        scheduledDepartureDate: 'asc',
        },
    });

    // Transform the data to match the TripCard component structure
    const tripsData = upcomingTrips.map((trip) => ({
        tripId: trip.tripId,
        carrierCode: trip.carrierCode,
        flightNumber: trip.flightNumber,
        departureAirportCode: trip.departureAirportCode,
        arrivalAirportCode: trip.arrivalAirportCode,
        scheduledDepartureDate: trip.scheduledDepartureDate,
        scheduledDepartureTime: trip.scheduledDepartureTime,
        scheduledArrivalTime: trip.scheduledArrivalTime,
        segments: trip.segments.map((segment) => ({
        boardPointCode: segment.boardPointCode,
        scheduledSegmentDepartureTime: segment.scheduledSegmentDuration,
        })),
    }));

    res.json(tripsData);
    } catch (error) {
    console.error('Error fetching upcoming trips:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming trips' });
    }
});



export default router;