import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config';
import './SeatBidding.css';

/**
 * SeatBidding component for managing seat bidding functionality
 * @param {Object} props - Component props
 * @param {Object} props.trip - Trip information
 * @param {string} props.flightId - ID of the flight
 * @param {Function} props.onBiddingCompleted - Callback function when bidding is completed
 */
const SeatBidding = ({ trip, flightId, onBiddingCompleted }) => {
    const [activeBiddings, setActiveBiddings] = useState([]);
    const [bidAmounts, setBidAmounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');

    /**
     * Fetch active biddings for the current flight
     */
    const fetchActiveBiddings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/bidding/active/${flightId}`, { withCredentials: true });
            setActiveBiddings(response.data);
        } catch (error) {
            // Error handling for failed fetch
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const newSocket = io(API_BASE_URL, { withCredentials: true });

        newSocket.on('connect', () => newSocket.emit('join-flight', flightId));
        newSocket.on('new-bid', (data) => {
            fetchActiveBiddings();
            handleNewBid(data);
        });
        newSocket.on('bidding-completed', handleBiddingCompleted);
        newSocket.on('bidding-expired', handleBiddingExpired);
        newSocket.on('bidding-cancelled', handleBiddingCancelled);

        fetchActiveBiddings();

        // Cleanup function
        return () => {
            newSocket.emit('leave-flight', flightId);
            newSocket.disconnect();
        };
    }, [flightId]);

    /**
     * Handle new bid event
     * @param {Object} data - New bid data
     */
    const handleNewBid = ({ biddingId, bid }) => {
        setActiveBiddings(prev => prev.map(bidding =>
            bidding.biddingId === biddingId
                ? { ...bidding, bids: [...(bidding.bids || []), bid] }
                : bidding
        ));
    };

    /**
     * Handle bidding completed event
     * @param {Object} data - Completed bidding data
     */
    const handleBiddingCompleted = ({ biddingId }) => {
        setActiveBiddings(prev => prev.filter(bidding => bidding.biddingId !== biddingId));
        onBiddingCompleted();
    };

    /**
     * Handle bidding expired event
     * @param {Object} data - Expired bidding data
     */
    const handleBiddingExpired = ({ biddingId }) => {
        setActiveBiddings(prev => prev.filter(bidding => bidding.biddingId !== biddingId));
    };

    /**
     * Handle bidding cancelled event
     * @param {Object} data - Cancelled bidding data
     */
    const handleBiddingCancelled = ({ biddingId }) => {
        setActiveBiddings(prev => prev.filter(bidding => bidding.biddingId !== biddingId));
    };

    /**
     * Start a new bidding
     */
    const startBidding = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/bidding/start`, {
                passengerId: trip.userId,
                seatNumber: trip.seatNumber,
                flightId
            }, { withCredentials: true });
            setActiveBiddings(prev => [...prev, { ...response.data, bids: [] }]);
        } catch (error) {
            // Error handling for failed bidding start
        }
    };

    /**
     * Cancel an active bidding
     * @param {string} biddingId - ID of the bidding to cancel
     */
    const cancelBidding = async (biddingId) => {
        try {
            await axios.post(`${API_BASE_URL}/bidding/cancel`, { biddingId }, { withCredentials: true });
            setActiveBiddings(prev => prev.filter(bidding => bidding.biddingId !== biddingId));
            setMessage("Cancelled bid");
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            // Error handling for failed bidding cancellation
        }
    };

    /**
     * Place a bid on an active bidding
     * @param {string} biddingId - ID of the bidding
     * @param {string} seatNumber - Seat number being bid on
     */
    const placeBid = async (biddingId, seatNumber) => {
        try {
            await axios.post(`${API_BASE_URL}/bidding/bid`, {
                biddingId,
                bidderId: trip.userId,
                amount: parseFloat(bidAmounts[biddingId]),
                bidderSeatNumber: trip.seatNumber
            }, { withCredentials: true });
            setMessage(`You placed a bid of $${bidAmounts[biddingId]} for seat ${seatNumber}`);
            setBidAmounts({...bidAmounts, [biddingId]: ''});
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            // Error handling for failed bid placement
        }
    };

    /**
     * Accept a bid
     * @param {string} biddingId - ID of the bidding
     * @param {string} bidId - ID of the bid to accept
     */
    const acceptBid = async (biddingId, bidId) => {
        try {
            await axios.post(`${API_BASE_URL}/bidding/accept`, { biddingId, bidId }, { withCredentials: true });
            setMessage('Bid accepted successfully! Seat will be swapped');
            setActiveBiddings(prev => prev.filter(bidding => bidding.biddingId !== biddingId));
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            // Error handling for failed bid acceptance
        }
    };

    if (isLoading) {
        return <div className="loader"></div>;
    }

    return (
        <div className="seat-bidding">
            <h2>Seat Bidding</h2>            
            {!activeBiddings.some(bidding => bidding.passengerId === trip.userId) ? (
                <button onClick={startBidding}>Bid Your Seat</button>
            ) : (
                <div>
                    <p>You are bidding your seat: {trip.seatNumber}</p>
                    <button onClick={() => cancelBidding(activeBiddings.find(b => b.passengerId === trip.userId).biddingId)}>
                        Cancel Your Seat Bid
                    </button>
                    <h3>Offers:</h3>
                    {activeBiddings
                        .filter(bidding => bidding.passengerId === trip.userId)
                        .map((bidding) => (
                            <div key={bidding.biddingId}>
                                {bidding.bids.length > 0 ? (
                                    bidding.bids.map((bid) => (
                                        <div key={bid.id}>
                                            <p>Seat {bid.bidderSeatNumber}: ${bid.amount}</p>
                                            <button onClick={() => acceptBid(bidding.biddingId, bid.id)}>Accept</button>
                                        </div>
                                    ))
                                ) : (
                                    <p>No offers so far.</p>
                                )}
                            </div>
                        ))}
                </div>
            )}
            
            <h3>Active Bids in This Flight</h3>
            {activeBiddings.filter(bidding => bidding.passengerId !== trip.userId).length > 0 ? (
                activeBiddings
                    .filter(bidding => bidding.passengerId !== trip.userId)
                    .map((bidding) => (
                        <div key={bidding.biddingId}>
                            <p>Seat {bidding.seatNumber} is available for bidding</p>
                            <input
                                type="number"
                                value={bidAmounts[bidding.biddingId] || ''}
                                onChange={(e) => setBidAmounts({...bidAmounts, [bidding.biddingId]: e.target.value})}
                                placeholder="Enter bid amount"
                            />
                            <button onClick={() => placeBid(bidding.biddingId, bidding.seatNumber)}>
                                Place Bid
                            </button>
                        </div>
                    ))
            ) : (
                <p>No active bids at the moment.</p>
            )}
            {message && <p className="message">{message}</p>}
        </div>
    );
};

SeatBidding.propTypes = {
    trip: PropTypes.shape({
        userId: PropTypes.number.isRequired,
        seatNumber: PropTypes.string.isRequired,
    }).isRequired,
    flightId: PropTypes.string.isRequired,
    onBiddingCompleted: PropTypes.func.isRequired,
};

export default SeatBidding;