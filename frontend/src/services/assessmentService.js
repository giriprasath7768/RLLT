import axios from 'axios';

const API_URL = 'http://localhost:8000/api/assessments';

export const AssessmentService = {
    getAssessments(name = '', locationModule = '') {
        const params = new URLSearchParams();
        if (name) params.append('name', name);
        if (locationModule) params.append('location_module', locationModule);
        
        return axios.get(`${API_URL}?${params.toString()}`, { withCredentials: true }).then(res => res.data);
    },

    getAssessmentOptions() {
        return axios.get(`${API_URL}/options`, { withCredentials: true }).then(res => res.data);
    },
    
    createAssessment(assessment) {
        return axios.post(API_URL, assessment, { withCredentials: true }).then(res => res.data);
    },

    bulkCreateAssessments(assessments) {
        return axios.post(`${API_URL}/bulk`, { assessments }, { withCredentials: true }).then(res => res.data);
    },

    updateAssessment(id, assessment) {
        return axios.put(`${API_URL}/${id}`, assessment, { withCredentials: true }).then(res => res.data);
    },

    deleteAssessment(id) {
        return axios.delete(`${API_URL}/${id}`, { withCredentials: true }).then(res => res.data);
    },

    bulkDeleteAssessments(ids) {
        return axios.delete(`${API_URL}/bulk`, { data: ids, withCredentials: true }).then(res => res.data);
    },

    purgeAssessments(name, locationModule) {
        return axios.delete(`${API_URL}/purge?name=${name}&location_module=${locationModule}`, { withCredentials: true }).then(res => res.data);
    }
};
