import './Upcoming.css';
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../UserContext';
import axios from 'axios';
import TripCard from './TripCard';
import { API_BASE_URL } from '../../../config.js';

function Upcoming() {
    const [trips, setTrips] = useState([]);
    const { user } = useContext(UserContext);

    useEffect(() => {
        const fetchTrips = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/trips`, {withCredentials: true});
            setTrips(response.data);
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
        };
        fetchTrips();
    }, []);

    const handleDeleteTrip = async (tripId) => {
        try {
        await axios.delete(`${API_BASE_URL}/trips/${tripId}`, {withCredentials: true});
        setTrips(trips.filter(trip => trip.tripId !== tripId));
        } catch (error) {
        console.error('Error deleting trip:', error);
        }
    };

    return (
        <div className="main-content">
            <div className="home-page">
            <h1>Welcome {user.username}!</h1>
            <h2>Upcoming Trips</h2>
                <div className="trip-container">
                    {trips.map((trip) => (
                        <TripCard key={trip.tripId} trip={trip} onDelete={handleDeleteTrip} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Upcoming;
