import React from 'react';
import { Button } from 'primereact/button';
import { jsPDF } from 'jspdf';

const TestPreview = ({ assessments, filterName, filterLocation }) => {

    const derivedName = filterName || (assessments.length > 0 ? assessments[0].name : 'Assessment Name');
    const derivedLocation = filterLocation || (assessments.length > 0 ? assessments[0].location_module : '_________________________');

    const stripHtml = (html) => {
        if (!html) return '';
        return String(html).replace(/<[^>]*>?/gm, '');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        const doc = new jsPDF('p', 'pt', 'a4');
        const marginX = 40;
        let startY = 40;
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(derivedName, doc.internal.pageSize.getWidth() / 2, startY, { align: 'center' });
        
        startY += 30;
        doc.setFontSize(12);
        doc.text(`Location: ${derivedLocation}`, marginX, startY);
        doc.text(`Date: __________________`, doc.internal.pageSize.getWidth() - marginX - 120, startY);
        
        startY += 20;
        doc.setLineWidth(1);
        doc.line(marginX, startY, doc.internal.pageSize.getWidth() - marginX, startY);
        
        startY += 30;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        assessments.forEach((q, index) => {
            const qNum = q.question_number || (index + 1);
            const questionText = `${qNum}. ${stripHtml(q.question_text)}`;
            
            if (startY > 780) {
                doc.addPage();
                startY = 50;
            }
            
            const splitQuestion = doc.splitTextToSize(questionText, 510);
            doc.text(splitQuestion, marginX, startY);
            startY += (splitQuestion.length * 15) + 10;
            
            [q.choice_1, q.choice_2, q.choice_3].forEach((choice, i) => {
                if (choice) {
                    if (startY > 800) {
                        doc.addPage();
                        startY = 50;
                    }
                    const choiceText = `${String.fromCharCode(97 + i)}) ${stripHtml(choice)}`;
                    const splitChoice = doc.splitTextToSize(choiceText, 490);
                    doc.text(splitChoice, marginX + 20, startY);
                    startY += (splitChoice.length * 15) + 5;
                }
            });
            
            startY += 20; 
        });
        
        const filename = `${derivedName ? derivedName.replace(/\s+/g, '_') : 'Test_Paper'}.pdf`;
        doc.save(filename);
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto print:p-0 print:max-w-full print-visible-section">
            <div className="flex justify-between items-center mb-6 print:hidden">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 m-0">Test Format Preview</h2>
                    <p className="text-gray-500 m-0">This is the grade-free view that students will see.</p>
                </div>
                <div className="flex gap-2">
                    <Button label="Print" icon="pi pi-print" text className="font-bold border border-gray-300" style={{ color: '#2F5597' }} onClick={handlePrint} />
                    <Button label="Export PDF" icon="pi pi-file-pdf" text className="font-bold border border-gray-300" style={{ color: '#2F5597' }} onClick={handleExport} />
                </div>
            </div>
            
            {/* Printable Header - Only visible during print */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold text-center mb-6 text-black border-none">{derivedName}</h1>
                <div className="flex justify-between items-end border-b-2 border-black pb-2 mb-6 text-black">
                    <div className="font-bold text-lg">Location: <span className="font-normal">{derivedLocation}</span></div>
                    <div className="font-bold text-lg">Date: <span className="font-normal">_________________________</span></div>
                </div>
            </div>

            <div className="space-y-8 print:space-y-6">
                {assessments.map((q, index) => (
                    <div key={q.id || index} className="bg-white p-6 print:p-0 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:mb-4">
                        <div className="flex items-start gap-4 flex-nowrap">
                            <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm print:bg-transparent print:text-black print:p-0 print:text-lg">
                                {q.question_number || (index + 1)}.
                            </span>
                            <div className="flex-1">
                                <h3 className="text-lg font-medium text-gray-800 mb-4 print:text-black print:mb-3" dangerouslySetInnerHTML={{ __html: q.question_text }}></h3>
                                
                                <div className="space-y-3 print:space-y-2">
                                    {[q.choice_1, q.choice_2, q.choice_3].map((choice, i) => (
                                        choice ? (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-4 h-4 border border-gray-400 rounded-full print:border-black print:w-4 print:h-4"></div>
                                                <label className="text-gray-700 print:text-black m-0" dangerouslySetInnerHTML={{ __html: choice }}></label>
                                            </div>
                                        ) : null
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {assessments.length === 0 && (
                    <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg print:hidden">
                        No questions available for preview. Please add some or adjust your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestPreview;
