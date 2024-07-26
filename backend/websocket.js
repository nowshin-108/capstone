import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if a user still owns a specific seat
 * @param {string} flightId - The ID of the flight
 * @param {string} userId - The ID of the user
 * @param {string} seatNumber - The seat number to check
 * @param {string} expectedSeatNumber - The seat number we expect the user to own.
 * @returns {Object} An object containing:
 *   - ownsExpectedSeat (boolean): True if the user's current seat matches the expected seat, false otherwise.
 */
export async function checkSeatOwnership(flightId, userId, expectedSeatNumber) {
    const passenger = await prisma.passenger.findUnique({
        where: {
            flightId_userId: { flightId, userId },
        },
    });
    return passenger?.seatNumber === expectedSeatNumber;
}

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
export async function expireBidding(io, biddingId) {
    try {
        const bidding = await prisma.bidding.findUnique({
            where: { biddingId },
            include: { flight: true }
        });
        
        if (bidding && bidding.status === 'ACTIVE' && new Date() >= bidding.expirationTime) {
            await prisma.$transaction([
                prisma.bidding.update({
                    where: { biddingId },
                    data: { status: 'EXPIRED' }
                }),
                prisma.bid.deleteMany({
                    where: { biddingId }
                })
            ]);
            emitToFlight(io, bidding.flightId, 'bidding-expired', { biddingId });
        }
    } catch (error) {
        console.error('Error expiring bidding:', error);
    }
} 