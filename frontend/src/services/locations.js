import axios from 'axios';

const API_URL = 'http://' + window.location.hostname + ':8000/api/locations';

export const LocationService = {
    getLocations: async () => {
        const response = await axios.get(API_URL, { withCredentials: true });
        return response.data;
    },

    createLocation: async (location) => {
        const response = await axios.post(API_URL, location, { withCredentials: true });
        return response.data;
    },

    updateLocation: async (id, location) => {
        const response = await axios.put(`${API_URL}/${id}`, location, { withCredentials: true });
        return response.data;
    },

    deleteLocation: async (id) => {
        const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
        return response.data;
    }
};
