import './App.css';
import { useState, useEffect } from 'react';
import { UserContext, initialFlightData } from './UserContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoadingProvider, useLoading } from './Loading/LoadingContext.jsx';
import HomePage from './Components/HomePage/HomePage';
import LoginForm from './Components/LoginForm/LoginForm';
import SignupForm from './Components/SignupForm/SignupForm';
import AddTrip from './Components/HomePage/AddTrip/AddTripPage';
import Sidebar from './Components/HomePage/Sidebar';
import PastTrips from './Components/HomePage/PastTrips/PastTrips';
import { API_BASE_URL } from './config.js';


function App() {
  const [user, setUser] = useState(null);
  const [flightData, setFlightData] = useState(initialFlightData);
  const { isLoading, setIsLoading } = useLoading();
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/data`, {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        updateUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setError('Error fetching user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  },[]);

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  const updateFlightData = (newData) => {
    setFlightData(prevData => ({ ...prevData, ...newData }));
  };

  
  return (
    <div className="app">
      <UserContext.Provider value={{ user, updateUser, flightData, updateFlightData, fetchUserData }}>
        <LoadingProvider>
          <BrowserRouter>
            <Routes>
              {isLoading ? (
                <Route path="*" element={<div className="loading-container">
                  <div className="loader"></div>
                </div>} />
              ) : (
              <>
              {error && <p className="error">{error}</p>}
              <Route path="/" element={user ? <HomePage/> : <LoginForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/add-trips" element={ <><Sidebar/> <AddTrip/></>} />
              <Route path="/past-trips" element={<><Sidebar/> <PastTrips/></>} />
              </>
              )}
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </UserContext.Provider>
    </div>
  );
}

export default App;