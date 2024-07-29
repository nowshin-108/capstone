import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { UserContext } from "../../UserContext.js";
import { API_BASE_URL } from '../../config.js';



function Sidebar() {
    const navigate = useNavigate();
    const { updateUser } = useContext(UserContext);
    const [ isLoading, setIsLoading ] = useState(false);

    
    const handleNavigation = async (path, action = null) => {
        setIsLoading(true);
        if (action) {
            await action();
        }
        navigate(path);
        setIsLoading(false);
    };

    const handleLogout = async () => {
        await fetch(`${API_BASE_URL}/users/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        updateUser(null);
    };
        
        return (
        <div className="sidebar">
            <div className="sidebar-header">
            {isLoading && <div className="loader"></div>}
            <img src="/flight-svgrepo-com.svg" alt="flight icon" width="55" height="55"/>
            <h2>Halim</h2>
            </div>
            <button onClick={() => handleNavigation('/add-trips')}>+ Add Trip</button>
            <button onClick={() => handleNavigation('/upcoming-trips')}>Upcoming Trip</button>
            <button onClick={() => handleNavigation('/past-trips')}>Trip History</button>
            <button className="logout" onClick={() => handleNavigation('/login', handleLogout)}>Log out</button>
        </div>
        );
    }
    
export default Sidebar;
    