/**
 * In-memory storage for active biddings and bids associated with each bidding
 * @type {Map}
 */
export const activeBiddings = new Map();
export const bids = new Map();

/**
 * Set up WebSocket connection and event handlers
 * @param {SocketIO.Server} io - The Socket.IO server instance
 */
export function setupWebSocket(io) {
    io.on('connection', (socket) => {
        // Handle new client connection
        socket.on('join-flight', (flightId) => {
            socket.join(flightId);
        });

        // Handle client leaving a flight
        socket.on('leave-flight', (flightId) => {
            socket.leave(flightId);
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            // Client disconnected
        });
    });
}

/**
 * Emit an event to all clients in a specific flight room
 * @param {SocketIO.Server} io - The Socket.IO server instance
 * @param {string} flightId - The ID of the flight
 * @param {string} eventName - The name of the event to emit
 * @param {Object} data - The data to send with the event
 */
export function emitToFlight(io, flightId, eventName, data) {
    io.to(flightId).emit(eventName, data);
}

/**
 * Handle the expiration of a bidding
 * @param {SocketIO.Server} io - The Socket.IO server instance
 * @param {string} biddingId - The ID of the bidding to expire
 */
export function expireBidding(io, biddingId) {
    const bidding = activeBiddings.get(biddingId);
    if (bidding && bidding.status === 'ACTIVE') {
        bidding.status = 'EXPIRED';
        emitToFlight(io, bidding.flightId, 'bidding-expired', { biddingId });
        
        // Clean up expired bidding and bids
        activeBiddings.delete(biddingId);
        bids.delete(biddingId);
    }
}