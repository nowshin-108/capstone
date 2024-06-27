import './HomePage.css';
import Sidebar from './Sidebar';
import Upcoming from './Upcoming/Upcoming';

function HomePage() {
    return (
    <div>
        <Sidebar />
        <Upcoming/>
    </div>
    );
}

export default HomePage;