import express from 'express';
import { PrismaClient } from '@prisma/client';
import { activeBiddings, bids, emitToFlight, expireBidding } from '../websocket.js';
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
    const expirationTime = Date.now() + 30 * 60 * 1000; // 30 minutes

    const existingBidding = Array.from(activeBiddings.values()).find(
        bidding => bidding.passengerId === passengerId && bidding.status === 'ACTIVE'
    );

    if (existingBidding) {
        return res.status(400).json({ error: 'You already have an active bidding' });
    }

    const newBidding = {
        passengerId,
        seatNumber,
        flightId,
        startTime: Date.now(),
        expirationTime,
        status: 'ACTIVE'
    };

    activeBiddings.set(biddingId, newBidding);
    bids.set(biddingId, []);

    emitToFlight(req.app.locals.io, flightId, 'new-bid', { 
        biddingId, 
        seatNumber, 
        passengerId,
        bids: []
    });

    setTimeout(() => expireBidding(req.app.locals.io, biddingId), expirationTime - Date.now());

    res.json({ success: true, biddingId, ...newBidding, bids: [] });
});

/**
 * @route POST /bid
 * @desc Place a bid on an active bidding
 * @access Private
 */
router.post('/bid', authenticateUser, async (req, res) => {
    const { biddingId, bidderId, amount, bidderSeatNumber } = req.body;
    const bidding = activeBiddings.get(biddingId);

    if (!bidding || bidding.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Bidding not found or not active' });
    }

    const bidderActiveBidding = Array.from(activeBiddings.values()).find(
        b => b.passengerId === bidderId && b.status === 'ACTIVE'
    );

    if (bidderActiveBidding) {
        bidderActiveBidding.status = 'CANCELLED';
        emitToFlight(req.app.locals.io, bidderActiveBidding.flightId, 'bidding-cancelled', { biddingId: bidderActiveBidding.biddingId });
    }

    const bid = { 
        id: Date.now().toString(), 
        bidderId, 
        amount, 
        bidderSeatNumber, 
        time: Date.now() 
    };

    if (!bids.has(biddingId)) bids.set(biddingId, []);
    bids.get(biddingId).push(bid);

    emitToFlight(req.app.locals.io, bidding.flightId, 'new-bid', { biddingId, bid });

    res.json({ success: true, bidId: bid.id });
});

/**
 * @route POST /accept
 * @desc Accept a bid and complete the seat swap
 * @access Private
 */
router.post('/accept', authenticateUser, async (req, res) => {
    const { biddingId, bidId } = req.body;
    const bidding = activeBiddings.get(biddingId);

    if (!bidding || bidding.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Bidding not found or not active' });
    }

    const acceptedBid = bids.get(biddingId).find(bid => bid.id === bidId);
    if (!acceptedBid) {
        return res.status(400).json({ error: 'Bid not found' });
    }

    try {
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
        ]);

        activeBiddings.delete(biddingId);
        bids.delete(biddingId);

        emitToFlight(req.app.locals.io, bidding.flightId, 'bidding-completed', {
            biddingId,
            winnerId: acceptedBid.bidderId,
            auctioneerNewSeat: acceptedBid.bidderSeatNumber,
            bidderNewSeat: bidding.seatNumber
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to swap seats' });
    }
});

/**
 * @route GET /active/:flightId
 * @desc Get all active biddings for a specific flight
 * @access Private
 */
router.get('/active/:flightId', authenticateUser, (req, res) => {
    const { flightId } = req.params;
    const flightBiddings = Array.from(activeBiddings.values())
        .filter(bidding => bidding.flightId === flightId && bidding.status === 'ACTIVE')
        .map(bidding => ({
            biddingId: `${bidding.flightId}-${bidding.seatNumber}`,
            seatNumber: bidding.seatNumber,
            passengerId: bidding.passengerId,
            startTime: bidding.startTime,
            expirationTime: bidding.expirationTime,
            bids: bids.get(`${bidding.flightId}-${bidding.seatNumber}`) || []
        }));

    res.json(flightBiddings);
});

/**
 * @route POST /cancel
 * @desc Cancel an active bidding
 * @access Private
 */
router.post('/cancel', authenticateUser, async (req, res) => {
    const { biddingId } = req.body;
    const bidding = activeBiddings.get(biddingId);
    
    if (!bidding || bidding.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Bidding not found or not active' });
    }

    try {
        activeBiddings.delete(biddingId);
        bids.delete(biddingId);
    
        io.to(bidding.flightId).emit('bidding-cancelled', { biddingId });
    
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cancel bidding' });
    }
});

export default router;