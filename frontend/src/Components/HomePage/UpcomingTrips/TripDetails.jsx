import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { IoAirplane } from "react-icons/io5";
import { API_BASE_URL } from '../../../config';
import { getCityName } from '../../../assets/data/airportCityMap';
import TrafficInfo from './TrafficInfo';
import './TripDetails.css';


const TripDetails = () => {
const [trip, setTrip] = useState(null);
const [flightStatus, setFlightStatus] = useState(null);
const [airlineName, setAirlineName] = useState('');
const [userLocation, setUserLocation] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [isLocationLoading, setIsLocationLoading] = useState(true);
const [error, setError] = useState(null);
const { tripId } = useParams();


// Get user's current location
const getUserLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
    }


    navigator.geolocation.getCurrentPosition(
        (position) => {
        resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
        });
        },
        (error) => {
        reject(error);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
    });
}, []);


useEffect(() => {
    const fetchAllData = async () => {
    try {
        setIsLoading(true);
        setIsLocationLoading(true);
        
        // Fetch trip data
        const tripResponse = await axios.get(`${API_BASE_URL}/trips/${tripId}`, { withCredentials: true });
        setTrip(tripResponse.data);


        // Fetch flight status
        const { carrierCode, flightNumber, scheduledDepartureDate } = tripResponse.data;
        const statusResponse = await axios.get(`${API_BASE_URL}/flight-status`, {
        params: { carrierCode, flightNumber, scheduledDepartureDate },
        withCredentials: true
        });
        setFlightStatus(statusResponse.data.data[0]);


        // Fetch airline info
        const airlineResponse = await axios.get(`${API_BASE_URL}/airline-info/${carrierCode}`, { withCredentials: true });
        setAirlineName(airlineResponse.data.name);


        // Get user location
        const location = await getUserLocation();
        setUserLocation(location);


    } catch (error) {
        setError(error.message || 'An error occurred while loading the page. Please try again.');
    } finally {
        setIsLoading(false);
        setIsLocationLoading(false);
    }
    };


    fetchAllData();
}, [tripId, getUserLocation]);


if (isLoading) {
    return <div className="loader"></div>;
}


if (error) {
    return <div className="error">{error}</div>;
}


if (!trip || !flightStatus) {
    return <div className="error">Unable to load trip details. Please try again.</div>;
}


const departurePoint = flightStatus.flightPoints.find(point => point.departure);
const arrivalPoint = flightStatus.flightPoints.find(point => point.arrival);


// Format date to 'Day, Month Date, Year' format
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
};


// Format time to 'HH:MM AM/PM' format
const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};


// Calculate flight duration
const calculateDuration = () => {
    const departure = new Date(departurePoint.departure.timings[0].value);
    const arrival = new Date(arrivalPoint.arrival.timings[0].value);
    const durationMs = arrival - departure;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
};


// Determine current flight status
const getFlightStatus = () => {
    const now = new Date();
    const departureTime = new Date(departurePoint.departure.timings[0].value);
    const arrivalTime = new Date(arrivalPoint.arrival.timings[0].value);
    const scheduledArrivalTime = new Date(arrivalPoint.arrival.timings.find(t => t.qualifier === 'STA').value);


    if (now < departureTime) {
    const actualDepartureTime = departurePoint.departure.timings.find(t => t.qualifier === 'ETD')?.value;
    if (actualDepartureTime && new Date(actualDepartureTime) > departureTime) {
        return 'Delayed';
    }
    return 'Scheduled';
    } else if (now < arrivalTime) {
    return 'In Air';
    } else {
    if (arrivalTime < scheduledArrivalTime) {
        return 'Arrived Early';
    } else if (arrivalTime > scheduledArrivalTime) {
        return 'Arrived Late';
    } else {
        return 'Arrived On Time';
    }
    }
};


// Calculate time remaining until departure or arrival
const calculateTimeRemaining = () => {
    const now = new Date();
    const departureTime = new Date(departurePoint.departure.timings[0].value);
    const arrivalTime = new Date(arrivalPoint.arrival.timings[0].value);
    const status = getFlightStatus();


    if (status === 'Scheduled' || status === 'Delayed') {
    const timeUntilDeparture = departureTime - now;
    const hoursUntilDeparture = Math.floor(timeUntilDeparture / (1000 * 60 * 60));
    const minutesUntilDeparture = Math.floor((timeUntilDeparture % (1000 * 60 * 60)) / (1000 * 60));
    
    if (status === 'Delayed') {
        const actualDepartureTime = new Date(departurePoint.departure.timings.find(t => t.qualifier === 'ETD').value);
        const delayTime = actualDepartureTime - departureTime;
        const delayHours = Math.floor(delayTime / (1000 * 60 * 60));
        const delayMinutes = Math.floor((delayTime % (1000 * 60 * 60)) / (1000 * 60));
        return `Delayed by ${delayHours}h ${delayMinutes}m. Departing in ${hoursUntilDeparture}h ${minutesUntilDeparture}m`;
    }
    
    return `Departing in ${hoursUntilDeparture}h ${minutesUntilDeparture}m`;
    } else if (status === 'In Air') {
    const timeUntilArrival = arrivalTime - now;
    const hoursUntilArrival = Math.floor(timeUntilArrival / (1000 * 60 * 60));
    const minutesUntilArrival = Math.floor((timeUntilArrival % (1000 * 60 * 60)) / (1000 * 60));
    return `Arriving in ${hoursUntilArrival}h ${minutesUntilArrival}m`;
    } else {
    return status;
    }
};


// Get color for flight status
const getStatusColor = () => {
    const status = getFlightStatus();
    switch (status) {
    case 'Scheduled': return 'green';
    case 'Delayed': return 'red';
    case 'In Air': return 'blue';
    case 'Arrived Early': return 'green';
    case 'Arrived On Time': return 'green';
    case 'Arrived Late': return 'yellow';
    default: return 'grey';
    }
};


// Calculate flight progress percentage
const calculateFlightProgress = () => {
    const now = new Date();
    const departureTime = new Date(departurePoint.departure.timings[0].value);
    const arrivalTime = new Date(arrivalPoint.arrival.timings[0].value);
    const totalFlightTime = arrivalTime - departureTime;
    
    if (now < departureTime) return 0;
    if (now > arrivalTime) return 100;
    
    const elapsedTime = now - departureTime;
    return (elapsedTime / totalFlightTime) * 100;
};


return (
    <div className="trip-details">
    <header>
        <div className='header-info'>
        <h1>{flightStatus.flightDesignator.carrierCode} {flightStatus.flightDesignator.flightNumber}</h1>
        <div className={`flight-status ${getStatusColor()}`}>
            <span className="status-dot"></span>
            <span className="status-text">{calculateTimeRemaining()}</span>
        </div>
        </div>
        <p>{formatDate(departurePoint.departure.timings[0].value)}</p>
    </header>
    <div className="flight-info">
        <div className="departure">
        <h2>{getCityName(departurePoint.iataCode)}</h2>
        <p>{formatTime(departurePoint.departure.timings[0].value)}</p>
        <p>{departurePoint.iataCode}</p>
        {departurePoint.departure.terminal?.code && (
            <p>Terminal: {departurePoint.departure.terminal.code}</p>
        )}
        {departurePoint.departure.gate?.mainGate && (
            <p>Gate: {departurePoint.departure.gate.mainGate}</p>
        )}
        </div>
        <div className="flight-path">
        <div className="flight-timeline">
            <div className="timeline-track"></div>
            <div className="timeline-progress" style={{width: `${calculateFlightProgress()}%`}}></div>
            <div className="plane-icon" style={{left: `${calculateFlightProgress()}%`}}>
            <IoAirplane />
            </div>
        </div>
        <span>{airlineName}</span>
        <p>Duration: {calculateDuration()}</p>
        </div>
        <div className="arrival">
        <h2>{getCityName(arrivalPoint.iataCode)}</h2>
        <p>{formatTime(arrivalPoint.arrival.timings[0].value)}</p>
        <p>{arrivalPoint.iataCode}</p>
        {arrivalPoint.arrival.terminal?.code && (
            <p>Terminal: {arrivalPoint.arrival.terminal.code}</p>
        )}
        {arrivalPoint.arrival.gate?.mainGate && (
            <p>Gate: {arrivalPoint.arrival.gate.mainGate}</p>
        )}
        </div>
    </div>
    <div className="map">
        {!isLocationLoading && userLocation ? (
        <TrafficInfo
            departureAirport={trip.departureAirportCode}
            departureTime={new Date(departurePoint.departure.timings[0].value)}
            userLocation={userLocation}
        />
        ) : (
        <div>Loading map...</div>
        )}
    </div>
    <h2>Manage</h2>
    <div className="manage-section">
        <ul>
        <li>
            <div className="item-info">
            <span className="item-title">Travel Docs</span>
            <span className="item-subtitle">Check List Completed</span>
            </div>
            <div className="icons">
            <span className="check">✓</span>
            <span className="edit">✎</span>
            </div>
        </li>
        <li>
            <div className="item-info">
            <span className="item-title">Boarding Pass</span>
            <span className="item-subtitle">Boarding Pass Added</span>
            </div>
            <div className="icons">
            <span className="check">✓</span>
            <span className="edit">✎</span>
            </div>
        </li>
        <li>
            <div className="item-info">
            <span className="item-title">Airline</span>
            <span className="item-subtitle">{airlineName}</span>
            </div>
            <div className="icons">
            <span className="edit">✎</span>
            </div>
        </li>
        </ul>
    </div>
    </div>
);
};


export default TripDetails;

