import express from "express";
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '../auth.js';
import { exec } from 'child_process';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { BACKEND_ORIGIN } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const router = express.Router();

async function getUserAirlineUsage(userId, preferredAirlineCode) {
    const airlineUsage = await prisma.trip.groupBy({
        by: ['carrierCode'],
        where: {
            userId: userId,
        },
        _count: {
            carrierCode: true
        }
        });
    
        return airlineUsage.map(usage => ({
        airlineCode: usage.carrierCode,
        count: usage.carrierCode === preferredAirlineCode 
            ? Math.max(0, usage._count.carrierCode - 1) 
            : usage._count.carrierCode
    }));
}  

// Flight recommendation generation endpoint 
router.get("/recommendations", async (req, res) => {
    const { departure_airport, arrival_airport, departure_time, preferred_airline_code, userId } = req.query;
    try {

        const airlineUsage = await getUserAirlineUsage(parseFloat(userId), preferred_airline_code);
        console.log("airline usage", airlineUsage)

        const data = { departure_airport, arrival_airport, departure_time, preferred_airline_code, airline_usage: airlineUsage };
        const dataString = JSON.stringify(data);
        const scriptPath = "/Users/nowshinanber/Desktop/capstone/backend/alternative_flights/alt_flight_search.py";
        const pythonProcess = exec(`python3 ${scriptPath}`);
        pythonProcess.stdin.write(dataString);
        pythonProcess.stdin.end();
        let pythonOutput = "";
        pythonProcess.stdout.on("data", (data) => {
            pythonOutput += data;
        });
        pythonProcess.stderr.on("data", (data) => {
            console.error(`stderr: ${data}`);
        });
        pythonProcess.on("close", (code) => {
            if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            return res.status(500).send("Error generating recommendations");
            }
            try {
            const recommendations = JSON.parse(pythonOutput);
            res.json(recommendations);
            } catch (parseError) {
            console.error("Failed to parse recommendations:", parseError);
            res.status(500).send("Server error: Failed to parse recommendations");
            }
        });
        } catch (error) {
        console.error("Failed to generate recommendations:", error);
        console.error("Raw output", pythonOutput)
        res.status(500).send("Failed to generate recommendations");
        }
    });
    
// result.json fetch endpoint
router.get("/alternative-flights", authenticateUser, async (req, res) => {
    const { departure_airport, arrival_airport, departure_time, preferred_airline_code } = req.query;
    if (!departure_airport || !arrival_airport || !departure_time) {
    return res.status(400).send("Missing required parameters");
    }

    try {
    const userId = req.session.user.userId
    const recommendationResponse = await fetch(`${BACKEND_ORIGIN}/recommendations?departure_airport=${departure_airport}&arrival_airport=${arrival_airport}&departure_time=${departure_time}&preferred_airline_code=${preferred_airline_code}&userId=${userId}`);
    if (!recommendationResponse.ok) {
        throw new Error('Failed to generate recommendations');
    }
    const resultsPath = path.join(__dirname, 'results.json');
    const resultsData = await fs.readFile(resultsPath, 'utf8');
    const results = JSON.parse(resultsData);

    res.json(results);
    } catch (error) {
    console.error("Error fetching alternative flights:", error);
    res.status(500).send("Failed to fetch alternative flights");
    }
});

export default router;