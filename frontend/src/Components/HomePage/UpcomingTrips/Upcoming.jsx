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
            const response = await axios.get(`${API_BASE_URL}/trips`);
            setTrips(response.data);
        } catch (error) {
            console.error('Error fetching trips:', error);
        }
        };
        fetchTrips();
    }, []);
    return (
        <div className="main-content">
            <div className="home-page">
            <h2>Upcoming Trips</h2>
            <h4>Welcome {user.username}!</h4>
                <div className="trip-container">
                    {trips.map((trip) => (
                    <TripCard key={trip.tripId} trip={trip} />
                    ))}
                </div>
            </div>

            <header>
                <h1>&nbsp;My Trip</h1>
                <p>EK 2330 &nbsp;|&nbsp; Fri, 1 June, 2024</p>
            </header>
            <div className="trip-timeline">
                <div className="timeline-item">
                    <h3>Leave for Airport</h3>
                    <p>Recommendation</p>
                </div>
                <div className="timeline-item">
                    <h3>Check-in</h3>
                    <p>ends in x hrs</p>
                </div>
                <div className="timeline-item">
                    <h3>Boarding</h3>
                    <p>ends in x hrs</p>
                </div>
            </div>

            <h2>&nbsp;Manage</h2>

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
                            <span className="item-subtitle">Emirates</span>
                        </div>
                        <div className="icons">
                            <span className="edit">✎</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Upcoming;
