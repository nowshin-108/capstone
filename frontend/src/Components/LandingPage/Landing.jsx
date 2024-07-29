import './landing.css';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
function Landing() {
    const navigate = useNavigate();
    const [ isLoading, setIsLoading ] = useState(false);

    
    const handleNavigation = async (path, action = null) => {
        setIsLoading(true);
        if (action) {
            await action();
        }
        navigate(path);
        setIsLoading(false);
    };
    return (
        <div className="landing">
            <header>
                <h1 className="title">Halim</h1>
            </header>
            <main>
                <div className="content">
                    <div className="logo-container">
                        <img
                            src="/flight-svgrepo-com.svg"
                            alt="Halim logo"
                            className="logo"
                        />
                    </div>
                    <div className="description">
                        <h2>Your Travel Buddy</h2>
                        <p>Manages Your Travel So You Can Enjoy!</p>
                    </div>
                    {isLoading && <div className="loader"></div>}
                    <div className="auth-buttons">
                        <button className="login-button" onClick={() => handleNavigation('/login')}>Login</button>
                        <button className="signup-button" onClick={() => handleNavigation('/signup')}>Sign Up</button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Landing;