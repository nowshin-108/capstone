import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../UserContext.js";

function Sidebar() {
    const navigate = useNavigate();
    const { user, updateUser } = useContext(UserContext);

    const handleLogout = async () => {
        await fetch('http://localhost:3000/users/logout', {
            method: 'POST',
            credentials: 'include'
        });
        updateUser(null);

        navigate('/login');
        };  
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src="../flight-svgrepo-com.svg" alt="flight icon" width="55" height="55"/>
                <h2>Halim</h2>
            </div>
            <h4> Hi {user.username}!</h4>
            <button>+ Add Trip</button>
            <button className="active">Upcoming Trip</button>
            <button>Trip History</button>
            <button className="logout" onClick={handleLogout}>Log out</button>
        </div>
    );
}

export default Sidebar;