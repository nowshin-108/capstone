# Capstone project plan

https://docs.google.com/document/d/1uOiigUbGpuDIhEeIQhBmXryvGWx1BgjDvI0aT22d5TE/edit?usp=sharing


# Wireframe

https://excalidraw.com/#json=4K56539uyJ3a_koNy8d4_,gbaqGStjmNZTIGcYq-nFtw


# Week 3 Progress:

    - Day 1: Met Alan and Abe, finalized Project Plan
    - Day 2: Created Basic Homepage frontend, dived into user authentication, met Abe, talked about technical challenges and moving 
             forward with  the project
    - Day 3: Implemented login, signup and logout functionalities, worked on data flow, Met Alan, Murray & Abe, dsicussed handling 
             local storage & loading state and other relevant stuff
    - Day 4: Fixed logout bug, worked on self-review, improved UI of homepage, added floating animation on hover
    - Day 5: Cleaned up code, working on Add trip, AviationStack API integration and workplace post about progress

# Week 4 Progress:

    - Day 1: Met Alan, worked on add trip functionality
    - Day 2: Met Maddy, completed add trip functionality
                - Added Amadeus API integration in backend
                - Developed flight search and result display in frontend
                - Stored flight search results in session storage for better user experience
                - Implemented trip addition to database
                - Enhanced error handling with single error state
                - Added loading states to all components
                - Refactored for improved code quality and maintainability

              BREAKING CHANGE: New API endpoints for flight search and trip addition
    - Day 3: Met Alan, Maddy, Abe, Murray made the following changes:
                - Backend middleware:
                        - Added authenticateUser function to check session validity
                        - Protecting API routes by verifying user session before allowing access
                        - Returning 401 status if session is invalid or missing
                - Session-based auth:
                        - Storing user info in server-side sessions
                        - Using secure, HTTP-only cookies to maintain session across requests
                - API protection:
                        - Each protected route first passes through authenticateUser middleware
                        - Ensures only authenticated users can access sensitive endpoints
                - Frontend integration:
                        - Sends credentials with each request using withCredentials: true
                        - Handles 401 responses by redirecting to login page



