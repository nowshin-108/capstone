import express from 'express';
import { PrismaClient } from '@prisma/client';
import { 
    emitToFlight, 
    expireBidding, 
    checkSeatOwnership
} from '../websocket.js';
import { authenticateUser } from '../auth.js';
import { io } from '../server.js';

const prisma = new PrismaClient();
const router = express.Router();

/**
 * @route POST /start
 * @desc Start a new bidding for a seat
 * @access Private
 */
router.post('/start', authenticateUser, async (req, res) => {
    const { passengerId, seatNumber, flightId } = req.body;
    const biddingId = `${flightId}-${seatNumber}`;

    try {
        const flight = await prisma.flight.findUnique({ where: { flightId } });
        if (!flight) {
            return res.status(404).json({ error: 'Flight not found' });
        }

        const departureDateTime = new Date(flight.scheduledDepartureTime);

        if (isNaN(departureDateTime.getTime())) {
            return res.status(400).json({ error: 'Invalid departure time' });
        }

        const expirationTime = new Date(departureDateTime.getTime() - 60 * 60 * 1000); // 1 hour before departure

        const existingBidding = await prisma.bidding.findFirst({
            where: {
                passengerId,
                status: 'ACTIVE'
            }
        });

        if (existingBidding) {
            return res.status(400).json({ error: 'You already have an active bidding' });
        }

        const newBidding = await prisma.bidding.create({
            data: {
                biddingId,
                flightId,
                passengerId,
                seatNumber,
                startTime: new Date(),
                expirationTime,
                status: 'ACTIVE'
            }
        });

        emitToFlight(io, flightId, 'new-bid', { 
            biddingId, 
            seatNumber, 
            passengerId,
            startTime: new Date(),
            expirationTime,
            bids: []
        });

        setTimeout(() => expireBidding(io, biddingId), expirationTime.getTime() - Date.now());

        res.json({ success: true, ...newBidding, bids: [] });
    } catch (error) {
        console.error('Error starting bidding:', error);
        res.status(500).json({ error: 'Failed to start bidding' });
    }
});

/**
 * @route POST /bid
 * @desc Place a bid on an active bidding
 * @access Private
 */
router.post('/bid', authenticateUser, async (req, res) => {
    const { biddingId, bidderId, amount, bidderSeatNumber } = req.body;

    try {
        const bidding = await prisma.bidding.findUnique({ 
            where: { biddingId },
            include: { flight: true }
        });

        if (!bidding || bidding.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Bidding not found or not active' });
        }

        const newBid = await prisma.bid.create({
            data: {
                biddingId,
                bidderId,
                amount: parseFloat(amount),
                bidderSeatNumber,
                time: new Date()
            }
        });

        emitToFlight(io, bidding.flightId, 'new-bid', { biddingId, bid: newBid });

        res.json({ success: true, bidId: newBid.bidId });
    } catch (error) {
        console.error('Error placing bid:', error);
        res.status(500).json({ error: 'Failed to place bid' });
    }
});

/**
 * @route POST /accept
 * @desc Accept a bid and complete the seat swap
 * @access Private
 */
router.post('/accept', authenticateUser, async (req, res) => {
    const { biddingId, bidId } = req.body;

    try {
        const bidding = await prisma.bidding.findUnique({
            where: { biddingId },
            include: { flight: true, bids: true }
        });

        if (!bidding || bidding.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Bidding not found or not active' });
        }

        const acceptedBid = bidding.bids.find(bid => bid.bidId === parseInt(bidId));
        if (!acceptedBid) {
            return res.status(400).json({ error: 'Bid not found' });
        }

        // Check seat ownership for both parties
        const initiatorSeatCheck = await checkSeatOwnership(bidding.flightId, bidding.passengerId, bidding.seatNumber);
        if (!initiatorSeatCheck) {
            return res.status(400).json({ error: 'Bidding initiator no longer owns the seat' });
        }

        const bidderSeatCheck = await checkSeatOwnership(bidding.flightId, acceptedBid.bidderId, acceptedBid.bidderSeatNumber);
        if (!bidderSeatCheck) {
            return res.status(400).json({ error: 'Accepted bidder no longer owns their seat' });
        }

        const seatsToRemove = [bidding.seatNumber, acceptedBid.bidderSeatNumber];

        await prisma.$transaction([
            prisma.passenger.update({
                where: { flightId_userId: { flightId: bidding.flightId, userId: bidding.passengerId } },
                data: { seatNumber: 'TEMP' },
            }),
            prisma.passenger.update({
                where: { flightId_userId: { flightId: bidding.flightId, userId: acceptedBid.bidderId } },
                data: { seatNumber: bidding.seatNumber },
            }),
            prisma.passenger.update({
                where: { flightId_userId: { flightId: bidding.flightId, userId: bidding.passengerId } },
                data: { seatNumber: acceptedBid.bidderSeatNumber },
            }),
            prisma.bidding.deleteMany({
                where: { 
                    flightId: bidding.flightId,
                    seatNumber: { in: seatsToRemove },
                    status: 'ACTIVE'
                }
            }),
            prisma.bid.deleteMany({
                where: {
                    bidding: {
                        flightId: bidding.flightId,
                        seatNumber: { in: seatsToRemove }
                    }
                }
            })
        ]);

        emitToFlight(io, bidding.flightId, 'bidding-completed', {
            biddingId,
            winnerId: acceptedBid.bidderId,
            auctioneerNewSeat: acceptedBid.bidderSeatNumber,
            bidderNewSeat: bidding.seatNumber
        });

        emitToFlight(io, bidding.flightId, 'biddings-removed', {
            removedBiddingIds: seatsToRemove.map(seat => `${bidding.flightId}-${seat}`),
            removedSeatNumbers: seatsToRemove
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error accepting bid:', error);
        res.status(500).json({ error: 'Failed to accept bid and swap seats' });
    }
});

/**
 * @route GET /active/:flightId
 * @desc Get all active biddings for a specific flight
 * @access Private
 */
router.get('/active/:flightId', authenticateUser, async (req, res) => {
    const { flightId } = req.params;

    try {
        const activeBiddings = await prisma.bidding.findMany({
            where: {
                flightId,
                status: 'ACTIVE'
            },
            include: {
                bids: true
            }
        });

        const formattedBiddings = activeBiddings.map(bidding => ({
            biddingId: bidding.biddingId,
            seatNumber: bidding.seatNumber,
            passengerId: bidding.passengerId,
            startTime: bidding.startTime,
            expirationTime: bidding.expirationTime,
            bids: bidding.bids
        }));

        res.json(formattedBiddings);
    } catch (error) {
        console.error('Error fetching active biddings:', error);
        res.status(500).json({ error: 'Failed to fetch active biddings' });
    }
});

/**
 * @route POST /cancel
 * @desc Cancel an active bidding
 * @access Private
 */
router.post('/cancel', authenticateUser, async (req, res) => {
    const { biddingId } = req.body;

    try {
        const bidding = await prisma.bidding.findUnique({
            where: { biddingId }
        });

        if (!bidding || bidding.status !== 'ACTIVE') {
            return res.status(400).json({ error: 'Bidding not found or not active' });
        }

        await prisma.$transaction([
            prisma.bid.deleteMany({ where: { biddingId } }),
            prisma.bidding.delete({ where: { biddingId } })
        ]); 

        io.to(bidding.flightId).emit('bidding-cancelled', { biddingId });

        res.json({ success: true });
    } catch (error) {
        console.error('Error cancelling bidding:', error);
        res.status(500).json({ error: 'Failed to cancel bidding' });
    }
});

export default router;