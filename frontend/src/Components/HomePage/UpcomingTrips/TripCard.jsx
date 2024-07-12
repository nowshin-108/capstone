import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './TripCard.css';
import { getCityName } from '../../../assets/data/airportCityMap';


const TripCard = ({ trip, onDelete }) => {
const navigate = useNavigate();


// Format date to 'Month Day, Year' format
const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};


// Format time to 'HH:MM (UTC ±HH:MM)' format
const formatTime = (isoString) => {
    const date = new Date(isoString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const offset = isoString.slice(-6);
    return `${hours}:${minutes} (UTC ${offset})`;
};


// Calculate flight duration
const calculateDuration = () => {
    if (!trip.scheduledDepartureTime || !trip.scheduledArrivalTime) {
    return '(Duration unknown)';
    }


    const departureTime = new Date(trip.scheduledDepartureTime);
    const arrivalTime = new Date(trip.scheduledArrivalTime);


    if (isNaN(departureTime.getTime()) || isNaN(arrivalTime.getTime())) {
    return '(Duration unknown)';
    }


    const durationMs = arrivalTime - departureTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));


    return `(${hours}h ${minutes}m)`;
};


// Get information about stops
const getStopsInfo = () => {
    const numStops = trip.segments.length;
    return numStops === 1 ? 'Nonstop' : `${numStops} stops`;
};


// Handle click on the trip card
const handleClick = () => {
    navigate(`/trips/${trip.tripId}`, {
    state: {
        departureUtcOffset: trip.departureUtcOffset,
        arrivalUtcOffset: trip.arrivalUtcOffset,
        departureAirport: trip.departureAirportCode,
        arrivalAirport: trip.arrivalAirportCode
    }
    });
};


return (
    <div className="trip-card" onClick={handleClick}>
    <div className="airline-info">
        <div className="flight-number">{trip.carrierCode} {trip.flightNumber}</div>
        <div className="flight-status">{trip.status}</div>
    </div>
    <button 
        className="delete-btn" 
        onClick={(e) => {
        e.stopPropagation();
        onDelete(trip.tripId);
        }}
    >
        ×
    </button>
    <div className="trip-header">
        <div className="route-info">
        <span className="airport-code">{trip.departureAirportCode}</span>
        <span className="stops-info">
            <hr />
            {getStopsInfo()}
            <hr />
        </span>
        <span className="airport-code">{trip.arrivalAirportCode}</span>
        </div>
        <div className="duration">{calculateDuration()}</div>
    </div>
    <div className="trip-details">
        <div className="flight-info">
        <div className="departure-info">
            <div className="time">{formatTime(trip.scheduledDepartureTime)}</div>
            <div className="date">{formatDate(new Date(trip.scheduledDepartureTime))}</div>
            <div className="city">{getCityName(trip.departureAirportCode)}</div>
        </div>
        <div className="arrival-info">
            <div className="time">{formatTime(trip.scheduledArrivalTime)}</div>
            <div className="date">{formatDate(new Date(trip.scheduledArrivalTime))}</div>
            <div className="city">{getCityName(trip.arrivalAirportCode)}</div>
        </div>
        </div>
    </div>
    </div>
);
};


TripCard.propTypes = {
trip: PropTypes.shape({
    tripId: PropTypes.number.isRequired,
    carrierCode: PropTypes.string.isRequired,
    flightNumber: PropTypes.number.isRequired,
    departureAirportCode: PropTypes.string.isRequired,
    arrivalAirportCode: PropTypes.string.isRequired,
    scheduledDepartureTime: PropTypes.string.isRequired,
    scheduledArrivalTime: PropTypes.string.isRequired,
    departureUtcOffset: PropTypes.string,
    arrivalUtcOffset: PropTypes.string,
    segments: PropTypes.arrayOf(PropTypes.shape({
    boardPointCode: PropTypes.string,
    offPointCode: PropTypes.string,
    scheduledSegmentDuration: PropTypes.string,
    })),
    status: PropTypes.string.isRequired,
}).isRequired,
onDelete: PropTypes.func.isRequired,
};


export default TripCard;


