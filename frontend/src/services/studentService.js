import axios from 'axios';

const API_URL = 'http://localhost:8000/api/students';

export const StudentService = {
    getStudents() {
        return axios.get(API_URL, { withCredentials: true }).then(res => res.data);
    },
    
    createStudent(student) {
        return axios.post(API_URL, student, { withCredentials: true }).then(res => res.data);
    },

    updateStudent(id, student) {
        return axios.put(`${API_URL}/${id}`, student, { withCredentials: true }).then(res => res.data);
    },

    deleteStudent(id) {
        return axios.delete(`${API_URL}/${id}`, { withCredentials: true }).then(res => res.data);
    },

    activateStudent(id, isActive) {
        return axios.patch(`${API_URL}/${id}/activate`, { is_active: isActive }, { withCredentials: true }).then(res => res.data);
    }
};
