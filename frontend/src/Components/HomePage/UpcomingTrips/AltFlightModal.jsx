import React, { useState, useMemo } from 'react';
import './AltFlightModal.css';
import PropTypes from 'prop-types';

function AltFlightModal({ isOpen, onClose, flights }) {
    const [activeTab, setActiveTab] = useState('Best');

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    };

    const sortedFlights = useMemo(() => {
        if (!flights) return [];
        
        switch (activeTab) {
            case 'Best':
                return [...flights].sort((a, b) => a.rank - b.rank);
            case 'Cheapest':
                return [...flights].sort((a, b) => a.summary.discounted_price - b.summary.discounted_price);
            case 'Fastest':
                return [...flights].sort((a, b) => a.summary.total_duration - b.summary.total_duration);
            default:
                return flights;
        }
    }, [flights, activeTab]);

    const renderFlightOption = (flight, index) => {
        return (
            <div key={flight.option_id} className="flight-option">
                <div className="rank-container">
                    {activeTab === 'Best' && <div className="rank">{index + 1}</div>}
                </div>
                <div className="flight-details">
                    {flight.flights.map((leg, legIndex) => (
                        <React.Fragment key={leg.flight_id}>
                            <div className="leg-info">
                                <div className="airport-time">
                                    <span className="airport">{leg.departure_airport}</span>
                                    <span className="time">{formatTime(leg.departure_time)}</span>
                                </div>
                                <div className="duration-line">
                                    <span className="duration">{leg.duration.toFixed(0)} hrs, {leg.airline_name}</span>
                                    <div className="line"></div>
                                </div>
                                <div className="airport-time">
                                    <span className="airport">{leg.arrival_airport}</span>
                                    <span className="time">{formatTime(leg.arrival_time)}</span>
                                </div>
                            </div>
                            {legIndex < flight.flights.length - 1 && (
                                <div className="connection-info">
                                    connection: {((new Date(flight.flights[legIndex + 1].departure_time) - new Date(leg.arrival_time)) / (1000 * 60 * 60)).toFixed(0)} hr
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                <div className="summary-info">
                    <span className="stops">{flight.flights.length - 1} stop{flight.flights.length > 2 ? 's' : ''}, </span>
                    <span className="total-duration">{flight.summary.total_duration.toFixed(0)} hrs</span>
                </div>
                <div className="price">${flight.summary.discounted_price.toFixed(0)}</div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={onClose}>×</button>
                <div className="tabs">
                    {['Best', 'Cheapest', 'Fastest'].map(tab => (
                        <button 
                            key={tab} 
                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flight-list">
                    {sortedFlights.length > 0 ? (
                        sortedFlights.map((flight, index) => renderFlightOption(flight, index))
                    ) : (
                        <p>No alternative flights found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

AltFlightModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    flights: PropTypes.arrayOf(PropTypes.shape({
        option_id: PropTypes.string.isRequired,
        rank: PropTypes.number.isRequired,
        flights: PropTypes.arrayOf(PropTypes.shape({
            flight_id: PropTypes.string.isRequired,
            departure_airport: PropTypes.string.isRequired,
            arrival_airport: PropTypes.string.isRequired,
            departure_time: PropTypes.string.isRequired,
            arrival_time: PropTypes.string.isRequired,
            airline_code: PropTypes.string.isRequired,
            airline_name: PropTypes.string.isRequired,
            duration: PropTypes.number.isRequired,
        })).isRequired,
        summary: PropTypes.shape({
            discounted_price: PropTypes.number.isRequired,
            total_duration: PropTypes.number.isRequired,
        }).isRequired
    })),
};

export default AltFlightModal;