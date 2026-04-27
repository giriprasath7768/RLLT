import axios from 'axios';

const API_URL = 'http://' + window.location.hostname + ':8000/api/ttom_users';

export const TTOMUserService = {
    getUsers() {
        return axios.get(API_URL, { withCredentials: true }).then(res => res.data);
    },
    createUser(user) {
        return axios.post(API_URL, user, { withCredentials: true }).then(res => res.data);
    },
    updateUser(id, user) {
        return axios.put(`${API_URL}/${id}`, user, { withCredentials: true }).then(res => res.data);
    },
    deleteUser(id) {
        return axios.delete(`${API_URL}/${id}`, { withCredentials: true }).then(res => res.data);
    },
    bulkAssignChart(payload) {
        return axios.post(`${API_URL}/assignments/bulk`, payload, { withCredentials: true }).then(res => res.data);
    },
    bulkRemoveChart(payload) {
        return axios.post(`${API_URL}/assignments/bulk_remove`, payload, { withCredentials: true }).then(res => res.data);
    }
};
