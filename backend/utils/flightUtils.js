import { API_KEY, API_SECRET } from "../config.js";
import Amadeus from "amadeus";
const amadeus = new Amadeus({
    clientId: API_KEY,
    clientSecret: API_SECRET,
});

export function calculateFlightStatus(flightData) {
    const now = new Date();
    const flightPoint = flightData.data[0].flightPoints;
    const departurePoint = flightPoint.find(point => point.departure);
    const arrivalPoint = flightPoint.find(point => point.arrival);
    
    const scheduledDepartureTime = new Date(departurePoint.departure.timings.find(t => t.qualifier === 'STD').value);
    const scheduledArrivalTime = new Date(arrivalPoint.arrival.timings.find(t => t.qualifier === 'STA').value);

    // Check for delays
    const departureDelay = getDuration(departurePoint.departure.timings.find(t => t.qualifier === 'STD')?.delays?.[0]?.duration);
    const arrivalDelay = getDuration(arrivalPoint.arrival.timings.find(t => t.qualifier === 'STA')?.delays?.[0]?.duration);

    if (now < scheduledDepartureTime) {
        if (departureDelay > 0) {
            return { status: `Delayed (${formatDuration(departureDelay)})`, departureDelay, arrivalDelay };
        }
        return { status: 'Scheduled', departureDelay, arrivalDelay };
    } else if (now < scheduledArrivalTime) {
        if (arrivalDelay > 0) {
            return { status: `In Air - Expected Late (${formatDuration(arrivalDelay)})`, departureDelay, arrivalDelay };
        }
        return { status: 'In Air', departureDelay, arrivalDelay };
    } else {
        if (arrivalDelay > 0) {
            return { status: `Arrived Late (${formatDuration(arrivalDelay)})`, departureDelay, arrivalDelay };
        }
        return { status: 'Arrived', departureDelay, arrivalDelay };
    }
}

function getDuration(isoDuration) {
    if (!isoDuration) return 0;
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
    let minutes = 0;
    if (match[1]) minutes += parseInt(match[1]) * 60;
    if (match[2]) minutes += parseInt(match[2]);
    return minutes;
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export async function getFlightStatus(carrierCode, flightNumber, scheduledDepartureDate) {
    try {
    const response = await amadeus.schedule.flights.get({
        carrierCode,
        flightNumber,
        scheduledDepartureDate
    });
    const flightData = response.result;
    return { status: calculateFlightStatus(flightData), error: null };
    } catch (error) {
    console.error('Error fetching flight status:', error);
    return { status: null, error: 'Unable to fetch current status' };
    }
}


