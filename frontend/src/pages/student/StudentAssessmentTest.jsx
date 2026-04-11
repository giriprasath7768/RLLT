import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { StudentService } from '../../services/studentService';
import { AssessmentService } from '../../services/assessmentService';

const StudentAssessmentTest = () => {
    const [assessments, setAssessments] = useState([]);
    const [responses, setResponses] = useState({});
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch assessments targeted specifically to this student's location, category, and stage
        AssessmentService.getStudentAssessments()
            .then(data => setAssessments(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleChoice = (assessmentId, choice) => {
        setResponses(prev => ({
            ...prev,
            [assessmentId]: choice
        }));
    };

    const handleSubmit = () => {
        const payload = {
            responses: Object.entries(responses).map(([assessment_id, choice]) => ({
                assessment_id,
                choice: parseInt(choice)
            }))
        };

        StudentService.submitAssessment(payload)
            .then(() => {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Assessment submitted successfully!' });
                setTimeout(() => {
                    navigate('/dashboard/under-review');
                }, 1500);
            })
            .catch(err => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to submit assessment.' });
            });
    };

    if (loading) return <div className="p-8 text-white">Loading Assessment...</div>;

    return (
        <div className="p-4 sm:p-10 w-full min-h-screen bg-gray-50 flex flex-col items-center">
            <Toast ref={toast} />
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h1 className="text-3xl font-black text-[#051220] tracking-tight mb-2">Initial Assessment Test</h1>
                <p className="text-gray-500 mb-8 border-b border-gray-100 pb-4">Please complete the following assessment to processing to your student dashboard. Ensure you answer everything truthfully.</p>

                {assessments.length > 0 ? (
                    <div className="flex flex-col gap-8">
                        {assessments.map((a, i) => (
                            <div key={a.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Q{i + 1}. <span dangerouslySetInnerHTML={{ __html: a.question_text }}></span></h3>
                                <div className="flex flex-col gap-3 mt-2 ml-2">
                                    {a.choice_1 && (
                                        <label className={`flex items-center gap-3 cursor-pointer p-3 bg-white border ${responses[a.id] === '1' ? 'border-[#2F5597] bg-blue-50 cursor-default' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50'} rounded-lg transition-colors`}>
                                            <input type="radio" name={`question-${a.id}`} value="1" checked={responses[a.id] === '1'} onChange={() => handleChoice(a.id, '1')} className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span dangerouslySetInnerHTML={{ __html: a.choice_1 }}></span>
                                        </label>
                                    )}
                                    {a.choice_2 && (
                                        <label className={`flex items-center gap-3 cursor-pointer p-3 bg-white border ${responses[a.id] === '2' ? 'border-[#2F5597] bg-blue-50 cursor-default' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50'} rounded-lg transition-colors`}>
                                            <input type="radio" name={`question-${a.id}`} value="2" checked={responses[a.id] === '2'} onChange={() => handleChoice(a.id, '2')} className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span dangerouslySetInnerHTML={{ __html: a.choice_2 }}></span>
                                        </label>
                                    )}
                                    {a.choice_3 && (
                                        <label className={`flex items-center gap-3 cursor-pointer p-3 bg-white border ${responses[a.id] === '3' ? 'border-[#2F5597] bg-blue-50 cursor-default' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50'} rounded-lg transition-colors`}>
                                            <input type="radio" name={`question-${a.id}`} value="3" checked={responses[a.id] === '3'} onChange={() => handleChoice(a.id, '3')} className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                            <span dangerouslySetInnerHTML={{ __html: a.choice_3 }}></span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-500 italic">No assessment questions currently loaded bounds. You may click submit to bypass this prerequisite.</div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                    <Button label="Submit Test Responses" icon="pi pi-check" onClick={handleSubmit} className="px-8 py-3 font-bold bg-[#2F5597] hover:bg-[#1a386b] text-white rounded-xl shadow-md border-none" />
                </div>
            </div>
        </div>
    );
};

export default StudentAssessmentTest;
