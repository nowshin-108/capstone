import './App.css';
import { useState, useEffect } from 'react';
import { UserContext } from './UserContext';
import { LoadingProvider } from './Components/Loading/LoadingContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './Components/HomePage/HomePage';
import LoginForm from './Components/LoginForm/LoginForm';
import SignupForm from './Components/SignupForm/SignupForm';
import AddTrip from './Components/HomePage/AddTrip/AddTripPage';
import Sidebar from './Components/HomePage/Sidebar';
import PastTrips from './Components/HomePage/PastTrips/PastTrips';
import { API_BASE_URL } from './config.js';


function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateUser = (newUser) => {
    setUser(newUser);
  };

  useEffect(() => {
    //making a call to backend middleware API to check the authentication status of user
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/auth-check`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  
  return (
    <div className="app">
      <UserContext.Provider value={{ user, updateUser }}>
        <LoadingProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={user ? <HomePage/>: <LoginForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/add-trips" element={ <><Sidebar/> <AddTrip/></>} />
              <Route path="/past-trips" element={<><Sidebar/> <PastTrips/></>} />
            </Routes>
          </BrowserRouter>
        </LoadingProvider>
      </UserContext.Provider>
    </div>
  );
}

export default App;