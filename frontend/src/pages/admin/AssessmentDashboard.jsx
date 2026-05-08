import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { AssessmentService } from '../../services/assessmentService';
import AssessmentSummaryPrintView from './AssessmentSummaryPrintView';

const AssessmentDashboard = () => {
    const { studentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Student data might be passed via state, otherwise fallback to basic UI
    const [student, setStudent] = useState(location.state?.student || { category: 'Category A', stage: '13 - 17' });
    const [results, setResults] = useState([]);
    const [applicableAssessments, setApplicableAssessments] = useState([]);
    const [totalQuestions, setTotalQuestions] = useState(70);
    const [loading, setLoading] = useState(true);
    const [activeFocus, setActiveFocus] = useState('family');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const openSummaryReport = () => {
        window.open('/admin/assessment-dashboard/' + studentId + '/summary-print', '_blank');
    };


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
            setLoading(true);
            Promise.all([
                AssessmentService.getAssessmentResults(studentId),
                AssessmentService.getAssessments()
            ]).then(([resResults, resAllAssessments]) => {
                setResults(resResults);
                
                // Calculate dynamic total questions based on student's category and stage
                const norm = (s) => s ? String(s).replace(/\s+/g, '').toLowerCase() : '';
                const applicable = resAllAssessments.filter(a => {
                    const matchCat = !student.category || norm(a.category) === norm(student.category);
                    const matchStage = !student.stage || norm(a.stage) === norm(student.stage);
                    return matchCat && matchStage;
                });
                
                // Only update totalQuestions if we found applicable ones, otherwise default to a robust number or the length of results if it exceeds
                setApplicableAssessments(applicable);
                const calculatedTotal = applicable.length > 0 ? applicable.length : Math.max(70, resResults.length);
                setTotalQuestions(calculatedTotal);
                
                setLoading(false);
            }).catch(err => {
                console.error("Failed to load results", err);
                setLoading(false);
            });
        }
    }, [studentId, student.category, student.stage]);

    // Calculate scores per area
    const getAreaScore = (areaId) => {
        const areaQuestions = results.filter(r => r.seven_tnt && r.seven_tnt.toLowerCase() === areaId);
        if (areaQuestions.length === 0) {
            return null; // Return null instead of dummy data when unattempted
        }
        
        let totalPoints = 0;
        areaQuestions.forEach(q => {
            totalPoints += parseFloat(q.awarded_grade || 0);
        });
        
        // Use applicable assessments to calculate the true max points for this area
        const applicableAreaQuestions = applicableAssessments.filter(a => a.seven_tnt && a.seven_tnt.toLowerCase() === areaId);
        let maxPoints = 0;
        
        applicableAreaQuestions.forEach(a => {
            const maxGrade = Math.max(
                parseFloat(a.grade_1 || 0),
                parseFloat(a.grade_2 || 0),
                parseFloat(a.grade_3 || 0),
                parseFloat(a.grade_4 || 0),
                parseFloat(a.grade_5 || 0)
            );
            maxPoints += maxGrade;
        });

        // Fallback: if we somehow have answered questions but no applicable assessments, estimate based on answers
        if (maxPoints === 0 && totalPoints > 0) {
            maxPoints = areaQuestions.length * 10; // Fallback estimate
        }
        
        if (maxPoints === 0) return 0;
        
        // Convert to a 25-point scale
        return Math.round((totalPoints / maxPoints) * 25);
    };

    const areaScores = areas.map(area => ({
        ...area,
        score: getAreaScore(area.id)
    }));

    const validScores = areaScores.filter(a => a.score !== null);
    const totalScore = validScores.reduce((sum, a) => sum + a.score, 0);
    const averageScore = validScores.length > 0 ? Math.round(totalScore / validScores.length) : 0;
    
    // Calculate progress percentage dynamically
    const answered = results.length;
    const remaining = Math.max(0, totalQuestions - answered);
    const progressPercent = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0;

    // Filter questions by selected focus area
    const focusQuestions = results.filter(r => r.seven_tnt && r.seven_tnt.toLowerCase() === activeFocus);
    const activeQuestion = focusQuestions[currentQuestionIndex];

    const categories = ['Category A', 'Category B', 'Category C'];
    const stages = [
        { age: '13 - 17', label: 'Stage 1 Category A', stage: '1', cat: 'A' },
        { age: '18 - 22', label: 'Stage 2 Category A', stage: '2', cat: 'A' },
        { age: '23 - 27', label: 'Stage 3 Category A', stage: '3', cat: 'A' },
        { age: '28 - 32', label: 'Stage 4 Category A', stage: '4', cat: 'A' },
        { age: '33 - 37', label: 'Stage 5 Category A', stage: '5', cat: 'A' },
        { age: '38 - 42', label: 'Stage 1 Category B', stage: '1', cat: 'B' },
        { age: '43 - 47', label: 'Stage 2 Category B', stage: '2', cat: 'B' },
        { age: '48 - 52', label: 'Stage 3 Category B', stage: '3', cat: 'B' },
        { age: '53 - 57', label: 'Stage 4 Category B', stage: '4', cat: 'B' },
        { age: '58 - 62', label: 'Stage 5 Category B', stage: '5', cat: 'B' },
        { age: '63 - 67', label: 'Stage 1 Category C', stage: '1', cat: 'C' },
        { age: '68 - 72', label: 'Stage 2 Category C', stage: '2', cat: 'C' },
        { age: '73 - 77', label: 'Stage 3 Category C', stage: '3', cat: 'C' },
        { age: '78 - 82', label: 'Stage 4 Category C', stage: '4', cat: 'C' },
        { age: '83 - 87', label: 'Stage 5 Category C', stage: '5', cat: 'C' },
        { age: '87+', label: 'Out of Range', stage: 'Out of Range', cat: 'Uncategorized' }
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
                            const normCat = (c) => c ? String(c).replace(/category/i, '').trim().toLowerCase() : '';
                            const isSelected = normCat(student.category) === normCat(cat);
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
                        {stages.map((stageObj, idx) => {
                            const normStage = (s) => s ? String(s).replace(/\s+/g, '').toLowerCase() : '';
                            const userCat = student.category ? String(student.category).replace(/category/i, '').trim().toUpperCase() : '';
                            const isSelected = (student.stage === stageObj.stage && userCat === stageObj.cat) || normStage(student.stage) === normStage(stageObj.age);
                            
                            // Add dividers
                            const showDivider = idx === 4 || idx === 9;
                            return (
                                <React.Fragment key={stageObj.age}>
                                    <div className={`py-2 px-2 flex flex-col items-center justify-center text-center rounded-lg cursor-default ${isSelected ? 'bg-[#5E35B1] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <span className={`text-[10px] ${isSelected ? 'font-medium opacity-90' : 'font-bold opacity-60'} leading-tight mb-0.5`}>{stageObj.label}</span>
                                        <span className={`text-sm ${isSelected ? 'font-bold' : 'font-semibold'}`}>{stageObj.age}</span>
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
                                <span className="text-xl font-bold text-[#051220] mb-2">{area.score}/25</span>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${(area.score / 25) * 100}%`, backgroundColor: area.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle: Chart & Summary */}
                <div className="flex flex-col xl:flex-row gap-6 h-auto xl:min-h-[22rem] mb-14">
                    {/* Bar Chart */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-[2] flex flex-col">
                        <h3 className="text-[#1A237E] font-bold text-sm mb-4 uppercase">Transformation Overview</h3>
                        <div className="flex-1 relative mt-4 flex items-end justify-between px-4 pb-10 border-b border-gray-200">
                            {/* Y Axis Labels */}
                            <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-xs font-bold text-gray-400">
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
                            {areaScores.map((area, idx) => {
                                const isAttempted = area.score !== null;
                                const percentage = isAttempted ? Math.round((area.score / 25) * 100) : 0;
                                return (
                                    <div key={idx} className="flex flex-col items-center justify-end h-full relative group" style={{ width: '12%' }}>
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#051220] text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                            {isAttempted ? `${area.score} / 25 Points` : 'Not Attended'}
                                        </div>
                                        {isAttempted && <span className="text-sm font-bold text-gray-700 mb-1">{percentage}%</span>}
                                        {isAttempted && <div className="w-10 md:w-14 rounded-t-md shadow-sm" style={{ height: `${percentage}%`, backgroundColor: area.color }}></div>}
                                        <span className={`absolute -bottom-8 text-xs font-bold text-center w-[150%] ${isAttempted ? 'text-gray-700' : 'text-gray-400'}`}>{area.label.charAt(0) + area.label.slice(1).toLowerCase()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex-1 flex flex-col items-center">
                        <h3 className="text-[#1A237E] font-bold text-sm mb-4 uppercase w-full text-left">Your Summary</h3>
                        
                        {/* Circular Progress */}
                        <div className="w-32 h-32 mb-6 flex items-center justify-center flex-shrink-0">
                            <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="text-[#1E88E5]" strokeDasharray={`${progressPercent}, 100`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="flex flex-col items-center justify-center z-10 pt-1">
                                    <span className="text-2xl font-black text-[#051220] leading-none">{progressPercent}%</span>
                                    <span className="text-xs font-bold text-gray-500 uppercase mt-1">Complete</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex flex-col gap-3">
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Average Score</span>
                                <span className="font-bold text-[#051220]">{averageScore}/25</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Total Questions</span>
                                <span className="font-bold text-[#051220]">{totalQuestions}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Answered</span>
                                <span className="font-bold text-[#051220]">{answered}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                <span className="text-gray-600">Remaining</span>
                                <span className="font-bold text-[#051220]">{remaining}</span>
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
                            {focusQuestions.length} Questions Answered
                        </div>
                    </div>

                    {/* Question Body */}
                    {/* Question Body */}
                    {focusQuestions.length > 0 ? (
                        <div className="flex flex-col gap-0 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {focusQuestions.map((q, idx) => {
                                const choiceText = q[`choice_${q.selected_choice}`] || 'Not Answered';
                                return (
                                    <div key={idx} className="p-6 md:p-8 border-b border-gray-100 last:border-0 flex flex-col gap-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <h2 className="text-[15px] font-bold text-[#051220] flex-1" dangerouslySetInnerHTML={{ __html: `${idx + 1}. ${q.question_text}` }}></h2>
                                            <div className="text-sm font-bold text-[#1976D2] bg-blue-50 px-3 py-1 rounded-md whitespace-nowrap">
                                                {q.awarded_grade || 0} Points
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div className="w-5 h-5 rounded-full border border-[#1976D2] flex flex-shrink-0 items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-[#1976D2] rounded-full"></div>
                                            </div>
                                            <span className="text-sm font-bold text-[#051220]" dangerouslySetInnerHTML={{ __html: choiceText }}></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center text-gray-500 italic">No questions found for the {activeFocus} category.</div>
                    )}

                    {/* Footer Actions */}
                    <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-wrap gap-4 justify-center md:justify-start">
                        <button 
                            onClick={() => window.open('/admin/assessment-dashboard/' + studentId + '/summary-print?action=print', '_blank')}
                            className="flex items-center gap-2 px-8 py-2.5 bg-white border border-gray-200 text-[#1976D2] rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <i className="pi pi-print"></i> PRINT
                        </button>
                        <button 
                            onClick={() => window.open('/admin/assessment-dashboard/' + studentId + '/summary-print?action=share', '_blank')}
                            className="flex items-center gap-2 px-8 py-2.5 bg-white border border-gray-200 text-green-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <i className="pi pi-share-alt"></i> SHARE
                        </button>
                        <button 
                            onClick={openSummaryReport}
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
