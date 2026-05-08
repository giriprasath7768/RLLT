import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AssessmentService } from '../../services/assessmentService';
import { StudentService } from '../../services/studentService';
import AssessmentSummaryPrintView from './AssessmentSummaryPrintView';

const AdminSummaryPrintView = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [results, setResults] = useState([]);
    const [summarySettings, setSummarySettings] = useState(null);
    const [applicableAssessments, setApplicableAssessments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const students = await StudentService.getStudents();
                const matchedStudent = students.find(s => s.id === studentId);
                
                if (!matchedStudent) {
                    setStudent(null);
                    setLoading(false);
                    return;
                }
                
                setStudent(matchedStudent);

                const resultsRes = await AssessmentService.getAssessmentResults(studentId);
                setResults(resultsRes);

                const allAssessments = await AssessmentService.getAssessments();
                const norm = (s) => s ? String(s).replace(/\s+/g, '').toLowerCase() : '';
                const applicable = allAssessments.filter(a => {
                    const matchCat = !matchedStudent.category || norm(a.category) === norm(matchedStudent.category);
                    const matchStage = !matchedStudent.stage || norm(a.stage) === norm(matchedStudent.stage);
                    return matchCat && matchStage;
                });
                setApplicableAssessments(applicable);

                const allSettings = await AssessmentService.getAllSummarySettings();
                let matched = null;
                if (matchedStudent.location_id) {
                    matched = allSettings.find(s => s.location_id === matchedStudent.location_id);
                }
                if (!matched && allSettings.length > 0) {
                    matched = allSettings[0];
                }
                setSummarySettings(matched ? matched.settings : {});

                setLoading(false);
            } catch (err) {
                console.error("Failed to load admin print view data", err);
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading summary report...</div>;
    }

    if (!student) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">Student not found.</div>;
    }

    return <AssessmentSummaryPrintView student={student} results={results} summarySettings={summarySettings} applicableAssessments={applicableAssessments} />;
};

export default AdminSummaryPrintView;
