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
        const { carrierCode, flightNumber, scheduledDepartureDate } = req.body; 
        const userId = req.session.user.userId;
        const newTrip = await prisma.trip.create({ 
        data: { userId, carrierCode, flightNumber, scheduledDepartureDate } 
        }); 
        res.status(201).json(newTrip); 
    } catch (error) { 
        res.status(500).json({ error: 'Failed to add trip' }); 
    } 
});


export default router;