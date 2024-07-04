import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FlightForm.css'
import FlightResults from './FlightResults';
import { API_BASE_URL } from '../../../config.js';
import { UserContext } from '../../../UserContext';



const FlightForm= () => {

    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const [flightNumber, setFlightNumber] = useState(() => sessionStorage.getItem('flightNumber') || '');
    const [departureDate, setDepartureDate] = useState(() => sessionStorage.getItem('departureDate') || '');
    const [carrierCode, setCarrierCode] = useState(() => sessionStorage.getItem('carrierCode') || '');
    const [flightStatus, setFlightStatus] = useState(() => {
        const saved = sessionStorage.getItem('flightStatus');
        return saved ? JSON.parse(saved) : null;
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [flightAdded, setFlightAdded] = useState(() => sessionStorage.getItem('flightAdded') === 'true');
    const [isAddingFlight, setIsAddingFlight] = useState(false);



    useEffect(() => {

        sessionStorage.setItem('flightNumber', flightNumber);
        sessionStorage.setItem('departureDate', departureDate);
        sessionStorage.setItem('carrierCode', carrierCode);
        sessionStorage.setItem('flightStatus', JSON.stringify(flightStatus));
        sessionStorage.setItem('flightAdded', flightAdded.toString());

    }, [flightNumber, departureDate, carrierCode, flightStatus, flightAdded]);


    /**
     * Fetches flight status from the Amadeus API via backend middleware.
     * This request is routed through server to securely handle API keys and rate limiting.
     * @param {string} carrierCode - The airline's carrier code (i.e. EK for Emirates, AA for American Airlines)
     * @param {string} flightNumber - The flight number
     * @param {string} departureDate - The scheduled departure date (YYYY-MM-DD)
     * @throws {Error} If the request fails or times out
     */ 


    const handleSubmit = async (e) => {

        e.preventDefault();
        setFlightStatus(null);
        setError(null);
        setIsLoading(true);
        setFlightAdded(false);  
    
        try {
            const response = await axios.get(`${API_BASE_URL}/flight-status`, {
            params: {
                carrierCode: carrierCode,
                flightNumber: flightNumber,
                scheduledDepartureDate: departureDate
            },
            withCredentials: true

            });
            
            if (response.data && response.data.data && response.data.data.length > 0) {
                setFlightStatus(response.data);
            } else {
                setError("No flights found. Please check your input and try again.");
            }
        
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("You are not authenticated. Please log in.");
            } else if (err.name === 'AbortError') {
                setError("Request timed out. Please try again.");
            } else if (err.response) {
                setError(`Error: ${err.response.data.message || 'Failed to fetch flight status'}`);
            } else if (err.request) {
                setError("No response received from server. Please check your internet connection.");
            } else {
                setError("An unexpected error occurred. Please try again later.");
            }
        
        } finally {
            setIsLoading(false);
        }
        };
    
    
    /**
     * Adds static trip information to the user's account in the database.
     * It uses the flight information obtained from the previous search.
     * 
     * @throws {Error} If adding the trip fails
     * 
     * Note: Real-time flight status should be fetched separately when needed,
     * as this stored data does not update automatically.
     */


    const handleAddFlight = async () => {

        if (!user) {
            setError("You must be logged in to add a flight.");
            return;
        }
        
        if (!flightStatus || !flightStatus.data || flightStatus.data.length === 0) {
            setError("No flight data available to add.");
            return;
        }      
            
        const flight = flightStatus.data[0];

        setIsAddingFlight(true);
        setFlightAdded(false);
        setError(null);    

        
        try {
            await axios.post(`${API_BASE_URL}/add-trip`, {
                carrierCode: flight.flightDesignator.carrierCode,
                flightNumber: flight.flightDesignator.flightNumber,
                scheduledDepartureDate: flight.scheduledDepartureDate
            },
            {withCredentials: true});
        
            setFlightAdded(true);

        
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("You are not authenticated. Please log in.");
            } else if (err.response) {
                setError(`Failed to add flight: ${err.response.data.message || 'Unknown error'}`);
            } else if (err.request) {
                setError("No response received from server. Please check your internet connection.");
            } else {
                setError("An unexpected error occurred while adding the flight. Please try again.");
            }      
        } finally { 
            setIsAddingFlight(false);
        }
    }; 

    /**
     * Resets the flight search form and clears session storage & associated data.
     * 
     * It ensures no stale data persists between searches or sessions.
     * 
     * Note: This does not affect any data already saved to the user's account or database.
     */


    const handleClear = () => {
        setFlightNumber('');
        setDepartureDate('');
        setCarrierCode('');
        setFlightStatus(null);
        setFlightAdded(false);
        
        sessionStorage.removeItem('flightNumber');
        sessionStorage.removeItem('departureDate');
        sessionStorage.removeItem('airline');
        sessionStorage.removeItem('flightStatus');
        sessionStorage.removeItem('flightAdded');
        
        };
            

    return (
        <div className="flight-locator">
            <form onSubmit={handleSubmit}>
                <div className="form-container">
                    <div className="form-group">
                    <label htmlFor="carrier-code">Carrier Code: </label>
                    <input
                        type="text"
                        id="carrier-code"
                        value={carrierCode}
                        onChange={(e) => setCarrierCode(e.target.value)}
                        required
                    />
                    </div>
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
                </div>

                {!flightAdded && ( <button type="submit" disabled={isLoading}> {isLoading ? 'Searching...' : 'Search Flight'} </button> )}

            </form>

            {isLoading && <div className="loader"></div>}

            {error && <p className="error">{error}</p>}
            
            {flightStatus && !flightAdded && (
                <FlightResults flightStatus={flightStatus} onAddFlight={handleAddFlight} isAddingFlight={isAddingFlight}/>
            )}

            {isAddingFlight && <div className="loader">Adding flight...</div>} 

            {flightAdded && (
                    <div className="success-message">
                    <p>Flight has been added to your trips!</p>
                    <button onClick={() => navigate('/')}>See Upcoming Trip</button>
                    </div>
            )}

            {(flightAdded || flightStatus) && (
                    <button type="button" onClick={handleClear}> Clear</button>
                )}

        </div>

    );
};


export default FlightForm;
