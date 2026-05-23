import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const StudentAssessmentResult = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axios.get('http://' + window.location.hostname + ':8000/api/assessments/student/me/results', {
                    withCredentials: true
                });
                setResults(response.data);
            } catch (error) {
                console.error("Failed to fetch assessment results:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    const totalScore = results.reduce((sum, r) => sum + r.awarded_grade, 0);

    return (
        <div className="w-full flex justify-center py-4 sm:py-8 px-4 sm:px-6">
            <div className="w-full max-w-5xl">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-[#051220] tracking-tight mb-2">My Assessment Results</h1>
                        <p className="text-gray-500 text-sm sm:text-lg">A detailed breakdown of how you performed</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Total Score Achieved</div>
                    </div>
                    <div className="text-5xl sm:text-6xl font-black text-indigo-600 drop-shadow-sm mt-3 sm:mt-0">{totalScore} <span className="text-xl text-gray-400">PTS</span></div>
                </div>

                <Card className="shadow-none border border-gray-100 rounded-3xl overflow-hidden hidden md:block">
                    <DataTable
                        value={results}
                        loading={loading}
                        responsiveLayout="scroll"
                        emptyMessage="No assessment results found."
                        stripedRows
                        className="p-datatable-sm md:p-datatable-lg border-t-0"
                    >
                        <Column field="question_text" header="Question" className="font-medium text-white p-4" style={{ minWidth: '400px' }}></Column>
                        <Column field="selected_choice_text" header="Your Answer" className="text-gray-300 p-4"></Column>
                        <Column field="awarded_grade" header="Points Awarded" className="font-bold text-center text-blue-400 p-4"></Column>
                    </DataTable>
                </Card>

                {/* Mobile Card List */}
                <div className="block md:hidden space-y-4">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            Loading assessment results...
                        </div>
                    ) : results.length > 0 ? (
                        results.map((item, index) => (
                            <div key={item.id || index} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                                        Question #{index + 1}
                                    </span>
                                    <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded">
                                        +{item.awarded_grade} pts
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-gray-800 leading-snug">
                                    {item.question_text}
                                </div>
                                <div className="text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-1">
                                    <span className="text-gray-400 font-bold">Your Answer:</span>
                                    <span className="text-gray-700 font-extrabold">{item.selected_choice_text || 'No Answer'}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-8 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            No assessment results found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentAssessmentResult;
