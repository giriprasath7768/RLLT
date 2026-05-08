import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NavLink, useNavigate } from 'react-router-dom';
import { AssessmentService } from '../../services/assessmentService';
import { StudentService } from '../../services/studentService';
import { useAppSync } from '../../hooks/useAppSync';

import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';

const DashboardStudent = () => {
    const [showReviewAlert, setShowReviewAlert] = useState(false);
    const [stats, setStats] = useState({ marks: null, pendingCharts: 0, stage: 'Explorer', age: 13, category: 'Category' });
    const [assessments, setAssessments] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [responses, setResponses] = useState({});
    const [submittedResponses, setSubmittedResponses] = useState({});
    const [tntStats, setTntStats] = useState({
        Family: { earned: 0, max: 10 },
        Finance: { earned: 0, max: 10 },
        Government: { earned: 0, max: 10 },
        Spirituality: { earned: 0, max: 10 },
        Talent: { earned: 0, max: 10 },
        Training: { earned: 0, max: 10 },
        Service: { earned: 0, max: 10 }
    });
    const [selectedTNT, setSelectedTNT] = useState('Family');
    const navigate = useNavigate();
    const toast = React.useRef(null);

    const tntOptions = React.useMemo(() => {
        if (!assessments || assessments.length === 0) return [];
        const uniqueTNTs = [...new Set(assessments.map(a => String(a.seven_tnt || 'Family').trim()))].filter(Boolean);
        return uniqueTNTs.map(tnt => {
            const label = tnt.charAt(0).toUpperCase() + tnt.slice(1).toLowerCase();
            return { label, value: tnt };
        });
    }, [assessments]);

    // Ensure selectedTNT defaults to a valid option if current selected is not in the list
    useEffect(() => {
        if (tntOptions.length > 0) {
            const exists = tntOptions.find(o => o.value.toLowerCase() === String(selectedTNT).toLowerCase());
            if (!exists) {
                setSelectedTNT(tntOptions[0].value);
                setCurrentQIndex(0);
            }
        }
    }, [tntOptions, selectedTNT]);

    const calculateAge = (dobString) => {
        if (!dobString) return 13;
        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age > 0 ? age : 13;
    };

    const fetchData = async () => {
        try {
            const meRes = await axios.get('http://' + window.location.hostname + ':8000/api/me', { withCredentials: true });
            const chartsRes = await axios.get('http://' + window.location.hostname + ':8000/api/assignments/my', { withCredentials: true });
            const assessmentsData = await AssessmentService.getStudentAssessments();
            const resultsRes = await AssessmentService.getAssessmentResults(meRes.data.id);

            const tntMap = {
                Family: { earned: 0, max: 0 },
                Finance: { earned: 0, max: 0 },
                Government: { earned: 0, max: 0 },
                Spirituality: { earned: 0, max: 0 },
                Talent: { earned: 0, max: 0 },
                Training: { earned: 0, max: 0 },
                Service: { earned: 0, max: 0 }
            };

            assessmentsData.forEach(a => {
                const tnt = a.seven_tnt ? String(a.seven_tnt).trim() : 'Family';
                const key = Object.keys(tntMap).find(k => k.toLowerCase() === tnt.toLowerCase());
                if (key) {
                    const maxGrade = Math.max(
                        parseFloat(a.grade_1 || 0),
                        parseFloat(a.grade_2 || 0),
                        parseFloat(a.grade_3 || 0),
                        parseFloat(a.grade_4 || 0),
                        parseFloat(a.grade_5 || 0)
                    );
                    tntMap[key].max += maxGrade;
                }
            });

            const pastResponses = {};
            resultsRes.forEach(r => {
                pastResponses[r.assessment_id] = String(r.selected_choice);
                const tnt = r.seven_tnt ? String(r.seven_tnt).trim() : 'Family';
                const key = Object.keys(tntMap).find(k => k.toLowerCase() === tnt.toLowerCase());
                if (key) {
                    tntMap[key].earned += parseFloat(r.awarded_grade || 0);
                }
            });
            setTntStats(tntMap);
            setSubmittedResponses(pastResponses);
            setResponses(prev => ({...prev, ...pastResponses}));

            setAssessments(assessmentsData);
            setStats({
                marks: meRes.data.assessment_marks || 0,
                pendingCharts: chartsRes.data.length,
                stage: meRes.data.stage || 'Explorer',
                category: meRes.data.category || 'Category',
                age: calculateAge(meRes.data.dob),
                assessment_status: meRes.data.assessment_status || 'not_started'
            });
        } catch (err) {
            console.error("Error fetching dashboard student data", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useAppSync((data) => {
        // If assessments or user data changes, refresh
        if (data.path && (data.path.includes('/api/assessments') || data.path.includes('/api/students') || data.path.includes('/api/me'))) {
            fetchData();
        }
    });

    const handleChoice = (assessmentId, choice) => {
        if (submittedResponses[assessmentId]) return; // Cannot change after submitting
        
        setResponses(prev => ({
            ...prev,
            [assessmentId]: choice
        }));
    };

    const filteredAssessments = assessments.filter(a => {
        if (!a.seven_tnt) return selectedTNT === 'Family';
        return String(a.seven_tnt).trim().toLowerCase() === selectedTNT.toLowerCase();
    });

    const handleNext = () => {
        if (currentQIndex < filteredAssessments.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQIndex > 0) {
            setCurrentQIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        const payload = {
            responses: filteredAssessments
                .filter(a => !submittedResponses[a.id] && responses[a.id])
                .map(a => ({
                    assessment_id: a.id,
                    choice: parseInt(responses[a.id])
                }))
        };

        if (payload.responses.length === 0) return;

        StudentService.submitAssessment(payload)
            .then(() => {
                toast.current.show({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: `You have successfully completed the ${selectedTNT} assessments!`, 
                    life: 4000 
                });
                fetchData(); // Reload to lock the submitted choices
            })
            .catch(err => {
                console.error("Failed to submit assessment.", err);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to submit assessment.', life: 4000 });
            });
    };

    const handleFinishAndSeeSummary = () => {
        if (stats.assessment_status === 'approved') {
            window.open('/dashboard/student/summary-print', '_blank');
        } else if (stats.assessment_status === 'under_review') {
            setShowReviewAlert(true);
        } else {
            toast.current.show({ 
                severity: 'info', 
                summary: 'Status', 
                detail: 'Your summary is not yet ready or approved. Please ensure all assessments are submitted.', 
                life: 4000 
            });
        }
    };

    const getConvertedScore = (earned, max) => {
        if (!max || max === 0) return 0;
        return Math.round((earned / max) * 25);
    };

    const currentQuestion = filteredAssessments[currentQIndex];
    const totalQuestions = assessments.length || 70;
    const answeredCount = Object.keys(responses).length;
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
    
    // Helper for choice colors
    const getChoiceStyle = (index, isSelected) => {
        const styles = [
            { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-600', icon: 'pi-face-smile text-green-500' },
            { border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-600', icon: 'pi-smile text-blue-500' },
            { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-600', icon: 'pi-meh text-orange-500' },
            { border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-600', icon: 'pi-frown text-purple-500' },
            { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-600', icon: 'pi-times-circle text-red-500' },
        ];
        const base = styles[index % 5];
        return isSelected 
            ? `border-2 ${base.border} ${base.bg} shadow-md transform scale-[1.02] transition-all` 
            : `border-2 border-gray-100 hover:${base.border} hover:bg-gray-50 transition-all`;
    };

    return (
        <div className="w-full h-full flex flex-col justify-start animate-fade-in">
            <Toast ref={toast} />
            <div className="w-full h-full bg-white px-6 py-8 sm:px-10 sm:py-10 relative overflow-hidden">
                {/* Decorative Blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-[#102b4e] rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none"></div>

                {/* New Top Section Layout */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    {/* Combined Card 1 & 2: Category Stage + Areas of Focus */}
                    <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm flex flex-col lg:flex-row flex-[3] overflow-hidden">
                        
                        {/* Category Stage Segment */}
                        <div className="flex-1 py-3 pl-4 pr-2 relative bg-gradient-to-br from-[#f8f9ff] to-[#f3f0ff] flex flex-col justify-center overflow-hidden">
                            {/* Decorative mountain illustration acting as the background image */}
                            <div className="absolute inset-0 pointer-events-none opacity-90 z-0">
                                {/* The user must export the mountain illustration from the design and place it in frontend/public/mountain-illustration.png */}
                                <img src="/mountain-illustration.png" alt="" className="w-full h-full object-cover object-right-bottom opacity-80" />
                            </div>

                            <div className="z-10 relative mb-1">
                                <div className="flex items-center text-[12px] font-bold text-[#1e3a8a] mb-1 whitespace-nowrap">
                                    <i className="pi pi-users mr-1.5 text-blue-600"></i> {stats.category} <span className="text-gray-500 font-medium ml-1 text-[10px]">(Age Group)</span>
                                </div>
                                <h2 className="text-[15px] font-bold text-[#1e1b4b] mb-1.5 tracking-tight">{stats.stage} Stage</h2>
                                <div className="inline-block bg-[#8B5CF6] text-white text-[11px] font-bold px-3 py-1 rounded-3xl mb-1 shadow-sm">
                                    Age: {stats.age} Years
                                </div>
                            </div>
                            <div className="text-[11px] font-bold text-gray-700 z-10 relative mt-1 leading-tight">
                                Keep Exploring,<br/>Keep Growing! 🚀
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden lg:block w-px bg-gray-100 my-6"></div>
                        <div className="lg:hidden h-px bg-gray-100 mx-6"></div>

                        {/* Areas of Focus Segment */}
                        <div className="flex-[2] p-4 flex flex-col items-center justify-center">
                            <div className="flex items-center text-[#102b4e] font-bold mb-4 text-[18px]">
                                <span className="mr-2 text-xl">🎯</span> Choose an Area to Focus On
                            </div>
                            
                            <div className="flex w-full justify-between gap-2 px-2 overflow-x-auto pb-2 custom-scrollbar">
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group/icon hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-gradient-to-br from-[#FF6B4A] to-[#FF512F] flex items-center justify-center shadow-md shadow-orange-200/50">
                                        <i className="pi pi-home text-white text-xl drop-shadow-sm"></i>
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-700">Family</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group/icon hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-gradient-to-br from-[#11998E] to-[#38EF7D] flex items-center justify-center shadow-md shadow-green-200/50">
                                        <i className="pi pi-dollar text-white text-xl drop-shadow-sm"></i>
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-700">Finance</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group/icon hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-gradient-to-br from-[#1E88E5] to-[#1565C0] flex items-center justify-center shadow-md shadow-blue-200/50">
                                        <i className="pi pi-building text-white text-xl drop-shadow-sm"></i>
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-700">Government</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group/icon hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0] flex items-center justify-center shadow-md shadow-purple-200/50">
                                        <i className="pi pi-sun text-white text-xl drop-shadow-sm"></i>
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-700">Spirituality</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group/icon hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-gradient-to-br from-[#FFC837] to-[#FF8008] flex items-center justify-center shadow-md shadow-yellow-200/50">
                                        <i className="pi pi-star-fill text-white text-xl drop-shadow-sm"></i>
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-700">Talent</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group/icon hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-gradient-to-br from-[#00B4DB] to-[#0083B0] flex items-center justify-center shadow-md shadow-cyan-200/50">
                                        <i className="pi pi-book text-white text-xl drop-shadow-sm"></i>
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-700">Training</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1.5 cursor-pointer group/icon hover:-translate-y-1 transition-transform">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[1rem] bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] flex items-center justify-center shadow-md shadow-pink-200/50">
                                        <i className="pi pi-heart-fill text-white text-xl drop-shadow-sm"></i>
                                    </div>
                                    <span className="text-[12px] font-bold text-gray-700">Service</span>
                                </div>
                            </div>
                            
                            <div className="text-[13px] text-gray-500 font-medium mt-2">
                                Focus on one area at a time and transform your life! <i className="pi pi-arrow-up-right text-blue-500 ml-1 text-[12px]"></i>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Total Points */}
                    <div className="bg-white border border-gray-100 rounded-[2rem] p-4 shadow-sm flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-50 rounded-full opacity-50 blur-xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-50 rounded-full opacity-50 blur-lg"></div>
                        
                        <div className="flex items-center text-[#102b4e] font-bold mb-2 w-full justify-center z-10 text-[15px]">
                            <span className="mr-1.5 text-lg">🏆</span> Total Points
                        </div>
                        
                        <div className="flex items-center justify-center gap-2 my-2 z-10">
                            <span className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] tracking-tighter">
                                {stats.marks || 0}
                            </span>
                            <span className="text-4xl drop-shadow-lg transform -rotate-12 hover:rotate-12 transition-transform cursor-default">⭐️</span>
                        </div>
                        
                        <div className="text-[11px] text-gray-600 font-semibold text-center z-10 mt-1">
                            Keep it up! You're doing great!
                        </div>
                    </div>
                </div>

                {/* Main Content & Sidebar Wrapper */}
                <div className="flex flex-col lg:flex-row gap-4 xl:gap-6 mb-10">
                    
                    {/* Left: Main Assessment Area */}
                    <div className="flex-[3] flex flex-col gap-6 overflow-hidden">
                        {currentQuestion ? (
                            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-8 relative overflow-hidden flex flex-col">
                                {/* Top Header Row */}
                                <div className="flex flex-col gap-4 mb-6">
                                    <div className="flex justify-start gap-1 sm:gap-2 pb-2">
                                        {tntOptions.map((tab) => {
                                            const isActive = selectedTNT === tab.value;
                                            const v = tab.value.toLowerCase();
                                            let gradient = 'bg-[#1048b3]';
                                            if (v === 'family') gradient = 'bg-gradient-to-br from-[#FF6B4A] to-[#FF512F] shadow-orange-200/50';
                                            else if (v === 'finance') gradient = 'bg-gradient-to-br from-[#11998E] to-[#38EF7D] shadow-green-200/50';
                                            else if (v === 'government') gradient = 'bg-gradient-to-br from-[#1E88E5] to-[#1565C0] shadow-blue-200/50';
                                            else if (v === 'spirituality') gradient = 'bg-gradient-to-br from-[#8E2DE2] to-[#4A00E0] shadow-purple-200/50';
                                            else if (v === 'talent') gradient = 'bg-gradient-to-br from-[#FFC837] to-[#FF8008] shadow-yellow-200/50';
                                            else if (v === 'training') gradient = 'bg-gradient-to-br from-[#00B4DB] to-[#0083B0] shadow-cyan-200/50';
                                            else if (v === 'service') gradient = 'bg-gradient-to-br from-[#FF416C] to-[#FF4B2B] shadow-pink-200/50';
                                            
                                            return (
                                                <button
                                                    key={tab.value}
                                                    onClick={() => {
                                                        setSelectedTNT(tab.value);
                                                        setCurrentQIndex(0);
                                                    }}
                                                    className={`px-2 py-1.5 rounded-lg font-bold text-[10px] sm:text-xs whitespace-nowrap transition-all flex items-center gap-1 text-white ${gradient} ${
                                                        isActive 
                                                        ? 'shadow-md scale-105' 
                                                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                                                    }`}
                                                >
                                                    <i className={`pi ${v === 'family' ? 'pi-home' : v === 'finance' ? 'pi-dollar' : v === 'government' ? 'pi-building' : v === 'spirituality' ? 'pi-sun' : v === 'talent' ? 'pi-star-fill' : v === 'training' ? 'pi-book' : 'pi-heart-fill'}`}></i>
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center w-full border-t border-gray-100 pt-4">
                                        <div className="text-[#1048b3] font-bold text-lg">
                                            {selectedTNT} Questions
                                        </div>
                                        <div className="text-gray-500 font-semibold text-sm">
                                            Question {currentQIndex + 1} of {filteredAssessments.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div className="mb-8">
                                    <p className="text-[17px] font-bold text-[#1e1b4b] leading-relaxed" dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }}></p>
                                </div>

                                {/* Choices List */}
                                <div className="flex flex-col gap-3 mb-8">
                                    {[1, 2, 3, 4, 5].map((num) => {
                                        const choiceText = currentQuestion[`choice_${num}`];
                                        if (!choiceText) return null;
                                        
                                        const isSelected = responses[currentQuestion.id] === String(num);
                                        
                                        const isLocked = !!submittedResponses[currentQuestion.id];
                                        
                                        return (
                                            <div 
                                                key={num}
                                                onClick={() => handleChoice(currentQuestion.id, String(num))}
                                                className={`flex items-center p-4 rounded-xl border transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 bg-white'} ${isLocked ? (isSelected ? 'cursor-default' : 'opacity-50 cursor-not-allowed') : (!isSelected ? 'hover:border-gray-300 cursor-pointer' : 'cursor-pointer')}`}
                                            >
                                                <div className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center mr-4 ${isSelected ? 'border-blue-500' : 'border-gray-300'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                                                </div>
                                                <span className={`text-[14px] ${isSelected ? 'font-bold text-[#1e1b4b]' : 'font-medium text-gray-600'}`} dangerouslySetInnerHTML={{ __html: choiceText }}></span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Navigation Footer */}
                                <div className="flex justify-between items-center mt-auto border-t border-gray-100 pt-6">
                                    <button 
                                        onClick={handlePrev}
                                        disabled={currentQIndex === 0}
                                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${currentQIndex === 0 ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed border-2' : 'text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <i className="pi pi-arrow-left"></i> Previous
                                    </button>
                                    
                                    {currentQIndex === filteredAssessments.length - 1 ? (
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={filteredAssessments.length > 0 && filteredAssessments.every(a => submittedResponses[a.id])}
                                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${filteredAssessments.length > 0 && filteredAssessments.every(a => submittedResponses[a.id]) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-xl hover:-translate-y-0.5'}`}
                                        >
                                            {filteredAssessments.length > 0 && filteredAssessments.every(a => submittedResponses[a.id]) ? 'Completed' : 'Submit Test'} <i className="pi pi-check"></i>
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleNext}
                                            className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-indigo-200 hover:shadow-xl transition-all hover:-translate-y-0.5"
                                        >
                                            Next <i className="pi pi-arrow-right"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-10 text-center flex flex-col items-center justify-center min-h-[400px]">
                                <i className="pi pi-check-circle text-6xl text-green-400 mb-4"></i>
                                <h2 className="text-2xl font-bold text-[#1e1b4b] mb-2">You're all caught up!</h2>
                                <p className="text-gray-500">No active assessments available for you right now.</p>
                            </div>
                        )}

                        {/* Bottom Banner */}
                        <div className="bg-gradient-to-r from-[#fdf2f8] via-[#f5f3ff] to-[#fff1f2] border border-pink-100 rounded-[2rem] shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                            {/* Decorative sun */}
                            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-gradient-to-tr from-yellow-400 to-orange-400 rounded-full blur-2xl opacity-30"></div>
                            
                            <div className="flex items-center gap-6 z-10">
                                <div className="hidden sm:flex text-6xl drop-shadow-md relative">
                                    ⛰️<span className="absolute -top-2 right-0 text-3xl">🧗‍♀️</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#1e1b4b] mb-1">You are on your way to a better you!</h3>
                                    <p className="text-gray-600 font-medium">Complete the assessment and unlock your true potential.</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleFinishAndSeeSummary}
                                className="z-10 whitespace-nowrap px-8 py-4 rounded-xl font-bold flex items-center gap-3 bg-gradient-to-r from-[#FF6B4A] to-[#FF512F] text-white shadow-lg shadow-orange-200 hover:shadow-xl transition-all hover:-translate-y-0.5"
                            >
                                <i className="pi pi-gift text-xl"></i> 
                                <div className="flex flex-col text-left leading-tight">
                                    <span>Finish & See</span>
                                    <span>Your Summary</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Right: Sidebar */}
                    <div className="flex-1 flex flex-col gap-6">
                        
                        {/* Your Progress */}
                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6 text-blue-600 font-bold text-lg">
                                <i className="pi pi-chart-bar text-xl"></i> Your Progress
                            </div>
                            
                            <div className="mb-5">
                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                    <span>Questions Answered</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-[#1e1b4b] whitespace-nowrap">{answeredCount} / {totalQuestions}</span>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">{progressPercent}%</span>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                    <span>Points Earned</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-[#1e1b4b] whitespace-nowrap">{stats.marks} / 700</span>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min(100, (stats.marks/700)*100)}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400">{Math.round((stats.marks/700)*100)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* 7 Areas Overview */}
                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6">
                            <div className="text-[#1e1b4b] font-bold text-lg mb-6">7 Areas Overview</div>
                            
                            <div className="flex gap-4">
                                <div className="flex-1 flex flex-col gap-3 min-w-0">
                                    <div className="flex items-center justify-between text-[13px] font-bold">
                                        <div className="flex items-center gap-2 truncate"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#FF6B4A]"></div><span className="text-gray-700 truncate">Family</span></div>
                                        <span className="text-gray-600 flex-shrink-0 ml-2">{getConvertedScore(tntStats.Family.earned, tntStats.Family.max)} / 25</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px] font-bold">
                                        <div className="flex items-center gap-2 truncate"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#11998E]"></div><span className="text-gray-700 truncate">Finance</span></div>
                                        <span className="text-gray-600 flex-shrink-0 ml-2">{getConvertedScore(tntStats.Finance.earned, tntStats.Finance.max)} / 25</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px] font-bold">
                                        <div className="flex items-center gap-2 truncate"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#1E88E5]"></div><span className="text-gray-700 truncate">Government</span></div>
                                        <span className="text-gray-600 flex-shrink-0 ml-2">{getConvertedScore(tntStats.Government.earned, tntStats.Government.max)} / 25</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px] font-bold">
                                        <div className="flex items-center gap-2 truncate"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#8E2DE2]"></div><span className="text-gray-700 truncate">Spirituality</span></div>
                                        <span className="text-gray-600 flex-shrink-0 ml-2">{getConvertedScore(tntStats.Spirituality.earned, tntStats.Spirituality.max)} / 25</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px] font-bold">
                                        <div className="flex items-center gap-2 truncate"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#FFC837]"></div><span className="text-gray-700 truncate">Talent</span></div>
                                        <span className="text-gray-600 flex-shrink-0 ml-2">{getConvertedScore(tntStats.Talent.earned, tntStats.Talent.max)} / 25</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px] font-bold">
                                        <div className="flex items-center gap-2 truncate"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#00B4DB]"></div><span className="text-gray-700 truncate">Training</span></div>
                                        <span className="text-gray-600 flex-shrink-0 ml-2">{getConvertedScore(tntStats.Training.earned, tntStats.Training.max)} / 25</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[13px] font-bold">
                                        <div className="flex items-center gap-2 truncate"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-[#FF416C]"></div><span className="text-gray-700 truncate">Service</span></div>
                                        <span className="text-gray-600 flex-shrink-0 ml-2">{getConvertedScore(tntStats.Service.earned, tntStats.Service.max)} / 25</span>
                                    </div>
                                </div>
                                
                                <div className="w-20 flex items-center justify-center">
                                    {/* CSS Pie Chart Placeholder matching screenshot colors */}
                                    <div className="w-16 h-16 rounded-full border-[6px] border-gray-100 shadow-inner overflow-hidden relative"
                                         style={{background: 'conic-gradient(#FF6B4A 0% 14%, #11998E 14% 28%, #1E88E5 28% 42%, #8E2DE2 42% 57%, #FFC837 57% 71%, #00B4DB 71% 85%, #FF416C 85% 100%)'}}>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6 text-blue-600 font-bold text-lg">
                                <i className="pi pi-info-circle text-xl"></i> Quick Info
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 text-gray-400"><i className="pi pi-list"></i></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#1e1b4b] mb-0.5">Assessment Type</span>
                                        <span className="text-xs text-gray-500 font-medium">Transformation Gap Assessment</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 text-gray-400"><i className="pi pi-compass"></i></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#1e1b4b] mb-0.5">Programme</span>
                                        <span className="text-xs text-gray-500 font-medium">Gap Growth Assessment Programme</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 text-gray-400"><i className="pi pi-book"></i></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#1e1b4b] mb-0.5">Topic</span>
                                        <span className="text-xs text-gray-500 font-medium">Day to Day Transformation</span>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 text-gray-400"><i className="pi pi-calendar"></i></div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#1e1b4b] mb-0.5">Date</span>
                                        <span className="text-xs text-gray-500 font-medium">04 / 05 / 2026</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Under Review Alert Dialog */}
            <Dialog 
                visible={showReviewAlert} 
                onHide={() => setShowReviewAlert(false)} 
                header={null}
                className="w-full max-w-md mx-4"
                contentClassName="p-0 rounded-3xl"
                showHeader={false}
            >
                <div className="bg-white rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-4 right-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setShowReviewAlert(false)}>
                        <i className="pi pi-times"></i>
                    </div>
                    <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                        <i className="pi pi-clock text-4xl text-yellow-500"></i>
                    </div>
                    
                    <h2 className="text-3xl font-black text-[#051220] mb-4 tracking-tight">Under Review</h2>
                    
                    <p className="text-gray-500 leading-relaxed mb-8">
                        Your assessment test has been submitted successfully and is currently under review by an administrator. Once approved, you will be granted access to your full summary.
                    </p>
                    
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 font-bold text-[#051220] flex items-center gap-2 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <i className="pi pi-refresh"></i> Refresh Status
                    </button>
                </div>
            </Dialog>
        </div>
    );
};

export default DashboardStudent;
