import './TripCard.css';
import PropTypes from 'prop-types';

const TripCard = ({ trip }) => {
    return (
    <div className="trip-card">
        <div className="route-info">
        <div className="departure">
            <h3>{trip.departureAirportCode}</h3>
            <p>{trip.scheduledDepartureTime}</p>
        </div>
        {trip.segments.map((segment, index) => (
            <div className="stop" key={index}>
            <div className="stop-info">
                <h4>{segment.boardPointCode}</h4>
                <p>{segment.scheduledSegmentDepartureTime}</p>
            </div>
            {index !== trip.segments.length - 1 && <div className="arrow">&#8594;</div>}
            </div>
        ))}
        <div className="arrival">
            <h3>{trip.arrivalAirportCode}</h3>
            <p>{trip.scheduledArrivalTime}</p>
        </div>
        </div>
        <div className="additional-info">
        <p>
            <strong>Flight:</strong> {trip.carrierCode} {trip.flightNumber}
        </p>
        <p>
            <strong>Date:</strong> {trip.scheduledDepartureDate}
        </p>
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
        scheduledDepartureDate: PropTypes.string.isRequired,
        scheduledDepartureTime: PropTypes.string.isRequired,
        scheduledArrivalTime: PropTypes.string.isRequired,
        segments: PropTypes.arrayOf(
        PropTypes.shape({
            boardPointCode: PropTypes.string.isRequired,
            scheduledSegmentDepartureTime: PropTypes.string.isRequired
        })
        ).isRequired
    }).isRequired
    };


export default TripCard;
    