import { createContext } from 'react';

export const UserContext = createContext();

export const initialFlightData = {
    flightNumber: '',
    departureDate: '',
    carrierCode: '',
    flightStatus: null,
    flightAdded: false
};