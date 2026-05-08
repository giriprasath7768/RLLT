import React, { useState, useEffect } from 'react';
import { calculateStudentLevel } from '../../utils/studentUtils';

const AssessmentSummaryPrintView = ({ student, results, summarySettings, applicableAssessments = [] }) => {
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [shareReadyFile, setShareReadyFile] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (action === 'print') {
            handlePrint();
        } else if (action === 'share') {
            handleShare();
        }
    }, []);

    const generatePdf = async () => {
        if (!window.html2canvas) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        if (!window.jspdf) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        const jsPDF = window.jspdf.jsPDF;
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pages = document.querySelectorAll('.print-page');
        
        for (let i = 0; i < pages.length; i++) {
            const canvas = await window.html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            if (i > 0) pdf.addPage();
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        return pdf;
    };

    const handlePrint = async () => {
        try {
            setIsGeneratingPdf(true);
            const pdf = await generatePdf();
            pdf.autoPrint();
            const blobUrl = pdf.output('bloburl');
            window.location.href = blobUrl;
        } catch (error) {
            console.error("Error generating print PDF:", error);
            alert("Failed to prepare the document for printing.");
            setIsGeneratingPdf(false); // Only set false if it fails, otherwise let it navigate away
        }
    };

    const handleShare = async () => {
        try {
            setIsGeneratingPdf(true);
            
            const pdf = await generatePdf();
            const pdfBlob = pdf.output('blob');
            const fileName = `Assessment_Summary_${student?.name?.replace(/\s+/g, '_') || 'Candidate'}.pdf`;
            const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
            
            setShareReadyFile(file);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to process the document.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const executeNativeShare = async () => {
        if (!shareReadyFile) return;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Assessment Summary',
                    text: 'Please find the Assessment Summary attached.',
                    files: [shareReadyFile]
                });
            }
        } catch (error) {
            console.warn("Native share failed:", error);
        }
    };

    const downloadFile = () => {
        if (!shareReadyFile) return;
        const url = URL.createObjectURL(shareReadyFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = shareReadyFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

    const getAreaScore = (areaId) => {
        const areaQuestions = results.filter(r => r.seven_tnt && r.seven_tnt.toLowerCase() === areaId);
        if (areaQuestions.length === 0) return null;
        
        let totalPoints = 0;
        areaQuestions.forEach(q => {
            totalPoints += parseFloat(q.awarded_grade || 0);
        });
        
        const applicableAreaQuestions = applicableAssessments.filter(a => a.seven_tnt && a.seven_tnt.toLowerCase() === areaId);
        let maxPoints = 0;
        applicableAreaQuestions.forEach(a => {
            const maxGrade = Math.max(
                parseFloat(a.grade_1 || 0), parseFloat(a.grade_2 || 0), parseFloat(a.grade_3 || 0),
                parseFloat(a.grade_4 || 0), parseFloat(a.grade_5 || 0)
            );
            maxPoints += maxGrade;
        });

        if (maxPoints === 0 && totalPoints > 0) {
            maxPoints = areaQuestions.length * 10;
        }
        
        if (maxPoints === 0) return 0;
        return Math.round((totalPoints / maxPoints) * 25);
    };

    const getSummaryFeedback = (areaId, score) => {
        if (!summarySettings || !summarySettings[areaId]) return "No summary feedback configured for this area.";
        const settings = summarySettings[areaId];
        
        const checkRange = (rangeStr) => {
            if (!rangeStr) return false;
            const parts = rangeStr.split('-');
            if (parts.length === 2) {
                const min = parseInt(parts[0].trim());
                const max = parseInt(parts[1].trim());
                return score >= min && score <= max;
            }
            return false;
        };

        if (checkRange(settings.low?.range)) return settings.low?.desc || "Low range";
        if (checkRange(settings.moderate?.range)) return settings.moderate?.desc || "Moderate range";
        if (checkRange(settings.high?.range)) return settings.high?.desc || "High range";

        return settings.description || "No specific feedback available for your score.";
    };

    // Process areas
    const processedAreas = areas.map(area => {
        const score = getAreaScore(area.id);
        const level = score === null ? 'UNATTENDED' : (score >= 21 ? 'HIGH' : (score >= 13 ? 'MODERATE' : 'LOW'));
        return { ...area, score, level };
    });
    
    const validAreas = processedAreas.filter(a => a.score !== null);
    const sortedByScore = [...validAreas].sort((a, b) => a.score - b.score);
    const lowestAreas = sortedByScore.slice(0, 3);
    const highestAreas = sortedByScore.slice(-2).reverse();

    const totalOverallScore = validAreas.reduce((sum, a) => sum + a.score, 0);
    const maxPossibleScore = validAreas.length > 0 ? validAreas.length * 25 : 175;
    const percentage = validAreas.length > 0 ? Math.round((totalOverallScore / maxPossibleScore) * 100) : 0;
    const averageScore = validAreas.length > 0 ? Math.round(totalOverallScore / validAreas.length) : 0;


    const levelColor = (level) => {
        if (level === 'UNATTENDED') return '#9E9E9E';
        if (level === 'HIGH') return '#43A047';
        if (level === 'LOW') return '#E53935';
        return '#FB8C00';
    };

    return (
        <div className="bg-gray-100 min-h-screen pb-10 print:pb-0 print:bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
            <style>
                {`
                    @media print {
                        body, html { width: 100%; height: 100%; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .print-page { 
                            width: 210mm !important; 
                            min-height: 297mm !important; 
                            margin: 0 auto !important; 
                            padding: 0 !important; 
                            border: none !important; 
                            box-shadow: none !important; 
                            background: white !important; 
                            page-break-after: always !important; 
                            page-break-inside: avoid !important;
                            position: relative !important;
                            box-sizing: border-box !important;
                        }
                        .no-print { display: none !important; }
                        @page { margin: 0; size: A4 portrait; }
                    }
                    .print-page {
                        width: 210mm;
                        min-height: 297mm;
                        background: white;
                        margin: 20px auto;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        position: relative;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                `}
            </style>

            {isGeneratingPdf && (
                <div className="fixed inset-0 bg-white/90 z-[100] flex flex-col items-center justify-center no-print">
                    <i className="pi pi-spin pi-spinner text-6xl text-[#1A237E] mb-6"></i>
                    <h2 className="text-3xl font-black text-[#1A237E] mb-2 tracking-tight">Generating PDF...</h2>
                    <p className="text-gray-600 text-lg font-medium">Preparing document for sharing. This may take a moment.</p>
                </div>
            )}

            {shareReadyFile && (
                <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center no-print p-6">
                    <i className="pi pi-check-circle text-6xl text-green-500 mb-6"></i>
                    <h2 className="text-3xl font-black text-[#1A237E] mb-2 tracking-tight text-center">Report Ready to Share</h2>
                    <p className="text-gray-600 text-lg font-medium mb-8 text-center max-w-md">The PDF has been generated successfully. Choose how you would like to share it below.</p>
                    
                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        {/* Native OS Share (if supported) */}
                        {navigator.canShare && navigator.canShare({ files: [shareReadyFile] }) && (
                            <button onClick={executeNativeShare} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow transition-colors flex items-center justify-center gap-3 text-lg w-full">
                                <i className="pi pi-share-alt"></i> Share via Device
                            </button>
                        )}
                        
                        <button onClick={() => {
                            downloadFile();
                            window.open('https://wa.me/?text=' + encodeURIComponent('Here is my Assessment Summary. I have attached the PDF document.'), '_blank');
                        }} className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-6 rounded-xl shadow transition-colors flex items-center justify-center gap-3 text-lg w-full">
                            <i className="pi pi-whatsapp"></i> Share via WhatsApp
                        </button>
                        
                        <button onClick={() => {
                            downloadFile();
                            window.location.href = `mailto:?subject=Assessment Summary&body=Please find my Assessment Summary attached. (Ensure you attach the downloaded PDF file)`;
                        }} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-xl shadow transition-colors flex items-center justify-center gap-3 text-lg w-full">
                            <i className="pi pi-envelope"></i> Share via Email
                        </button>

                        <button onClick={downloadFile} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-xl shadow transition-colors flex items-center justify-center gap-3 text-lg w-full mt-2">
                            <i className="pi pi-download"></i> Download PDF Only
                        </button>
                    </div>

                    <button onClick={() => setShareReadyFile(null)} className="mt-8 text-gray-500 hover:text-gray-800 font-semibold underline">
                        Cancel
                    </button>
                </div>
            )}

            {/* Page 1: Cover */}
            <div className="print-page flex flex-col justify-center items-center text-center p-16 relative bg-white">
                <div className="absolute top-[60%] left-0 w-full h-[3px] bg-[#D1B85D]"></div>
                
                <div className="relative z-10 flex flex-col items-center gap-4 mb-20 w-full">
                    <h1 className="text-[55px] font-black tracking-tight leading-[1.1] text-black">REAL LIFE<br/>LEADERSHIP TRAINING</h1>
                    <h2 className="text-[32px] font-bold text-[#D1B85D] mt-6">7 AREAS OF TRANSFORMATION</h2>
                    <h3 className="text-2xl mt-2 font-light tracking-wide text-black">Personal Assessment Report</h3>
                    
                    <div className="mt-20 text-xl flex flex-col items-center">
                        <p className="font-bold text-3xl mb-2 text-black">{student.name || 'Sample Candidate'}</p>
                        <p className="text-gray-700">Age {calculateStudentLevel(student.dob).age || 15} &middot; Cohort 1 - 2026 &middot; {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
                
                <div className="relative z-10 border-t border-[#D1B85D] pt-6 mt-8 w-full flex flex-col items-center">
                    <h4 className="text-xl font-bold text-[#D1B85D]">40-DAY TRANSFORMATION JOURNEY</h4>
                    <p className="text-sm mt-2 text-gray-700 tracking-widest uppercase">Biblical Foundation &middot; Personal Coaching &middot; Life Transformation</p>
                </div>
            </div>

            {/* Page 2: Intro */}
            <div className="print-page p-16 flex flex-col relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-[#0B152A]"></div>
                <div className="absolute top-8 left-0 w-full h-2 bg-[#D1B85D]"></div>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-[#0B152A]"></div>
                
                <h1 className="text-4xl font-bold text-[#1A237E] mt-12 mb-6 border-b-2 border-gray-200 pb-4">Introduction: Your Transformation Journey</h1>
                
                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    Welcome to the Real Life Leadership Training – 7 Areas of Transformation Assessment. This report is the
                    beginning of a 40-day journey that will help you discover who you truly are, where you are right now, and where
                    God is calling you to go. This is not a test with right or wrong answers. It is a mirror — an honest, compassionate
                    look at seven dimensions of your life that shape who you are becoming.
                </p>

                <h2 className="text-2xl font-bold text-[#1A237E] mb-4">Three Foundation Questions</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                    Before your full assessment, every journey begins with three defining questions. These mirror the question God
                    asked Adam in the Garden of Eden — not because He did not know the answer, but because He wanted Adam
                    to become honest about his own reality. These questions create the gap — the space between where you are
                    and where you could be.
                </p>

                <div className="flex flex-col gap-6 mb-10">
                    <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-orange-50 w-24 flex items-center justify-center border-r-4 border-orange-400">
                            <span className="text-3xl font-black text-orange-400">01</span>
                        </div>
                        <div className="p-6 flex-1">
                            <h3 className="text-xl font-bold text-[#1A237E] mb-2">Where are you?</h3>
                            <p className="text-gray-700 leading-relaxed">This question looks at your current reality — your home, your habits, your hopes, and your hurts. Like God asking Adam in the Garden, this is not a question of geography but of honesty. Where are you, really?</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-orange-50 w-24 flex items-center justify-center border-r-4 border-orange-400">
                            <span className="text-3xl font-black text-orange-400">02</span>
                        </div>
                        <div className="p-6 flex-1">
                            <h3 className="text-xl font-bold text-[#1A237E] mb-2">Who told you?</h3>
                            <p className="text-gray-700 leading-relaxed">Every young person is shaped by voices — parents, peers, culture, media, pain, and experience. Some of those voices have told you truth. Others have given you a false identity. This question helps us identify which voices are guiding your life — and whether they deserve that authority.</p>
                        </div>
                    </div>
                    <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-orange-50 w-24 flex items-center justify-center border-r-4 border-orange-400">
                            <span className="text-3xl font-black text-orange-400">03</span>
                        </div>
                        <div className="p-6 flex-1">
                            <h3 className="text-xl font-bold text-[#1A237E] mb-2">What have you done?</h3>
                            <p className="text-gray-700 leading-relaxed">This question is not about guilt — it is about direction. What decisions have you made so far? What path are you currently on? Are you moving toward your purpose or away from it? Honest reflection here creates the foundation for real change.</p>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-[#1A237E] mb-4">The Seven Areas of Transformation</h2>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 grid grid-cols-2 gap-4">
                    {areas.map(area => (
                        <div key={area.id} className="flex items-center gap-3 font-bold text-gray-800">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: area.color }}></div>
                            {area.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pages 3-9: 7 Areas */}
            {processedAreas.map((area, idx) => {
                const feedback = getSummaryFeedback(area.id, area.score);
                const questions = results.filter(r => r.seven_tnt && r.seven_tnt.toLowerCase() === area.id.toLowerCase());
                
                return (
                    <div key={area.id} className="print-page p-16 flex flex-col relative">
                        <div className="absolute top-0 left-0 w-full h-8 bg-[#0B152A]"></div>
                        <div className="absolute top-8 left-0 w-full h-2 bg-[#D1B85D]"></div>
                        <div className="absolute bottom-0 left-0 w-full h-12 bg-[#0B152A]"></div>
                        
                        <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-t-xl mt-12 border-b-2 border-gray-200 mb-6">
                            <h2 className="text-3xl font-black uppercase flex items-center gap-4" style={{ color: area.color }}>
                                <i className={area.icon}></i> {area.label}
                            </h2>
                            <div className="text-3xl font-bold" style={{ color: area.color }}>Score: {area.score !== null ? `${area.score}/25` : 'Not Attended'}</div>
                        </div>
                        
                        {area.score !== null ? (
                            <div className="flex items-center gap-6 mb-8 px-4">
                                <span className="font-bold text-gray-700 text-lg">Progress:</span>
                                <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full" style={{ width: `${(area.score/25)*100}%`, backgroundColor: area.color }}></div>
                                </div>
                                <span className="font-black text-lg w-28 text-right" style={{ color: levelColor(area.level) }}>{area.level}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 mb-8 px-4">
                                <span className="font-bold text-gray-500 text-lg italic">This area was not attended by the student.</span>
                            </div>
                        )}
                        
                        <h3 className="text-xl font-bold text-[#1A237E] border-b-2 border-[#1A237E] pb-2 mb-4">Assessment Questions</h3>
                        
                        <div className="flex flex-col gap-3 mb-auto">
                            {questions.length > 0 ? questions.map((q, qIdx) => (
                                <div key={qIdx} className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                                    <div className="bg-[#EBF1F8] p-3 flex gap-4 border-b border-gray-200">
                                        <span className="font-black text-[#1A237E] w-6">Q{qIdx + 1}</span>
                                        <span className="font-bold text-gray-800" dangerouslySetInnerHTML={{ __html: q.question_text }}></span>
                                    </div>
                                    <div className="p-3 bg-white pl-14">
                                        <span className="text-sm font-medium text-gray-700" dangerouslySetInnerHTML={{ __html: q[`choice_${q.selected_choice}`] || 'Not Answered' }}></span>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-gray-500 italic border border-gray-200 rounded-lg bg-gray-50">No questions answered for this area.</div>
                            )}
                        </div>
                        
                        <div className="mt-8 flex rounded-lg overflow-hidden border-l-4 border border-gray-200 shadow-sm" style={{ borderLeftColor: levelColor(area.level) }}>
                            <div className="bg-red-50/50 p-6 w-1/4 flex flex-col justify-center items-center text-center border-r border-gray-200">
                                <h4 className="font-bold text-red-600 text-sm tracking-widest uppercase mb-1">Your Result</h4>
                                <h4 className="font-black text-red-600 text-2xl">{area.level}</h4>
                            </div>
                            <div className="bg-red-50/20 p-6 flex-1 text-gray-800 text-base leading-relaxed italic flex items-center">
                                {feedback}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Page 10: Dashboard */}
            <div className="print-page p-16 flex flex-col relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-[#0B152A]"></div>
                <div className="absolute top-8 left-0 w-full h-2 bg-[#D1B85D]"></div>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-[#0B152A]"></div>
                
                <h1 className="text-4xl font-bold text-[#1A237E] mt-12 mb-4 border-b-2 border-[#D1B85D] pb-4">Personal Transformation Dashboard</h1>
                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    This dashboard provides a complete overview of your 7 Areas of Transformation scores. It is designed to give you and your coach an immediate picture of where you are thriving and where focused development is needed. No area is without hope — every score is a starting point, not a verdict.
                </p>
                
                <div className="flex bg-[#0B152A] text-white rounded-lg overflow-hidden mb-10 shadow-lg border border-gray-800">
                    <div className="flex-[1.5] p-8 flex flex-col justify-center items-center border-r border-gray-600 bg-[#0F1E3B]">
                        <span className="text-lg font-bold tracking-widest text-center leading-tight">OVERALL TRANSFORMATION<br/>SCORE</span>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center border-r border-gray-600 bg-[#122340]">
                        <span className="text-6xl font-black text-[#D1B85D]">{totalOverallScore}/{maxPossibleScore}</span>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center bg-[#15284A]">
                        <span className="text-5xl font-bold text-white">{percentage}%</span>
                    </div>
                </div>
                
                <h3 className="text-2xl font-bold text-[#1A237E] mb-4">Domain Score Breakdown</h3>
                
                <table className="w-full text-left border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-[#0B152A] text-white text-base">
                            <th className="p-4 font-bold border-r border-gray-600">Domain</th>
                            <th className="p-4 font-bold border-r border-gray-600 text-center">Score</th>
                            <th className="p-4 font-bold border-r border-gray-600 text-center">Level</th>
                            <th className="p-4 font-bold w-1/2">Visual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedAreas.map((area, idx) => (
                            <tr key={area.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="p-4 font-bold border border-gray-300 flex items-center gap-3 text-gray-800">
                                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: area.color }}></div>
                                    {area.label}
                                </td>
                                <td className="p-4 font-black text-center border border-gray-300 text-[#1976D2] text-lg">{area.score !== null ? `${area.score}/25` : '-'}</td>
                                <td className="p-4 font-black text-center border border-gray-300" style={{ color: levelColor(area.level) }}>{area.level}</td>
                                <td className="p-4 border border-gray-300">
                                    {area.score !== null && (
                                        <div className="h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full flex items-center justify-center text-xs text-white font-bold" style={{ width: `${(area.score/25)*100}%`, backgroundColor: area.color }}>
                                                {area.score > 0 ? `${area.score}/25` : ''}
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="flex gap-4 mt-8">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-3 h-3 rounded-full bg-[#43A047]"></div> HIGH (21-25): Strength</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-3 h-3 rounded-full bg-[#FB8C00]"></div> MODERATE (13-20): Growing</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium"><div className="w-3 h-3 rounded-full bg-[#E53935]"></div> LOW (0-12): Priority</div>
                </div>
            </div>

            {/* Page 11: The Gap */}
            <div className="print-page p-16 flex flex-col relative">
                <div className="absolute top-0 left-0 w-full h-8 bg-[#0B152A]"></div>
                <div className="absolute top-8 left-0 w-full h-2 bg-[#D1B85D]"></div>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-[#0B152A]"></div>
                
                <h1 className="text-4xl font-bold text-[#1A237E] mt-12 mb-4 border-b-2 border-gray-200 pb-4">The Gap — Where You Are Going</h1>
                <p className="text-lg text-gray-700 leading-relaxed mb-8">
                    The purpose of every great assessment is not to show you your failures — it is to show you the gap between where you are and where you could be. God has a specific calling and purpose for your life. This page identifies the critical areas requiring your focused attention over the next 40 days, and the strengths that will help you close the gap.
                </p>
                
                <h2 className="text-2xl font-bold text-[#1A237E] mb-4">Priority Focus Areas (Lowest Scores)</h2>
                <div className="flex flex-col gap-4 mb-10">
                    {lowestAreas.map((area, i) => (
                        <div key={area.id} className="bg-red-50/40 border border-red-100 rounded-lg p-5 flex gap-6">
                            <span className="text-4xl font-black text-red-500 w-8">{i + 1}.</span>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    {area.label} — Score: {area.score}/25 | Gap: {25 - area.score} points
                                </h3>
                                <p className="text-gray-700 leading-relaxed italic">{getSummaryFeedback(area.id, area.score)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-[#1A237E] mb-4">Your Key Strengths to Build On</h2>
                <div className="flex flex-col gap-4 mb-10">
                    {highestAreas.map(area => (
                        <div key={area.id} className="bg-green-50/40 border border-green-100 rounded-lg p-5">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                {area.label} (Score: {area.score}/25 — {area.level})
                            </h3>
                            <p className="text-gray-700 leading-relaxed">This is your platform for growth. Use this strength to serve others and anchor your journey.</p>
                        </div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-[#1A237E] mb-4">Your 40-Day Commitment</h2>
                <div className="bg-[#0B152A] text-white rounded-lg p-8 shadow-lg mb-16">
                    <p className="text-lg leading-relaxed mb-6">
                        The 40-Day Transformation Journey is your opportunity to close the gap. You will be assigned a coach or mentor who will walk with you through weekly check-ins, targeted development plans, and practical accountability. By the end of 40 days, you will re-take this assessment and see the distance you have travelled. Every area can grow. Every score can improve. <strong>The question is: will you commit?</strong>
                    </p>
                    <div className="flex justify-between items-end mt-16 pt-8">
                        <div className="flex-1 text-center px-4">
                            <div className="border-b border-white pb-2 mb-2 w-full h-8"></div>
                            <span className="text-sm font-light text-gray-400">Coach / Mentor Signature</span>
                        </div>
                        <div className="flex-1 text-center px-4">
                            <div className="border-b border-white pb-2 mb-2 w-full h-8"></div>
                            <span className="text-sm font-light text-gray-400">Candidate Signature</span>
                        </div>
                        <div className="flex-1 text-center px-4">
                            <div className="border-b border-white pb-2 mb-2 w-full h-8"></div>
                            <span className="text-sm font-light text-gray-400">Date</span>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default AssessmentSummaryPrintView;
