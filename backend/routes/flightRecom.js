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

// Flight recommendation generation endpoint 
router.get("/recommendations", async (req, res) => {
    const { departure_airport, arrival_airport, departure_time, preferred_airline_code } = req.query;
    try {
        const data = { departure_airport, arrival_airport, departure_time, preferred_airline_code };
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
    const recommendationResponse = await fetch(`${BACKEND_ORIGIN}/recommendations?departure_airport=${departure_airport}&arrival_airport=${arrival_airport}&departure_time=${departure_time}&preferred_airline_code=${preferred_airline_code}`);
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