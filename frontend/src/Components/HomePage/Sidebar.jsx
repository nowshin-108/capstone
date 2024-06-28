import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../UserContext.js";

function Sidebar() {
    const navigate = useNavigate();
    const { updateUser } = useContext(UserContext);
    const handleLogout = async () => {
        await fetch('http://localhost:3000/users/logout', {
            method: 'POST',
            credentials: 'include'
        });
        console.log("Logout req sent")
        updateUser(null);

        navigate('/login');
        };  
    return (
        <div className="sidebar">
            <h2>Halim</h2>
            <button>+ Add Trip</button>
            <button className="active">Upcoming Trip</button>
            <button>Trip History</button>
            <button className="logout" onClick={handleLogout}>Log out</button>
        </div>
    );
}

export default Sidebar;
