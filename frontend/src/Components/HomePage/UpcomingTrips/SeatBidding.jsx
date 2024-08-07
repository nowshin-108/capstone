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
    const [isLoading, setIsLoading] = useState();
    const [message, setMessage] = useState('');

    /**
     * Fetch active biddings for the current flight
     */
    const fetchActiveBiddings = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/bidding/active/${flightId}`, { withCredentials: true });
            setActiveBiddings(response.data);
        } catch (error) {
            setMessage("Error Fetching updated bidding info" + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const newSocket = io(API_BASE_URL, { withCredentials: true });

        newSocket.on('connect', () => newSocket.emit('join-flight', flightId));
        newSocket.on('new-bid', (data) => {
            handleNewBid(data);
        });        
        newSocket.on('bidding-completed', handleBiddingCompleted);
        newSocket.on('bidding-expired', handleBiddingExpired);
        newSocket.on('bidding-cancelled', handleBiddingCancelled);
        newSocket.on('biddings-removed', handleBiddingsRemoved);

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
    const handleNewBid = (data) => {
        setActiveBiddings(prev => {
            const { biddingId, seatNumber, passengerId, bids, bid } = data;
            
            const existingBiddingIndex = prev.findIndex(b => b.biddingId === biddingId);
            
            if (existingBiddingIndex !== -1) {
                const updatedBiddings = [...prev];
                updatedBiddings[existingBiddingIndex] = {
                    ...updatedBiddings[existingBiddingIndex],
                    bids: [...(updatedBiddings[existingBiddingIndex].bids || []), bid].filter(Boolean)
                };
                return updatedBiddings;
            } else {
                return [...prev, { 
                    biddingId, 
                    seatNumber, 
                    passengerId, 
                    bids: Array.isArray(bids) ? bids : [bid].filter(Boolean),
                    startTime: data.startTime,
                    expirationTime: data.expirationTime
                }];
            }
        });
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
            setActiveBiddings(prev => [...prev, response.data]);
        } catch (error) {
            setMessage("Error Starting the Bid");
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
            setMessage("Error Cancelling the Bid" + error.message);
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
            setMessage("Error Placing the Bid" + error.message);
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
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage("Error Accepting the Bid: " + error.message);
        }
    };
    
    /**
     * Handles the removal of biddings and bids after a seat swap.
     * 
     * @param {string[]} data.removedBiddingIds - Array of bidding IDs that should be completely removed.
     * @param {string[]} data.removedSeatNumbers - Array of seat numbers involved in the swap.
     */
    const handleBiddingsRemoved = ({ removedBiddingIds, removedSeatNumbers }) => {
        try {
            setActiveBiddings(prev => {
                return prev.map(bidding => {
                    if (removedBiddingIds.includes(bidding.biddingId)) {
                        return null;
                    }
                    const updatedBids = bidding.bids.filter(bid => 
                        !removedSeatNumbers.includes(bid.bidderSeatNumber)
                    );
                    
                    return {...bidding, bids: updatedBids};
                }).filter(Boolean);
            });
        } catch (error) {
            setMessage("Error removing bids for swapping seats. " + error.message);
        }
    };

    if (isLoading) {
        return <div className="loader"></div>;
    }

    return (
        <div className="seat-bidding">
            <h2>Seat Bidding</h2>
            <div className="bidding-container">
                <div className="user-seat">
                    {!activeBiddings.some(bidding => bidding.passengerId === trip.userId) ? (
                        <button className="bid-seat-button" onClick={startBidding}>Bid Your Seat</button>
                    ) : (
                        <>
                            <p>You are bidding your seat: {trip.seatNumber}</p> <br />
                            <button className="cancel-bid-button" onClick={() => cancelBidding(activeBiddings.find(b => b.passengerId === trip.userId).biddingId)}>
                                Cancel Your Seat Bid
                            </button>
                        </>
                    )}
                </div>
                
                <div className="offers-section">
                    <h3>Offers:</h3>
                    <div className="bid-cards">
                        {activeBiddings
                            .filter(bidding => bidding.passengerId === trip.userId)
                            .flatMap(bidding => bidding.bids)
                            .length === 0 ? (
                            <p>No offers so far.</p>
                        ) : (
                            activeBiddings
                            .filter(bidding => bidding.passengerId === trip.userId)
                            .map((bidding, index) => (
                                <div key={`${bidding.biddingId}-${index}`} className="bid-card">
                                    {bidding.bids.map((bid) => (
                                        <div key={bid.bidId} className="bid-info">
                                            <p className="seat-number">Seat {bid.bidderSeatNumber}</p>
                                            <p className="bid-amount">${bid.amount}</p>
                                            <button className="accept-button" onClick={() => acceptBid(bidding.biddingId, bid.bidId)}>Accept</button>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="active-bids-section">
                    <h3>Seats Available for Bidding</h3>
                    <div className="bid-cards">
                        {activeBiddings.filter(bidding => bidding.passengerId !== trip.userId && new Date(bidding.expirationTime) > new Date()).length > 0 ? (
                            activeBiddings
                                .filter(bidding => bidding.passengerId !== trip.userId)
                                .map((bidding, index) => (
                                    <div key={`${bidding.biddingId}-${index}`} className="bid-card">
                                        <p className="seat-number">Seat {bidding.seatNumber}</p>
                                        <form 
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                placeBid(bidding.biddingId, bidding.seatNumber);
                                            }}
                                            className="bid-form"
                                        >
                                            <input
                                                type="number"
                                                value={bidAmounts[bidding.biddingId] || ''}
                                                onChange={(e) => setBidAmounts({...bidAmounts, [bidding.biddingId]: e.target.value})}
                                                placeholder="Enter bid amount"
                                                required
                                                min="0"
                                            />
                                            <button type="submit" className="place-bid-button">Place Bid</button>
                                        </form>
                                    </div>
                                ))
                        ) : (
                            <p>No active bids at the moment.</p>
                        )}
                    </div>
                </div>
            </div>
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