import express from 'express';
import session from 'express-session';
import cors from 'cors';
import morgan from 'morgan';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import userRoutes from './routes/users.js';
import flightStatusRoutes from './routes/flightStatus.js';
import { CORS_ORIGIN } from "./config.js";
import flightRecomRoutes from './routes/flightRecom.js'
import http from 'http';
import { Server } from 'socket.io';
import { setupWebSocket } from './websocket.js';
import seatbidRoutes from './routes/seatbid.js';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: `${CORS_ORIGIN}` || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Session middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: false,
      secure: false,
      expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))
    }
  })
);

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true,
  },
});
app.locals.io = io;

app.use(userRoutes);
app.use(flightStatusRoutes);
app.use(flightRecomRoutes);
app.use('/bidding', seatbidRoutes);

setupWebSocket(io);

export { io };

const port = 3000;
server.listen(port, () => {
  console.log(`Server with Socket.io is listening on port ${port}`);
});