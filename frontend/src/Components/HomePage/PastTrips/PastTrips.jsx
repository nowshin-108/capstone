import './PastTrips.css';
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../../UserContext';
import axios from 'axios';
import PastTripCard from './PastTripCard';
import { API_BASE_URL } from '../../../config.js';


function PastTrips() {
    const [trips, setTrips] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useContext(UserContext);


    useEffect(() => {
        const fetchPastTrips = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/trips/past`, {withCredentials: true});
                setTrips(response.data);
            } catch (error) {
                console.error('Error fetching past trips:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPastTrips();
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
                <h1>Welcome back, {user.username}!</h1>
                <h2>Past Trips</h2>
                {isLoading && <div className="loader"></div>}
                <div className="trip-container">
                    {trips.map((trip) => (
                        <PastTripCard key={trip.tripId} trip={trip} onDelete={handleDeleteTrip} />
                    ))}
                </div>
            </div>
        </div>
    );
}


export default PastTrips;