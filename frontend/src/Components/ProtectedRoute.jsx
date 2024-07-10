import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useLoading } from '../Loading/LoadingContext';
import PropTypes from 'prop-types';
import { API_BASE_URL } from '../config';


const ProtectedRoute = ({ children }) => {
const [isAuthenticated, setIsAuthenticated] = useState(false);
const { isLoading, setIsLoading } = useLoading();
const [error, setError] = useState(null);


useEffect(() => {
    const checkAuth = async () => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/users/auth-check`, {
        credentials: 'include'
        });
        if (response.ok) {
        setIsAuthenticated(true);
        } else {
        setIsAuthenticated(false);
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        setError('Authentication check failed. Please try again.');
        setIsAuthenticated(false);
    } finally {
        setIsLoading(false);
    }
    };
    checkAuth();
}, [setIsLoading]);


if (isLoading) {
    return (
    <div className="loading-container">
        <div className="loader"></div>
    </div>
    );
}


if (error) {
    return <p className="error">{error}</p>;
}


return isAuthenticated ? children : <Navigate to="/login" replace />;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    };


export default ProtectedRoute;
