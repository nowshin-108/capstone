import './App.css';
import { useState } from 'react';
import { UserContext, initialFlightData } from './UserContext';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import { LoadingProvider } from './Loading/LoadingContext.jsx';
import HomePage from './Components/HomePage/HomePage';
import LoginForm from './Components/LoginForm/LoginForm';
import SignupForm from './Components/SignupForm/SignupForm';
import AddTrip from './Components/HomePage/AddTrip/AddTripPage';
import Sidebar from './Components/HomePage/Sidebar';
import PastTrips from './Components/HomePage/PastTrips/PastTrips';
import TripDetails from './Components/HomePage/UpcomingTrips/TripDetails.jsx';
import ProtectedRoute from './Components/ProtectedRoute';


function App() {
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
        <LoadingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/add-trips" element={
                <>
                  <Sidebar />
                  <AddTrip />
                </>
              } />
              <Route path="/past-trips" element={
                <>
                  <Sidebar />
                  <PastTrips />
                </>
              } />
              <Route path="/trips/:tripId" element={
                <>
                  <Sidebar />
                  <TripDetails />
                </>
              } />
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </UserContext.Provider>
    </div>
  );
}


export default App;