import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';


function TrafficInfo({ departureAirport, departureTime, userLocation }) {
const [airportLocation, setAirportLocation] = useState(null);
const [trafficData, setTrafficData] = useState(null);
const [recommendedLeaveTime, setRecommendedLeaveTime] = useState(null);
const [error, setError] = useState(null);


// Fetch airport location data
const fetchAirportLocation = useCallback(async (code) => {
    try {
    const response = await axios.get(`${API_BASE_URL}/airport-location/${code}`);
    if (response.data && response.data.location) {
        setAirportLocation(response.data.location);
    } else {
        throw new Error('Invalid airport location data');
    }
    } catch (error) {
    setError(error.response?.data?.error || 'Error fetching airport location');
    }
}, []);


useEffect(() => {
    if (departureAirport) {
    fetchAirportLocation(departureAirport);
    }
}, [departureAirport, fetchAirportLocation]);


// Calculate route and traffic information
const calculateRoute = useCallback(async () => {
    if (!userLocation || !airportLocation) {
    setError('Missing location data for route calculation');
    return;
    }


    try {
    setError(null);
    const response = await axios.post(`${API_BASE_URL}/calculate-route`, {
        origin: userLocation,
        destination: airportLocation,
        departureTime: departureTime.toISOString(),
        mode: 'driving'
    });


    if (response.data.error) {
        throw new Error(response.data.error);
    }


    if (response.data.trafficData) {
        setTrafficData({
        distance: response.data.trafficData.distance,
        duration: response.data.trafficData.duration,
        });
        
        const durationInMs = parseInt(response.data.trafficData.durationValue) * 1000;
        const bufferTime = 2 * 60 * 60 * 1000; // 2 hours buffer
        const recommendedLeaveTime = new Date(departureTime.getTime() - durationInMs - bufferTime);
        setRecommendedLeaveTime(recommendedLeaveTime);
    } else {
        throw new Error('No route found. The origin and destination may be too far apart for driving directions.');
    }
    } catch (error) {
    setError(error.message || 'Error calculating route. Please try again later.');
    }
}, [userLocation, airportLocation, departureTime]);


useEffect(() => {
    if (userLocation && airportLocation) {
    calculateRoute();
    }
}, [userLocation, airportLocation, calculateRoute]);


return (
    <div className="traffic-info-container">
    <div className="trip-timeline">
        <div className="timeline-item">
        <h3>Leave for Airport</h3>
        {error ? (
            <p className="error-message">{error}</p>
        ) : trafficData ? (
            <div className="traffic-info">
            <p><strong>Distance to airport:</strong> {trafficData.distance}</p>
            <p><strong>Estimated travel time:</strong> {trafficData.duration}</p>
            {recommendedLeaveTime && (
                <p><strong>Recommended leave time:</strong> {recommendedLeaveTime.toLocaleTimeString()}</p>
            )}
            </div>
        ) : (
            <p className="loading-message">Calculating route information...</p>
        )}
        </div>
        <div className="timeline-item">
        <h3>Check-in</h3>
        <p>Opens 24 hours before departure</p>
        </div>
        <div className="timeline-item">
        <h3>Boarding</h3>
        <p>Typically 30-45 minutes before departure</p>
        </div>
    </div>
    </div>
);
}


TrafficInfo.propTypes = {
departureAirport: PropTypes.string.isRequired,
departureTime: PropTypes.instanceOf(Date).isRequired,
userLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
}).isRequired,
};


export default TrafficInfo;


