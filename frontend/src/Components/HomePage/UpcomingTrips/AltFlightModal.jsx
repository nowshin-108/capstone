import './AltFlightModal.css';
import PropTypes from 'prop-types';

function AltFlightModal({ isOpen, onClose, flights }) {
    if (!isOpen) return null;

    return (
    <div className="modal-overlay">
        <div className="modal-content">
        <h2>Alternative Flights</h2>
        <button className="close-button" onClick={onClose}>×</button>
        {flights && flights.length > 0 ? (
            <ul>
            {flights.map((flight, index) => (
                <li key={index}>
                <h3>Option {flight.rank}</h3>
                <p>Path: {flight.summary.path}</p>
                <p>Price: ${flight.summary.discounted_price.toFixed(2)}</p>
                <p>Duration: {flight.summary.total_duration.toFixed(2)} hours</p>
                </li>
            ))}
            </ul>
        ) : (
            <p>No alternative flights found.</p>
        )}
        </div>
    </div>
    );
}

AltFlightModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    flights: PropTypes.arrayOf(PropTypes.shape({
        rank: PropTypes.number.isRequired,
        summary: PropTypes.shape({
            path: PropTypes.string.isRequired,
            discounted_price: PropTypes.number.isRequired,
            total_duration: PropTypes.number.isRequired,
            score: PropTypes.number.isRequired
        }).isRequired
        }))
    };

export default AltFlightModal