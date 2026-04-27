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
        <div className="w-full flex justify-center py-8">
            <div className="w-full max-w-5xl">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-[#051220] tracking-tight mb-2">My Assessment Results</h1>
                        <p className="text-gray-500 text-lg">A detailed breakdown of how you performed</p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-2">Total Score Achieved</div>
                    </div>
                    <div className="text-6xl font-black text-indigo-600 drop-shadow-sm mt-3 sm:mt-0">{totalScore} <span className="text-xl text-gray-400">PTS</span></div>
                </div>

                <Card className="shadow-none border border-gray-100 rounded-3xl overflow-hidden">
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
            </div>
        </div>
    );
};

export default StudentAssessmentResult;
