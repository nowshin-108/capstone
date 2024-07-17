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

const prisma = new PrismaClient();
const app = express();

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

app.use(userRoutes);
app.use(flightStatusRoutes);
app.use(flightRecomRoutes);

const port = 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});