import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';

const DashboardLeader = () => {
    const [stats, setStats] = useState({
        students: 0,
        assessments: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const authConfig = { withCredentials: true };
                const stRes = await axios.get('http://localhost:8000/api/students', authConfig);
                const asstRes = await axios.get('http://localhost:8000/api/assessments', authConfig);
                setStats({
                    students: stRes.data.length || 0,
                    assessments: asstRes.data.length || 0,
                });
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
                // Fail gracefully 
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-10 font-sans h-full">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#051220] tracking-tight mb-2">Leader Dashboard</h1>
                <p className="text-gray-500">Overview of your students and assessments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute opacity-5 -bottom-10 -right-10">
                        <i className="pi pi-users" style={{ fontSize: '10rem' }}></i>
                    </div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Students</div>
                    <div className="text-4xl font-black text-[#cca673] mb-4">{stats.students}</div>
                    <div>
                        <NavLink to="/admin/manage-students" className="text-sm font-bold text-[#051220] hover:text-[#cca673] uppercase tracking-wide flex items-center gap-2">
                            Manage Students <i className="pi pi-arrow-right"></i>
                        </NavLink>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute opacity-5 -bottom-10 -right-10">
                        <i className="pi pi-file-edit" style={{ fontSize: '10rem' }}></i>
                    </div>
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Assessments</div>
                    <div className="text-4xl font-black text-[#051220] mb-4">{stats.assessments}</div>
                    <div>
                        <NavLink to="/admin/manage-assessment" className="text-sm font-bold text-[#cca673] hover:text-[#051220] uppercase tracking-wide flex items-center gap-2">
                            Manage Assessments <i className="pi pi-arrow-right"></i>
                        </NavLink>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Chart Assignments</h2>
                    <p className="text-gray-500 text-sm">Assign reading charts to your students easily.</p>
                </div>
                <div className="flex gap-4">
                    <NavLink to="/admin/chart-listing/main-chart" className="px-6 py-3 border-2 border-[#051220] text-[#051220] rounded-xl font-bold hover:bg-gray-50 transition-colors uppercase tracking-widest text-sm shadow-sm whitespace-nowrap">View Charts</NavLink>
                    <NavLink to="/admin/assign-chart" className="px-6 py-3 bg-[#051220] text-white rounded-xl font-bold hover:bg-[#0f2136] transition-colors shadow-md uppercase tracking-widest text-sm whitespace-nowrap">Assign Chart</NavLink>
                </div>
            </div>
        </div>
    );
};

export default DashboardLeader;
