import { useState, useEffect, useContext  } from 'react';
import { UserContext } from '../UserContext/';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { API_BASE_URL } from '../config';

const ProtectedRoute = ({ children }) => {
const { user, updateUser } = useContext(UserContext);
const [ isLoading, setIsLoading ] = useState(true);
const [error, setError] = useState(null);


useEffect(() => {
    const checkAuth = async () => {
        if (user !== null){
            try {
                const response = await fetch(`${API_BASE_URL}/users/auth-check`, {
                credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    updateUser(data.user);
                } else {
                    updateUser(null);
                }
            } catch (error) {
                setError('Authentication check failed. Please try again.', error);
                updateUser(null);
            }
        }
        setIsLoading(false);
    };
    checkAuth();
}, [user, updateUser, setIsLoading]);


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


return user ? children : <Navigate to="/login" replace />;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    };


export default ProtectedRoute;
