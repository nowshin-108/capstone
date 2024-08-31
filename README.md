## Meta University Capstone - Flight Management App "Halim"

## Project plan

https://docs.google.com/document/d/1uOiigUbGpuDIhEeIQhBmXryvGWx1BgjDvI0aT22d5TE/edit?usp=sharing


## Wireframe

https://excalidraw.com/#json=4K56539uyJ3a_koNy8d4_,gbaqGStjmNZTIGcYq-nFtw


<img width="960" alt="a" src="https://github.com/user-attachments/assets/9e25e848-c4f4-4aa7-b43b-27bcf0c792a9">

<img width="960" alt="c" src="https://github.com/user-attachments/assets/b55320cf-9567-4c61-8c79-9ae637e7fefb">

<img width="960" alt="d" src="https://github.com/user-attachments/assets/80759153-b2ab-4f02-b3ea-d6bdd772594b">

<img width="960" alt="e" src="https://github.com/user-attachments/assets/24cf3371-8393-46c9-bf07-87045d1dbf68">

## Tech Stack

- Frontend: React
- Backend: Node.js, Express
- Database: PostgreSQL
- ORM: Prisma

## Features

- User Authentication: Secure login and registration system
- Trip Management:
  - Add new trips with flight details
  - View and manage upcoming trips
  - Access past trip information
- Real-time Flight Updates: Get live updates on flight status
- Personal Checklists: Create and manage trip-specific checklists
- Interactive Dashboard: Centralized view of all travel information

## Technical Challenges

1. Seat Switching Real-time Bidding
   - Implement a real-time auction system for seat switching
   - Use WebSockets for live updates without page refreshes
   - Ensure data consistency between live updates and permanent storage
   - Handle edge cases to prevent double bookings

2. Similar Flights Recommendation
   - Develop an algorithm to recommend alternative flights based on specific criteria
   - Calculate and optimize connected flights with up to 4 stops
   - Implement dynamic pricing discounts based on flight distance and idle time
   - Create a ranking system based on time, price, and airline preference

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/nowshin-108/capstone.git
   cd capstone
   ```

2. Set up the backend:
   ```
   cd backend
   npm install
   ```

3. Set up the frontend:
   ```
   cd ../frontend
   npm install
   ```

4. Set up your PostgreSQL database and update the connection string in `backend/.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

5. Run Prisma migrations:
   ```
   cd ../backend
   npx prisma migrate dev
   ```

## Running the Application

1. Start the backend server:
   ```
   cd backend
   node index.js
   ```

2. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

The application should now be running on `http://localhost:3000` (or whichever port you've configured for the frontend).
