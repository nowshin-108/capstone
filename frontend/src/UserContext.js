import { createContext } from 'react';

export const UserContext = createContext(null);

export const initialFlightData = {
    flightNumber: '',
    departureDate: '',
    carrierCode: '',
    flightStatus: null,
    flightAdded: false
};