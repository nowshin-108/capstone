import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FlightForm.css'
import FlightResults from './FlightResults';
import { API_BASE_URL } from '../../../config.js';
import { UserContext } from '../../../UserContext';



const FlightForm= () => {

    const navigate = useNavigate();
    const { user, flightData, updateFlightData } = useContext(UserContext);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingFlight, setIsAddingFlight] = useState(false);

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
        setError(null);
        setIsLoading(true);
        updateFlightData({ flightStatus: null, flightAdded: false });  
    
        try {
            const response = await axios.get(`${API_BASE_URL}/flight-status`, {
            params: {
                carrierCode: flightData.carrierCode,
                flightNumber: flightData.flightNumber,
                scheduledDepartureDate: flightData.departureDate
            },
            withCredentials: true

            });
            
            if (response.data && response.data.data && response.data.data.length > 0) {
                updateFlightData({ flightStatus: response.data });
            } else {
                setError("No flights found. Please check your input and try again.");
            }
        
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("You are not authenticated. Please log in.");
                navigate('/login');
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
        
            if (!flightData === 0) {
            setError("No flight data available to add.");
            return;
            }
        
            const flight = flightData.flightStatus.data[0];
            const { flightPoints, segments } = flight;
        
            setIsAddingFlight(true);
            setError(null);
        
            try {
            await axios.post(`${API_BASE_URL}/add-trip`, {
                carrierCode: flight.flightDesignator.carrierCode,
                flightNumber: flight.flightDesignator.flightNumber,
                departureAirportCode: flightPoints[0].iataCode,
                arrivalAirportCode: flightPoints[1].iataCode,
                scheduledDepartureDate: flight.scheduledDepartureDate,
                scheduledDepartureTime: flightPoints[0].departure.timings[0].value,
                scheduledArrivalTime: flightPoints[1].arrival.timings[0].value,
                segments: segments.map((segment) => ({
                boardPointCode: segment.boardPointIataCode,
                offPointCode: segment.offPointIataCode,
                scheduledSegmentDuration: segment.scheduledSegmentDuration
                }))
            }, {
                withCredentials: true
            });
        
            updateFlightData({ flightAdded: true });
            } catch (err) {
            if (err.response && err.response.status === 401) {
                setError("You are not authenticated. Please log in.");
                navigate('/login');
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
        

    // const handleAddFlight = async () => {

    //     if (!user) {
    //         setError("You must be logged in to add a flight.");
    //         return;
    //     }
        
    //     if (!flightData === 0) {
    //         setError("No flight data available to add.");
    //         return;
    //     }      
            
    //     const flight = flightData.flightStatus.data[0];

    //     setIsAddingFlight(true);
    //     setError(null);    

        
    //     try {
    //         await axios.post(`${API_BASE_URL}/add-trip`, {
    //             carrierCode: flight.flightDesignator.carrierCode,
    //             flightNumber: flight.flightDesignator.flightNumber,
    //             scheduledDepartureDate: flight.scheduledDepartureDate
    //         },
    //         {withCredentials: true});

    //         updateFlightData({ flightAdded: true });
        
    //     } catch (err) {
    //         if (err.response && err.response.status === 401) {
    //             setError("You are not authenticated. Please log in.");
    //             navigate('/login');
    //         } else if (err.response) {
    //             setError(`Failed to add flight: ${err.response.data.message || 'Unknown error'}`);
    //         } else if (err.request) {
    //             setError("No response received from server. Please check your internet connection.");
    //         } else {
    //             setError("An unexpected error occurred while adding the flight. Please try again.");
    //         }      
    //     } finally { 
    //         setIsAddingFlight(false);
    //     }
    // }; 

    /**
     * Resets the flight search form and clears session storage & associated data.
     * 
     * It ensures no stale data persists between searches or sessions.
     * 
     * Note: This does not affect any data already saved to the user's account or database.
     */


    const handleClear = () => {
        updateFlightData({
            flightNumber: '',
            departureDate: '',
            carrierCode: '',
            flightStatus: null,
            flightAdded: false
        });
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
                        value={flightData.carrierCode}
                        onChange={(e) => updateFlightData({ carrierCode: e.target.value })}
                        required
                    />
                    </div>
                    <div className="form-group">
                    <label htmlFor="flightNumber">Flight Number: </label>
                    <input
                        type="text"
                        id="flightNumber"
                        value={flightData.flightNumber}
                        onChange={(e) => updateFlightData({ flightNumber: e.target.value })}
                        required
                    />
                    </div>
                    <div className="form-group">
                    <label htmlFor="departureDate">Departure Date: </label>
                    <input
                        type="date"
                        id="departureDate"
                        value={flightData.departureDate}
                        onChange={(e) => updateFlightData({ departureDate: e.target.value })}
                        required
                    />
                    </div>
                </div>

                {!flightData.flightAdded && ( <button type="submit" disabled={isLoading}> {isLoading ? 'Searching...' : 'Search Flight'} </button> )}

            </form>

            {isLoading && <div className="loader"></div>}

            {error && <p className="error">{error}</p>}
            
            {flightData.flightStatus && !flightData.flightAdded && (
                <FlightResults flightStatus={flightData.flightStatus} onAddFlight={handleAddFlight} isAddingFlight={isAddingFlight}/>
            )}

            {isAddingFlight && <div className="loader">Adding flight...</div>} 

            {flightData.flightAdded && (
                    <div className="success-message">
                    <p>Flight has been added to your trips!</p>
                    <button onClick={() => navigate('/')}>See Upcoming Trip</button>
                    </div>
            )}

            {(flightData.flightAdded || flightData.flightStatus) && (
                    <div><br /><button type="button" onClick={handleClear}> Clear</button></div>
                )}

        </div>

    );
};


export default FlightForm;
