import './HomePage.css';
import Sidebar from './Sidebar';
import Upcoming from './UpcomingTrips/Upcoming';


function HomePage() {
    return (
        <>
        <Sidebar/> 
        <Upcoming/>
        </>
    );
}

export default HomePage;