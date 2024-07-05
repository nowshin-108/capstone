import './App.css';
import { useState } from 'react';
import { UserContext } from './UserContext';
import { LoadingProvider } from './Components/Loading/LoadingContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './Components/HomePage/HomePage';
import LoginForm from './Components/LoginForm/LoginForm';
import SignupForm from './Components/SignupForm/SignupForm';
import AddTrip from './Components/HomePage/AddTrip/AddTripPage';
import Sidebar from './Components/HomePage/Sidebar';
import PastTrips from './Components/HomePage/PastTrips/PastTrips';


function App() {
  const [user, setUser] = useState(null);

  const updateUser = (newUser) => {
    setUser(newUser);
  };
  
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