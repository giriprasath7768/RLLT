import axios from 'axios';

const API_URL = 'http://' + window.location.hostname + ':8000/api/leaders';

// Function to attach cookie and headers
const getAxiosConfig = () => {
    return {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
        }
    };
};

export const getLeaders = async () => {
    const response = await axios.get(API_URL, getAxiosConfig());
    return response.data;
};

export const createLeader = async (leaderData) => {
    const response = await axios.post(API_URL, leaderData, getAxiosConfig());
    return response.data;
};

export const updateLeader = async (id, leaderData) => {
    const response = await axios.put(`${API_URL}/${id}`, leaderData, getAxiosConfig());
    return response.data;
};

export const deleteLeader = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAxiosConfig());
    return response.data;
};
