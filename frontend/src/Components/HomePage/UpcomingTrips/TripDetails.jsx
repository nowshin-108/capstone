import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { IoAirplane } from "react-icons/io5";
import { API_BASE_URL } from '../../../config';
import { getCityName } from '../../../assets/data/airportCityMap';
import TrafficInfo from './TrafficInfo';
import './TripDetails.css';
import AltFlightModal from './AltFlightModal';
import { format } from 'date-fns';
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import SeatBidding from './SeatBidding';


const TripDetails = () => {
const [trip, setTrip] = useState(null);
const [flightStatus, setFlightStatus] = useState(null);
const [flightData, setFlightData] = useState(null);
const [airlineName, setAirlineName] = useState('');
const [userLocation, setUserLocation] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [isLocationLoading, setIsLocationLoading] = useState(true);
const [error, setError] = useState(null);
const { tripId } = useParams();
const [isModalOpen, setIsModalOpen] = useState(false);
const [alternativeFlights, setAlternativeFlights] = useState(null);
const [isAlternativeFlightsLoading, setIsAlternativeFlightsLoading] = useState(false);
const [modalError, setModalError] = useState(null);
const [isSeatBidsExpanded, setIsSeatBidsExpanded] = useState(false);


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
        const tripData = tripResponse.data;

        setTrip(tripData);

        // Fetch flight status
        const { carrierCode, flightNumber, scheduledDepartureDate } = tripResponse.data;
        const statusResponse = await axios.get(`${API_BASE_URL}/flight-status`, {
        params: { carrierCode, flightNumber, scheduledDepartureDate },
        withCredentials: true
        });
        
        setFlightData(statusResponse.data.data.data[0]);
        setFlightStatus(statusResponse.data.status.status)


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


const handleBiddingCompleted = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/trips/${tripId}`, { withCredentials: true });
        setTrip(response.data);
    } catch (error) {
        console.error('Failed to fetch updated trip data:', error);
    }
};


if (isLoading) {
    return <div className="loader"></div>;
}


if (error) {
    return <div className="error">{error}</div>;
}


if (!trip || !flightData) {
    return <div className="error">Unable to load trip details. Please try again.</div>;
}


const departurePoint = flightData.flightPoints.find(point => point.departure);
const arrivalPoint = flightData.flightPoints.find(point => point.arrival);


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


// Calculate time remaining until departure or arrival
const calculateTimeRemaining = () => {
    if (!flightStatus || !flightStatus.status) {
        return "Unable to retrieve flight status";
    } 
    const now = new Date();
    const departureTime = new Date(departurePoint.departure.timings[0].value);
    const arrivalTime = new Date(arrivalPoint.arrival.timings[0].value);
    const status = flightStatus.status;

    const formatTimeRemaining = (timeDiff) => {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    
        if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
        } else {
        return `${hours}h ${minutes}m`;
        }
    };
    
    if (status.startsWith('Delayed')) {
        return status;
    } else if (now < departureTime) {
        const timeUntilDeparture = departureTime - now;
        return `Scheduled: Departing in ${formatTimeRemaining(timeUntilDeparture)}`;
    } else if (now < arrivalTime) {
        const timeUntilArrival = arrivalTime - now;
        return `En Route: Arriving in ${formatTimeRemaining(timeUntilArrival)}`;
    } else {
        return status;
    }
    
};


// Get color for flight status
const getStatusColor = () => {
    if (!flightStatus || !flightStatus.status) return 'grey';
    const status = flightStatus.status;
    if (status.startsWith('Delayed')) return 'red';
    if (status === 'Scheduled') return 'green';
    if (status === 'In Air') return 'blue';
    if (status.startsWith('Arrived')) return 'green';
    return 'grey';
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

// fetching alternative flight recommendations
const fetchAlternativeFlights = async () => {
    setIsAlternativeFlightsLoading(true);
    try {
    const departureTime = new Date(departurePoint.departure.timings[0].value);
    const formattedDepartureTime = format(departureTime, 'yyyy-MM-dd HH:mm:ss');   
    const response = await axios.get(`${API_BASE_URL}/alternative-flights`, {
        params: {
        departure_airport: trip.departureAirportCode,
        arrival_airport: trip.arrivalAirportCode,
        departure_time: formattedDepartureTime,
        preferred_airline_code: trip.carrierCode
        },
        withCredentials: true
    });
    setAlternativeFlights(response.data);
    setIsModalOpen(true);
    } catch (error) {
        console.error("Error fetching alternative flights:", error);
        setModalError("No alternative flights found. Please try later.");
    } finally {
        setIsAlternativeFlightsLoading(false);
    }
};

return (
    <div className="trip-details">
    <header>
        <div className='header-info'>
        <h1>{flightData.flightDesignator.carrierCode} {flightData.flightDesignator.flightNumber}</h1>
        <div className={`flight-status ${getStatusColor()}`}>
            <span className="status-dot"></span>
            <span className="status-text">          
                {flightStatus && flightStatus.status 
                ? calculateTimeRemaining()
                : "Unable to retrieve flight status"}
            </span>
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
    <p className="alt-flight">
        Running late or missed flight? See{' '}
        <button onClick={fetchAlternativeFlights} disabled={isAlternativeFlightsLoading}>
            {isAlternativeFlightsLoading ? 'Loading...' : 'Alternative Flights'}
        </button>
    </p>
    {modalError && <p className="error">{modalError}</p>}
    <AltFlightModal
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        flights={alternativeFlights}
    />
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
        <li onClick={() => setIsSeatBidsExpanded(!isSeatBidsExpanded)}>
            <div className="item-info">
                <span className="item-title">Seat Bids</span>
                <span className="item-subtitle">Your Seat: {trip.seatNumber}</span>
            </div>
            <div className="icons">
                {isSeatBidsExpanded ? <IoIosArrowUp /> : <IoIosArrowDown />}
            </div>
        </li>
        {isSeatBidsExpanded && (
            <li className="seat-bids-content">
                <SeatBidding 
                    trip={{
                        userId: trip.userId,
                        seatNumber: trip.seatNumber // Ensure this is available in your trip object
                    }}
                    flightId={`${trip.carrierCode}-${trip.flightNumber}-${trip.scheduledDepartureDate}`}
                    onBiddingCompleted={handleBiddingCompleted}
                />
            </li>
        )}
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