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
  origin: 'http://localhost:5174',
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

// Route to get all posts, with associated users
app.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Route to create a new post
app.post('/posts', async (req, res) => {
  try {

    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }


    const currentUser = req.session.user;


    const post = await prisma.post.create({
      data: {
        title: req.body.title,
        content: req.body.content,
        userId: currentUser.id
      },
      include: { user: true }
    });

    res.status(201).json(post);
  } catch (err) {
    console.log(err); 
    res.status(500).json({ message: err.message });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});