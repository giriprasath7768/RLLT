import React from 'react';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

const AssessmentUnderReview = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="max-w-lg w-full bg-white p-8 sm:p-12 rounded-[2rem] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] border border-gray-100 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
                    <i className="pi pi-clock text-4xl text-yellow-500"></i>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Under Review</h1>
                <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                    Your assessment test has been submitted successfully and is currently under review by an administrator. Once approved, you will be granted access to your full dashboard.
                </p>
                <Button label="Refresh Status" icon="pi pi-refresh" severity="secondary" rounded outlined onClick={() => window.location.href = "/dashboard/student"} className="w-full sm:w-auto px-8 py-3" />
            </div>
        </div>
    );
};

export default AssessmentUnderReview;
