import './App.css';
import { useState } from 'react';
import { UserContext, initialFlightData } from './UserContext';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import HomePage from './Components/HomePage/HomePage';
import LoginForm from './Components/LoginForm/LoginForm';
import SignupForm from './Components/SignupForm/SignupForm';
import AddTrip from './Components/HomePage/AddTrip/AddTripPage';
import Sidebar from './Components/HomePage/Sidebar';
import PastTrips from './Components/HomePage/PastTrips/PastTrips';
import TripDetails from './Components/HomePage/UpcomingTrips/TripDetails.jsx';
import ProtectedRoute from './Components/ProtectedRoute';
import Landing from './Components/LandingPage/Landing.jsx';

function App() {
  // null: not checked, false: checked but not authenticated, object: authenticated user
  const [user, setUser] = useState(null);
  const [flightData, setFlightData] = useState(initialFlightData);
  


  const updateUser = (newUser) => {
    setUser(newUser);
  };


  const updateFlightData = (newData) => {
    setFlightData(prevData => ({ ...prevData, ...newData }));
  };


  return (
    <div className="app">
      <UserContext.Provider value={{ user, updateUser, flightData, updateFlightData }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/upcoming-trips" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/add-trips" element={
                <ProtectedRoute>
                  <Sidebar />
                  <AddTrip />
                </ProtectedRoute>
              } />
              <Route path="/past-trips" element={
                <ProtectedRoute>
                  <Sidebar />
                  <PastTrips />
                </ProtectedRoute>
              } />
              <Route path="/trips/:tripId" element={
                <ProtectedRoute>
                  <Sidebar />
                  <TripDetails />
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
      </UserContext.Provider>
    </div>
  );
}


export default App;