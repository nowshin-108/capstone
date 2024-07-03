import './FlightResults.css';
import PropTypes from 'prop-types';

const FlightResults = ({ flightStatus, onAddFlight, isAddingFlight }) => {
    if (!flightStatus || !flightStatus.data || flightStatus.data.length === 0) return null;

    const flight = flightStatus.data[0];
    const departure = flight.flightPoints[0];
    const arrival = flight.flightPoints[1];

    const departureTime = new Date(departure.departure.timings[0].value);
    const arrivalTime = new Date(arrival.arrival.timings[0].value);

    // Determine if the flight is currently in progress
    const isCurrentlyFlying = new Date() > departureTime && new Date() < arrivalTime;

    return (
    <div className="flight-details">

        <h2>Flight Details</h2>
        <div className="flight-info">
            <p><strong>Flight:</strong> {flight.flightDesignator.carrierCode} {flight.flightDesignator.flightNumber}</p>
            <p><strong>Date:</strong> {flight.scheduledDepartureDate}</p>
            <p><strong>Status:</strong> {isCurrentlyFlying ? 'In Air' : 'Scheduled'}</p>
        </div>
        <div className="route-info">
            <div className="departure">
                <h3>Departure</h3>
                <p><strong>Airport:</strong> {departure.iataCode}</p>
                <p><strong>Time:</strong> {departureTime.toLocaleString()}</p>
            </div>
            <div className="arrival">
                <h3>Arrival</h3>
                <p><strong>Airport:</strong> {arrival.iataCode}</p>
                <p><strong>Time:</strong> {arrivalTime.toLocaleString()}</p>
            </div>
        </div>
        <div className="additional-info">
            <p><strong>Duration:</strong> {flight.segments[0].scheduledSegmentDuration.replace('PT', '').toLowerCase()}</p>
            <p><strong>Aircraft:</strong> {flight.legs[0].aircraftEquipment.aircraftType}</p>
        </div>
        <button className="add-flight-btn" onClick={onAddFlight} disabled={isAddingFlight} > {isAddingFlight ? 'Adding Flight...' : 'Add Flight'} </button>

    </div>
    );
};

FlightResults.propTypes = { 
    flightStatus: PropTypes.object.isRequired, 
    onAddFlight: PropTypes.func.isRequired,
    isAddingFlight: PropTypes.bool.isRequired 
};


export default FlightResults;
