import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AssessmentService } from '../../services/assessmentService';
import AssessmentSummaryPrintView from '../admin/AssessmentSummaryPrintView';

const StudentSummaryPrintView = () => {
    const [student, setStudent] = useState(null);
    const [results, setResults] = useState([]);
    const [summarySettings, setSummarySettings] = useState(null);
    const [applicableAssessments, setApplicableAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPrintData = async () => {
            try {
                // Fetch student info
                const meRes = await axios.get('http://' + window.location.hostname + ':8000/api/me', { withCredentials: true });
                setStudent({ ...meRes.data, student_name: meRes.data.username });
                
                // Fetch student's assessment results
                const resultsRes = await AssessmentService.getAssessmentResults(meRes.data.id);
                setResults(resultsRes);

                // Fetch applicable assessments for accurate grading
                const allAssessments = await AssessmentService.getAssessments();
                const norm = (s) => s ? String(s).replace(/\s+/g, '').toLowerCase() : '';
                const applicable = allAssessments.filter(a => {
                    const matchCat = !meRes.data.category || norm(a.category) === norm(meRes.data.category);
                    const matchStage = !meRes.data.stage || norm(a.stage) === norm(meRes.data.stage);
                    return matchCat && matchStage;
                });
                setApplicableAssessments(applicable);

                // Fetch summary settings
                const allSettings = await AssessmentService.getAllSummarySettings();
                let matched = null;
                if (meRes.data.location_id) {
                    matched = allSettings.find(s => s.location_id === meRes.data.location_id);
                }
                if (!matched && allSettings.length > 0) {
                    matched = allSettings[0];
                }
                setSummarySettings(matched ? matched.settings : {});
                
                setLoading(false);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load student print view data", err);
                setLoading(false);
            }
        };

        fetchPrintData();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading your summary...</div>;
    }

    if (student?.assessment_status !== 'approved') {
        return <div className="min-h-screen flex items-center justify-center text-red-500 text-2xl font-bold">Your summary is not yet approved by an Administrator.</div>;
    }

    return <AssessmentSummaryPrintView student={student} results={results} summarySettings={summarySettings} applicableAssessments={applicableAssessments} />;
};

export default StudentSummaryPrintView;
