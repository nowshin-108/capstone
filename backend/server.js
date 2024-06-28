// app.js
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import morgan from 'morgan';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import userRoutes from './routes/users.js';

const prisma = new PrismaClient();
const app = express();

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

app.use(morgan('dev'));

// Session middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      secure: false,
      expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))
    }
  })
);

app.use(userRoutes);


const port = 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});