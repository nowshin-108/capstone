import { useLoading } from '../LoadingContext';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="loading-overlay">
        <div className="loading-spinner"></div>
        </div>
    );
};

export default LoadingSpinner;
