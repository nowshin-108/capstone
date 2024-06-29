import { useState } from 'react';
import './FlightLocator.css'


const FlightLocator = () => {
    const [flightNumber, setFlightNumber] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [airline, setAirline] = useState('');


    const handleSubmit = (e) => {
    e.preventDefault();
    //API
    console.log('Searching for flight:', { flightNumber, departureDate, airline });
    };


    return (
        <div className="flight-locator">
            <form onSubmit={handleSubmit}>
                <div className="form-container">
                    <div className="form-group">
                    <label htmlFor="flightNumber">Flight Number: </label>
                    <input
                        type="text"
                        id="flightNumber"
                        value={flightNumber}
                        onChange={(e) => setFlightNumber(e.target.value)}
                        required
                    />
                    </div>
                    <div className="form-group">
                    <label htmlFor="departureDate">Departure Date: </label>
                    <input
                        type="date"
                        id="departureDate"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        required
                    />
                    </div>
                    <div className="form-group">
                    <label htmlFor="airline">Airline: </label>
                    <input
                        type="text"
                        id="airline"
                        value={airline}
                        onChange={(e) => setAirline(e.target.value)}
                        required
                    />
                    </div>
                </div>
                <button type="submit">Search Flight</button>
            </form>
        </div>

    );
};


export default FlightLocator;
