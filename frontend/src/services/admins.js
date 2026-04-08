import axios from 'axios';

const API_URL = 'http://localhost:8000/api/admins';

export const AdminService = {
    getAdmins() {
        return axios.get(API_URL, { withCredentials: true })
            .then(res => res.data);
    },

    createAdmin(admin) {
        return axios.post(API_URL, admin, { withCredentials: true })
            .then(res => res.data);
    },

    updateAdmin(id, admin) {
        return axios.put(`${API_URL}/${id}`, admin, { withCredentials: true })
            .then(res => res.data);
    },

    deleteAdmin(id) {
        return axios.delete(`${API_URL}/${id}`, { withCredentials: true })
            .then(res => res.data);
    }
};
