import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';

const StudentAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const toast = useRef(null);
    const fileInputRef = useRef(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionId, setSubmissionId] = useState(null);
    const [qnaDialogVisible, setQnaDialogVisible] = useState(false);
    const [qnaList, setQnaList] = useState([]);
    const [answers, setAnswers] = useState({});

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/assignments`, { withCredentials: true });
            setAssignments(res.data);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedAssignment) return;

        const formData = new FormData();
        formData.append('assignment_id', selectedAssignment.id);
        formData.append('file', file);

        try {
            const uploadRes = await axios.post(`http://${window.location.hostname}:8000/api/classroom/submissions/upload`, formData, { 
                withCredentials: true
            });
            const subData = uploadRes.data;
            setSubmissionId(subData.id);

            // Fetch Q&As for this topic
            const qnaRes = await axios.get(`http://${window.location.hostname}:8000/api/classroom/qna`, { withCredentials: true });
            const relevantQna = qnaRes.data.filter(q => q.topic.toLowerCase() === selectedAssignment.title.toLowerCase());

            if (relevantQna.length > 0) {
                setQnaList(relevantQna);
                setAnswers({});
                setQnaDialogVisible(true);
            } else {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Assignment uploaded successfully!' });
                setSelectedAssignment(null);
            }
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to upload assignment' });
            setSelectedAssignment(null);
        }
        
        // Reset
        e.target.value = null;
    };

    const submitQnaAnswers = async () => {
        if (!submissionId) return;
        try {
            await axios.put(`http://${window.location.hostname}:8000/api/classroom/submissions/${submissionId}`, {
                content: JSON.stringify(answers)
            }, { withCredentials: true });
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Answers submitted successfully!' });
            setQnaDialogVisible(false);
            setSelectedAssignment(null);
        } catch (error) {
            console.error("Failed to submit answers", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to submit answers' });
        }
    };

    if (loading) {
        return <div className="p-10 flex justify-center items-center h-full"><i className="pi pi-spin pi-spinner text-4xl text-[#cca673]"></i></div>;
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#051220] tracking-tight">My Assignments</h1>
                <p className="text-gray-500 mt-1">View your pending tasks and upload your submissions.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-[#051220]">Assignments</h2>
                </div>
                
                {assignments.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {assignments.map(assign => (
                            <div key={assign.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center shadow-md">
                                        <i className="pi pi-check-square text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#051220]">{assign.title}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5"><i className="pi pi-calendar"></i> Due: {assign.due_date ? new Date(assign.due_date).toLocaleDateString() : 'No Due Date'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => {
                                            setSelectedAssignment(assign);
                                            fileInputRef.current.click();
                                        }}
                                        className="h-10 px-4 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center transition-colors font-bold text-sm shadow-sm">
                                        <i className="pi pi-upload mr-2"></i> Upload File
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <i className="pi pi-check-square text-4xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up</h3>
                        <p className="text-gray-500 max-w-md">You have no pending assignments at this time.</p>
                    </div>
                )}
            </div>
            
            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
            />
            
            <Dialog visible={qnaDialogVisible} onHide={() => setQnaDialogVisible(false)} header={`Q&A: ${selectedAssignment?.title}`} modal className="max-w-3xl w-full p-fluid">
                <div className="p-4 bg-blue-50/50 rounded-xl mb-6">
                    <p className="text-gray-600 font-medium"><i className="pi pi-info-circle mr-2 text-blue-500"></i> Please answer the following questions related to this assignment to complete your submission.</p>
                </div>
                <div className="space-y-6">
                    {qnaList.map((q, index) => (
                        <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h4 className="font-bold text-[#051220] mb-3 text-lg">Q{index + 1}: {q.question_text}</h4>
                            {q.choices && q.choices.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {q.choices.map((c, i) => (
                                        <div key={i} className="flex items-center">
                                            <RadioButton 
                                                inputId={`q_${q.id}_c_${i}`} 
                                                name={`q_${q.id}`} 
                                                value={c.choice} 
                                                onChange={(e) => setAnswers({...answers, [q.id]: e.value})} 
                                                checked={answers[q.id] === c.choice} 
                                            />
                                            <label htmlFor={`q_${q.id}_c_${i}`} className="ml-2 cursor-pointer text-gray-700">{c.choice}</label>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <InputTextarea 
                                    rows={4} 
                                    value={answers[q.id] || ''} 
                                    onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} 
                                    placeholder="Type your answer here..."
                                    className="w-full"
                                />
                            )}
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button label="Submit Answers" icon="pi pi-check" onClick={submitQnaAnswers} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg shadow-sm w-auto" />
                </div>
            </Dialog>

            <Toast ref={toast} />
        </div>
    );
};

export default StudentAssignments;
