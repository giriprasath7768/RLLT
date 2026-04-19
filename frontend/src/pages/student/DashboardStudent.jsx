import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';

const DashboardStudent = () => {
    const [stats, setStats] = useState({ marks: null, pendingCharts: 0 });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch me for marks
                const meRes = await axios.get('http://localhost:8000/api/me', { withCredentials: true });
                // Fetch assigned charts count
                const chartsRes = await axios.get('http://localhost:8000/api/assignments/my', { withCredentials: true });

                setStats({
                    marks: meRes.data.assessment_marks || 0,
                    pendingCharts: chartsRes.data.length
                });
            } catch (err) {
                console.error("Error fetching dashboard student data", err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="w-full flex justify-center animate-fade-in py-10">
            <div className="w-full max-w-5xl bg-white shadow-xl shadow-gray-200/50 rounded-3xl p-10 border border-gray-100 relative overflow-hidden">
                {/* Decorative Blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-[#102b4e] rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none"></div>

                <h1 className="text-4xl font-black text-[#102b4e] tracking-tight mb-2">Welcome to your Portal</h1>
                <p className="text-gray-500 mb-8 max-w-2xl text-lg">
                    Check your assessment scores, view interactive 3D charts, and continue your learning journey from your exclusive environment.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-[#1F2937] to-[#111827] text-white p-8 rounded-3xl shadow-lg relative overflow-hidden group">
                        <div className="z-10 relative">
                            <div className="text-gray-400 text-sm tracking-widest font-bold uppercase mb-2">Assessment Performance</div>
                            <div className="text-6xl font-black text-[#EAB308]">{stats.marks}<span className="text-2xl text-gray-400 ml-1">/ 100</span></div>
                        </div>
                        <i className="pi pi-check-circle text-8xl absolute -bottom-6 -right-6 text-white/5 right-0 group-hover:scale-110 transition-transform"></i>
                    </div>

                    <div className="bg-white border-2 border-gray-100 p-8 rounded-3xl shadow-sm relative overflow-hidden group">
                        <div className="z-10 relative">
                            <div className="text-gray-400 text-sm tracking-widest font-bold uppercase mb-2">Assigned Charts</div>
                            <div className="text-6xl font-black text-[#4F46E5]">{stats.pendingCharts}</div>
                        </div>
                        <i className="pi pi-chart-bar text-8xl absolute -bottom-6 -right-6 text-gray-50 group-hover:scale-110 transition-transform"></i>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <NavLink to="/dashboard/student/assessment-result" className="flex flex-col items-center justify-center p-8 border border-gray-200 rounded-3xl hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group bg-gray-50 hover:bg-blue-50/50">
                        <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="pi pi-chart-line text-2xl"></i>
                        </div>
                        <div className="font-bold text-gray-800">Assessment Result</div>
                        <div className="text-sm text-gray-500 text-center mt-2">Review your detailed breakdown</div>
                    </NavLink>

                    <NavLink to="/dashboard/student/charts" className="flex flex-col items-center justify-center p-8 border border-gray-200 rounded-3xl hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group bg-gray-50 hover:bg-indigo-50/50">
                        <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="pi pi-images text-2xl"></i>
                        </div>
                        <div className="font-bold text-gray-800">Chart Listing</div>
                        <div className="text-sm text-gray-500 text-center mt-2">View 24/7 and Morning Tracks</div>
                    </NavLink>

                    <NavLink to="/dashboard/student/players" className="flex flex-col items-center justify-center p-8 border border-gray-200 rounded-3xl hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer group bg-gray-50 hover:bg-purple-50/50">
                        <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <i className="pi pi-play-circle text-2xl"></i>
                        </div>
                        <div className="font-bold text-gray-800">Media Players</div>
                        <div className="text-sm text-gray-500 text-center mt-2">Access Interactive Assets</div>
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default DashboardStudent;
