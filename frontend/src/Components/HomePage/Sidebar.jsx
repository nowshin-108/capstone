import { useNavigate } from "react-router-dom";

function Sidebar() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        await fetch('http://localhost:3000/users/logout', {
            method: 'POST',
            credentials: 'include'
        });

        // updateUser(null);

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
