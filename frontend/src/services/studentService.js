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
    },

    submitAssessment(payload) {
        return axios.post(`${API_URL}/assessment/submit`, payload, { withCredentials: true }).then(res => res.data);
    },

    bulkActivateStudents(studentIds) {
        return axios.post(`${API_URL}/bulk-activate`, { student_ids: studentIds }, { withCredentials: true }).then(res => res.data);
    },

    bulkApproveAssessments(studentIds, approve = true) {
        return axios.post(`${API_URL}/bulk-approve-assessment`, { student_ids: studentIds, approve }, { withCredentials: true }).then(res => res.data);
    },

    approveAssessment(id, approve = true) {
        return axios.put(`${API_URL}/${id}/approve-assessment?approve=${approve}`, {}, { withCredentials: true }).then(res => res.data);
    },

    autoGroupStudents(studentIds) {
        return axios.post(`${API_URL}/grouping/auto`, { student_ids: studentIds }, { withCredentials: true }).then(res => res.data);
    },

    manualGroupStudents(studentIds, groupName) {
        return axios.post(`${API_URL}/grouping/manual`, { student_ids: studentIds, group_name: groupName }, { withCredentials: true }).then(res => res.data);
    },

    ungroupStudents(studentIds) {
        return axios.post(`${API_URL}/grouping/ungroup`, { student_ids: studentIds }, { withCredentials: true }).then(res => res.data);
    },

    ungroupStudents(studentIds) {
        return axios.post(`${API_URL}/grouping/ungroup`, { student_ids: studentIds }, { withCredentials: true }).then(res => res.data);
    },

    getStudentGroups() {
        return axios.get(`${API_URL}/grouping`, { withCredentials: true }).then(res => res.data);
    },

    getAvailableCharts() {
        return axios.get(`http://localhost:8000/api/charts/list`, { withCredentials: true }).then(res => res.data);
    },

    bulkAssignChart(payload) {
        return axios.post(`http://localhost:8000/api/assignments/bulk`, payload, { withCredentials: true }).then(res => res.data);
    }
};
