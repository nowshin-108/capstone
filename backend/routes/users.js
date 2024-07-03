import express from 'express';
import bcrypt from 'bcrypt';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;


const prisma = new PrismaClient();
const router = express.Router();

// Route for user registration
router.post('/users', async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email
      }
    });

    req.session.user = { userId: newUser.userId, username: newUser.username };

    res.json({ user: newUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route for user login
router.post('/users/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.user = { userId: user.userId, username: user.username };
    res.json({ user });
    
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



// Route for logout
router.post('/users/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');

    res.status(200).json({ message: 'Logged out successfully' });
  });
});


export default router;
