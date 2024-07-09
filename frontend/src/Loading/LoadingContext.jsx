import { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

export const LoadingContext = createContext({
    isLoading: false,
    setIsLoading: () => {},
});

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
        {children}
        </LoadingContext.Provider>
    );
};

LoadingProvider.propTypes = {
    children: PropTypes.node.isRequired,
}
export const useLoading = () => useContext(LoadingContext);

