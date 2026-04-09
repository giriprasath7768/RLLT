import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from 'primereact/card';

export default function DashboardAdmin() {
    const [stats, setStats] = useState({
        leaders: 0,
        students: 0,
        charts: 0,
        contents: 0
    });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        // Fetch some basic stats or set dummy stats for the design
        // In a real app we'd fetch an aggregated endpoint for the admin's location
        setTimeout(() => {
            setStats({
                leaders: 12,
                students: 156,
                charts: 24,
                contents: 45
            });
            setLoading(false);
        }, 1000);
    }, []);

    const dashboardCards = [
        { title: 'Total Leaders', value: stats.leaders, icon: 'pi-users', color: 'bg-blue-100 text-blue-600', borderColor: 'border-blue-200' },
        { title: 'Total Students', value: stats.students, icon: 'pi-id-card', color: 'bg-emerald-100 text-emerald-600', borderColor: 'border-emerald-200' },
        { title: 'Active Charts', value: stats.charts, icon: 'pi-chart-line', color: 'bg-purple-100 text-purple-600', borderColor: 'border-purple-200' },
        { title: 'Training Content', value: stats.contents, icon: 'pi-video', color: 'bg-orange-100 text-orange-600', borderColor: 'border-orange-200' }
    ];

    return (
        <div className="p-6 md:p-10 font-sans">
            <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
                <h1 className="text-3xl font-black text-[#051220] tracking-tight mb-2 relative z-10">Admin Dashboard</h1>
                <p className="text-gray-500 font-medium relative z-10">Welcome back. Here is an overview of your local branch statistics.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {dashboardCards.map((card, idx) => (
                    <div key={idx} className={`bg-white border ${card.borderColor} p-6 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{card.title}</div>
                            <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                <i className={`pi ${card.icon} text-xl font-bold`}></i>
                            </div>
                        </div>
                        <div className="flex items-end gap-3">
                            <div className="text-5xl font-black text-[#051220] tracking-tighter">
                                {loading ? <i className="pi pi-spin pi-spinner text-3xl text-gray-300"></i> : card.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#051220]">Recent Activity</h2>
                        <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
                    </div>
                    {loading ? (
                        <div className="flex justify-center p-8"><i className="pi pi-spin pi-spinner text-3xl text-gray-300"></i></div>
                    ) : (
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-4 items-start p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                                        <i className="pi pi-user-plus"></i>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">New Student Registered</div>
                                        <div className="text-sm text-gray-500">A new student was assigned to Leader Mark.</div>
                                    </div>
                                    <span className="ml-auto text-xs text-gray-400 font-medium pt-1">2h ago</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#051220]">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl transition-all group">
                            <i className="pi pi-user-plus text-2xl text-gray-400 group-hover:text-blue-500 mb-3 transition-colors"></i>
                            <span className="font-semibold text-gray-700 group-hover:text-blue-700">Add Leader</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-xl transition-all group">
                            <i className="pi pi-id-card text-2xl text-gray-400 group-hover:text-emerald-500 mb-3 transition-colors"></i>
                            <span className="font-semibold text-gray-700 group-hover:text-emerald-700">Add Student</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 rounded-xl transition-all group">
                            <i className="pi pi-chart-pie text-2xl text-gray-400 group-hover:text-purple-500 mb-3 transition-colors"></i>
                            <span className="font-semibold text-gray-700 group-hover:text-purple-700">Assign Chart</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-orange-50 border border-gray-100 hover:border-orange-200 rounded-xl transition-all group">
                            <i className="pi pi-file-edit text-2xl text-gray-400 group-hover:text-orange-500 mb-3 transition-colors"></i>
                            <span className="font-semibold text-gray-700 group-hover:text-orange-700">Assessment</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
