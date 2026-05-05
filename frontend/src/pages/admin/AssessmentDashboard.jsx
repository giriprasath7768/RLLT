import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AssessmentService } from '../../services/assessmentService';

const AssessmentDashboard = () => {
    const { studentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Student data might be passed via state, otherwise fallback to basic UI
    const [student, setStudent] = useState(location.state?.student || { category: 'Category A', stage: '13 - 17' });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFocus, setActiveFocus] = useState('family');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const areas = [
        { id: 'family', label: 'FAMILY', icon: 'pi pi-users', color: '#1E88E5' },
        { id: 'finance', label: 'FINANCE', icon: 'pi pi-wallet', color: '#43A047' },
        { id: 'government', label: 'GOVERNMENT', icon: 'pi pi-building', color: '#1976D2' },
        { id: 'spirituality', label: 'SPIRITUALITY', icon: 'pi pi-sun', color: '#FFB300' },
        { id: 'talent', label: 'TALENT', icon: 'pi pi-star-fill', color: '#8E24AA' },
        { id: 'training', label: 'TRAINING', icon: 'pi pi-book', color: '#FB8C00' },
        { id: 'service', label: 'SERVICE', icon: 'pi pi-heart-fill', color: '#E53935' },
    ];

    useEffect(() => {
        if (studentId) {
            AssessmentService.getAssessmentResults(studentId).then(res => {
                setResults(res);
                setLoading(false);
            }).catch(err => {
                console.error("Failed to load results", err);
                setLoading(false);
            });
        }
    }, [studentId]);

    // Calculate scores per area
    const getAreaScore = (areaId) => {
        const areaQuestions = results.filter(r => r.seven_tnt && r.seven_tnt.toLowerCase() === areaId);
        if (areaQuestions.length === 0) {
            // Dummy data as requested for projection when empty
            const dummies = { family: 60, finance: 40, government: 55, spirituality: 70, talent: 45, training: 35, service: 50 };
            return dummies[areaId] || 0;
        }
        
        let totalPoints = 0;
        areaQuestions.forEach(q => {
            totalPoints += parseFloat(q.awarded_grade || 0);
        });
        
        // Assuming each question is max 10 points
        const maxPoints = areaQuestions.length * 10;
        return Math.round((totalPoints / maxPoints) * 100) || 0;
    };

    const areaScores = areas.map(area => ({
        ...area,
        score: getAreaScore(area.id)
    }));

    const totalScore = areaScores.reduce((sum, a) => sum + a.score, 0);
    const averageScore = Math.round(totalScore / 7);
    
    // Calculate progress percentage
    const progressPercent = results.length > 0 ? Math.round((results.length / 70) * 100) : 17; // Dummy 17% if empty

    // Filter questions by selected focus area
    const focusQuestions = results.filter(r => r.seven_tnt && r.seven_tnt.toLowerCase() === activeFocus);
    const activeQuestion = focusQuestions[currentQuestionIndex];

    const categories = ['Category A', 'Category B', 'Category C'];
    const stages = [
        '13 - 17', '18 - 22', '23 - 27', '28 - 32', '33 - 37', 
        '38 - 42', '43 - 47', '48 - 52', '53 - 57', '58 - 62',
        '63 - 67', '68 - 72', '73 - 77', '78 - 82', '83 - 87', '87+'
    ];

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-50"><i className="pi pi-spin pi-spinner text-4xl text-blue-600"></i></div>;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 flex gap-6 w-full max-w-[1600px] mx-auto font-sans">
            
            {/* Left Sidebar */}
            <div className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-6">
                {/* Category Section */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <h3 className="text-gray-500 font-bold text-xs mb-4 uppercase tracking-wider">Category</h3>
                    <div className="flex flex-col gap-2">
                        {categories.map((cat, idx) => {
                            const colors = ['text-purple-600', 'text-green-600', 'text-orange-500'];
                            const isSelected = student.category === cat;
                            return (
                                <div key={cat} className={`flex items-center gap-3 p-3 rounded-xl border ${isSelected ? 'border-purple-200 bg-purple-50 font-bold' : 'border-gray-100 hover:bg-gray-50'}`}>
                                    <i className={`pi pi-users ${colors[idx]}`}></i>
                                    <span className="text-sm text-gray-800">{cat}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Stage Section */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1">
                    <h3 className="text-gray-500 font-bold text-xs mb-4 uppercase tracking-wider">Stage (Age Group)</h3>
                    <div className="flex flex-col">
                        {stages.map((stage, idx) => {
                            const isSelected = student.stage === stage;
                            // Add dividers
                            const showDivider = idx === 4 || idx === 9;
                            return (
                                <React.Fragment key={stage}>
                                    <div className={`py-2 px-4 text-center rounded-lg text-sm cursor-default ${isSelected ? 'bg-[#5E35B1] text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        {stage}
                                    </div>
                                    {showDivider && <div className="h-px bg-gray-100 my-2 mx-4"></div>}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                
                {/* Top: 7 Areas of Transformation */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-[#1A237E] font-bold text-sm mb-4 uppercase">7 Areas of Transformation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
                        {areaScores.map((area) => (
                            <div key={area.id} className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                <i className={`${area.icon} text-2xl mb-2`} style={{ color: area.color }}></i>
                                <span className="text-[10px] font-bold text-gray-400 mb-2">{area.label}</span>
                                <span className="text-xl font-bold text-[#051220] mb-2">{area.score}%</span>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${area.score}%`, backgroundColor: area.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle: Chart & Summary */}
                <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-72 mb-14">
                    {/* Bar Chart */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-[2] flex flex-col">
                        <h3 className="text-[#1A237E] font-bold text-sm mb-4 uppercase">Transformation Overview</h3>
                        <div className="flex-1 relative mt-4 flex items-end justify-between px-4 pb-6 border-b border-gray-200">
                            {/* Y Axis Labels */}
                            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-bold text-gray-400">
                                <span>100</span>
                                <span>75</span>
                                <span>50</span>
                                <span>25</span>
                                <span>0</span>
                            </div>
                            
                            {/* Grid Lines */}
                            <div className="absolute left-6 right-0 top-0 h-px border-t border-dashed border-gray-200"></div>
                            <div className="absolute left-6 right-0 top-1/4 h-px border-t border-dashed border-gray-200"></div>
                            <div className="absolute left-6 right-0 top-2/4 h-px border-t border-dashed border-gray-200"></div>
                            <div className="absolute left-6 right-0 top-3/4 h-px border-t border-dashed border-gray-200"></div>

                            {/* Goal Line */}
                            <div className="absolute right-0 top-0 -mt-2 text-[10px] text-gray-400 font-bold">Goal</div>

                            {/* Bars */}
                            {areaScores.map((area) => (
                                <div key={area.id} className="relative flex flex-col items-center justify-end h-full z-10 w-1/8" style={{ width: '12%' }}>
                                    <span className="text-xs font-bold text-gray-700 mb-1">{area.score}%</span>
                                    <div className="w-8 md:w-10 rounded-t-sm" style={{ height: `${area.score}%`, backgroundColor: area.color }}></div>
                                    <span className="absolute -bottom-5 text-[10px] font-semibold text-gray-500">{area.label.charAt(0) + area.label.slice(1).toLowerCase()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1 flex flex-col relative">
                        <h3 className="text-[#1A237E] font-bold text-sm mb-6 uppercase w-full text-left">Your Summary</h3>
                        
                        <div className="w-full flex flex-col gap-3 mb-6">
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Average Score</span>
                                <span className="font-bold text-[#051220]">{averageScore}%</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Total Questions</span>
                                <span className="font-bold text-[#051220]">70</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Answered</span>
                                <span className="font-bold text-[#051220]">{results.length > 0 ? results.length : 12}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Remaining</span>
                                <span className="font-bold text-[#051220]">{results.length > 0 ? 70 - results.length : 58}</span>
                            </div>
                        </div>

                        {/* Circular Progress */}
                        <div className="absolute -bottom-14 left-1/2 transform -translate-x-1/2 w-28 h-28 bg-[#F8FAFC] rounded-full flex items-center justify-center">
                            <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="text-[#1E88E5]" strokeDasharray={`${progressPercent}, 100`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="flex flex-col items-center justify-center z-10 pt-1">
                                    <span className="text-xl font-black text-[#051220] leading-none">{progressPercent}%</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase mt-1">Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Focus Areas Picker */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-[#1A237E] font-bold text-sm mb-4 uppercase">7 Areas of Transformation <span className="text-xs text-gray-400 font-normal ml-2">(Choose an area to focus)</span></h3>
                    <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
                        {areas.map((area) => (
                            <div 
                                key={area.id} 
                                onClick={() => { setActiveFocus(area.id); setCurrentQuestionIndex(0); }}
                                className={`flex flex-col items-center justify-center py-4 px-2 border rounded-xl cursor-pointer transition-colors ${activeFocus === area.id ? 'border-[#1E88E5] bg-blue-50/30 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                            >
                                <i className={`${area.icon} text-2xl mb-2`} style={{ color: area.color }}></i>
                                <span className="text-[10px] font-bold text-[#1A237E]">{area.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Question Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mb-10">
                    
                    {/* Question Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <div className="bg-[#1976D2] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2">
                            <i className="pi pi-users"></i> {activeFocus.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                            Question {focusQuestions.length > 0 ? currentQuestionIndex + 1 : 0} of {focusQuestions.length}
                        </div>
                        <div className="bg-gray-100 text-[#051220] px-4 py-2 rounded-lg font-bold text-xs">
                            Total Points This Question: {activeQuestion ? activeQuestion.awarded_grade : 0}
                        </div>
                    </div>

                    {/* Question Body */}
                    {activeQuestion ? (
                        <div className="p-6 md:p-8 flex flex-col gap-6">
                            <h2 className="text-lg font-bold text-[#051220]" dangerouslySetInnerHTML={{ __html: activeQuestion.question_text }}></h2>
                            
                            <div className="flex flex-col gap-3">
                                {[1, 2, 3, 4, 5].map(num => {
                                    const choiceText = activeQuestion[`choice_${num}`];
                                    const grade = activeQuestion[`grade_${num}`];
                                    if (!choiceText) return null;
                                    
                                    const isSelected = activeQuestion.selected_choice === String(num);
                                    
                                    return (
                                        <div key={num} className={`flex items-center justify-between p-4 rounded-xl border ${isSelected ? 'border-gray-300 bg-gray-50' : 'border-gray-100 opacity-60'} transition-all`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded-full border flex flex-shrink-0 items-center justify-center ${isSelected ? 'border-[#1976D2]' : 'border-gray-300'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-[#1976D2] rounded-full"></div>}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'font-bold text-[#051220]' : 'text-gray-600'}`} dangerouslySetInnerHTML={{ __html: choiceText }}></span>
                                            </div>
                                            <div className={`text-sm font-bold ${isSelected ? 'text-[#1976D2]' : 'text-gray-400'}`}>
                                                {grade || 0} Points
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {focusQuestions.length > 1 && (
                                <div className="flex justify-between items-center mt-4">
                                    <button 
                                        onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                                        disabled={currentQuestionIndex === 0}
                                        className={`px-4 py-2 rounded font-bold text-sm ${currentQuestionIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#1976D2] hover:bg-blue-50'}`}
                                    >
                                        <i className="pi pi-chevron-left mr-1"></i> Previous
                                    </button>
                                    <button 
                                        onClick={() => setCurrentQuestionIndex(p => Math.min(focusQuestions.length - 1, p + 1))}
                                        disabled={currentQuestionIndex === focusQuestions.length - 1}
                                        className={`px-4 py-2 rounded font-bold text-sm ${currentQuestionIndex === focusQuestions.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-[#1976D2] hover:bg-blue-50'}`}
                                    >
                                        Next <i className="pi pi-chevron-right ml-1"></i>
                                    </button>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="p-10 text-center text-gray-500 italic">No questions found for the {activeFocus} category.</div>
                    )}

                    {/* Footer Actions */}
                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-wrap gap-4 justify-center md:justify-start">
                        <button className="flex items-center gap-2 px-8 py-2.5 bg-white border border-gray-200 text-[#1976D2] rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">
                            <i className="pi pi-print"></i> PRINT
                        </button>
                        <button className="flex items-center gap-2 px-8 py-2.5 bg-white border border-gray-200 text-green-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">
                            <i className="pi pi-share-alt"></i> SHARE
                        </button>
                        <button 
                            onClick={() => window.open('/RLL_Transformation_Assessment_Report.pdf', '_blank')}
                            className="flex items-center gap-2 px-8 py-2.5 bg-white border border-gray-200 text-purple-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <i className="pi pi-chart-bar"></i> SUMMARY
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AssessmentDashboard;
