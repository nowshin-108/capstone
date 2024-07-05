import express from 'express';
import bcrypt from 'bcrypt';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { authenticateUser } from '../auth.js';


const prisma = new PrismaClient();
const router = express.Router();

// Route to fetch user data
router.get('/users/data', authenticateUser, (req, res) => {
  const { userId, username } = req.session.user;
  res.json({ userId, username });
});


// Route for user registration - doesn't need authentication
router.post('/users', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, password: hashedPassword, email }
    });
    req.session.user = { userId: newUser.userId, username: newUser.username };
    res.status(201).json({ message: 'User created successfully', user: { userId: newUser.userId, username: newUser.username } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Route for user login - doesn't need authentication
router.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    req.session.user = { userId: user.userId, username: user.username };
    res.json({ message: 'Logged in successfully', user: { userId: user.userId, username: user.username } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Route for logout - needs authentication
router.post('/users/logout', authenticateUser, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});


// Route for auth check
router.get('/users/auth-check', authenticateUser, (req, res) => {
  res.json({ isAuthenticated: true, user: { userId: req.session.user.userId, username: req.session.user.username } });
});



export default router;
