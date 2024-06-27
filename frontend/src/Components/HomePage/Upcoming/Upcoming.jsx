import './Upcoming.css';
import TripTimeline from './PageParts/TripTimeline';
import ManageSection from './PageParts/ManageSection';

function Upcoming() {
    return (
        <div className="main-content">
        <header>
            <h1>My Trip</h1>
            <p>Fri, 1 June, 2024</p>
        </header>
        <TripTimeline />
        <ManageSection />
        </div>
    );
}

export default Upcoming;
