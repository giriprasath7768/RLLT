import React from 'react';
import { NavLink } from 'react-router-dom';

const ProgressDonutChart = () => (
    <div className="relative w-40 h-40 flex items-center justify-center shrink-0 mx-auto lg:mx-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="4"></circle>
            {/* Gray 18% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#9ca3af" strokeWidth="4" strokeDasharray="18 82" strokeDashoffset="-82"></circle>
            {/* Blue 46% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="46 54" strokeDashoffset="-36"></circle>
            {/* Green 36% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray="36 64" strokeDashoffset="0"></circle>
        </svg>
    </div>
);

const ClassroomActivityChart = () => (
    <div className="w-full h-48 mt-4 relative flex">
        <div className="flex flex-col justify-between text-xs text-gray-400 pb-6 pr-3 h-full text-right shrink-0">
            <span>100</span>
            <span>80</span>
            <span>60</span>
            <span>40</span>
            <span>20</span>
            <span>0</span>
        </div>
        <div className="flex-1 relative h-full pt-2">
            <div className="absolute -top-6 right-0 flex space-x-4 text-[10px] md:text-xs font-semibold">
                <div className="flex items-center text-gray-600"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span> Active Students</div>
                <div className="flex items-center text-gray-600"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> New Enrollments</div>
            </div>
            <svg className="w-full h-[calc(100%-24px)]" viewBox="0 0 400 120" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="24" x2="400" y2="24" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="48" x2="400" y2="48" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="72" x2="400" y2="72" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="96" x2="400" y2="96" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f3f4f6" strokeWidth="1" />
                
                {/* Purple Line - Active Students */}
                <path d="M 0 84 L 40 72 L 80 69.6 L 120 60 L 160 48 L 200 54 L 240 38.4 L 280 38.4 L 320 24 L 360 24 L 400 0" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                {[
                    [0,84],[40,72],[80,69.6],[120,60],[160,48],[200,54],[240,38.4],[280,38.4],[320,24],[360,24],[400,0]
                ].map((pt, i) => <circle key={`p-${i}`} cx={pt[0]} cy={pt[1]} r="3.5" fill="#6366f1" />)}

                {/* Green Line - New Enrollments */}
                <path d="M 0 108 L 40 102 L 80 98.4 L 120 93.6 L 160 90 L 200 84 L 240 81.6 L 280 74.4 L 320 72 L 360 72 L 400 48" fill="none" stroke="#10b981" strokeWidth="2.5" />
                {[
                    [0,108],[40,102],[80,98.4],[120,93.6],[160,90],[200,84],[240,81.6],[280,74.4],[320,72],[360,72],[400,48]
                ].map((pt, i) => <circle key={`g-${i}`} cx={pt[0]} cy={pt[1]} r="3.5" fill="#10b981" />)}
            </svg>
            <div className="flex justify-between text-[10px] md:text-xs text-gray-400 mt-2 absolute bottom-0 w-full font-medium">
                <span>May 1</span>
                <span>May 8</span>
                <span>May 15</span>
                <span>May 22</span>
                <span>May 31</span>
            </div>
        </div>
    </div>
);

const WordPageLineChart = () => (
    <div className="w-full h-36 mt-4 relative flex">
        <div className="flex flex-col justify-between text-xs text-gray-400 pb-6 pr-3 h-full text-right shrink-0">
            <span>3K</span>
            <span>2K</span>
            <span>1K</span>
            <span>0</span>
        </div>
        <div className="flex-1 relative h-full">
            <svg className="w-full h-[calc(100%-24px)]" viewBox="0 0 400 120" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="wordGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="40" x2="400" y2="40" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="80" x2="400" y2="80" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f3f4f6" strokeWidth="1" />

                <path d="M 0 100 L 30 80 L 60 80 L 90 60 L 120 60 L 150 70 L 180 50 L 210 40 L 240 60 L 270 40 L 300 30 L 330 40 L 360 20 L 400 0 L 400 120 L 0 120 Z" fill="url(#wordGrad)" />
                <path d="M 0 100 L 30 80 L 60 80 L 90 60 L 120 60 L 150 70 L 180 50 L 210 40 L 240 60 L 270 40 L 300 30 L 330 40 L 360 20 L 400 0" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                
                {[
                    [0,100], [30,80], [60,80], [90,60], [120,60], [150,70], [180,50], [210,40], [240,60], [270,40], [300,30], [330,40], [360,20], [400,0]
                ].map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="3.5" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
                ))}
            </svg>
            <div className="flex justify-between text-[10px] md:text-xs text-gray-400 mt-2 absolute bottom-0 w-full font-medium">
                <span>May 1</span>
                <span>May 8</span>
                <span>May 15</span>
                <span>May 22</span>
                <span>May 31</span>
            </div>
        </div>
    </div>
);

const ProgressBar = ({ progress, colorClass }) => (
    <div className="w-16 sm:w-24 bg-gray-100 rounded-full h-2 flex overflow-hidden">
        <div className={`${colorClass} h-full rounded-full`} style={{ width: `${progress}%` }}></div>
    </div>
);

const FeatureCard = ({ icon, title, desc, iconBg, iconColor }) => (
    <div className="flex items-start space-x-3 mb-4">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
            <i className={`pi ${icon}`}></i>
        </div>
        <div>
            <h4 className="text-sm font-bold text-gray-800">{title}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
        </div>
    </div>
);

export default function DashboardLeader() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-6 lg:p-8 font-sans text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-0.5">Welcome back,</p>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#051220] tracking-tight">Leader John <span role="img" aria-label="wave">👋</span></h1>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-4 md:mt-0">
                    <div className="flex items-center border border-gray-200 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm font-medium cursor-pointer hover:bg-gray-50">
                        <i className="pi pi-map-marker mr-2 text-gray-400"></i>
                        My Location
                        <i className="pi pi-chevron-down ml-2 text-gray-400 text-xs"></i>
                    </div>
                    <div className="flex items-center border border-gray-200 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm font-medium cursor-pointer hover:bg-gray-50 hidden sm:flex">
                        <i className="pi pi-calendar mr-2 text-gray-400"></i>
                        May 1 - May 31, 2025
                        <i className="pi pi-chevron-down ml-3 text-gray-400 text-xs"></i>
                    </div>
                    <div className="relative cursor-pointer hover:opacity-80">
                        <i className="pi pi-bell text-xl text-gray-600"></i>
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">3</span>
                    </div>
                    <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 cursor-pointer hover:opacity-80">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=Leader+John&background=2563eb&color=fff" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-sm font-semibold text-gray-700 hidden sm:block">Leader <i className="pi pi-chevron-down text-[10px] ml-1 text-gray-400"></i></div>
                    </div>
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                    { title: 'My Students', val: '156', inc: '12%', icon: 'pi-users', bg: 'bg-indigo-50', color: 'text-indigo-600' },
                    { title: 'Active Charts', val: '28', inc: '8%', icon: 'pi-book', bg: 'bg-emerald-50', color: 'text-emerald-600' },
                    { title: 'Completed Trainings', val: '12', inc: '15%', icon: 'pi-graduation-cap', bg: 'bg-blue-50', color: 'text-blue-600' },
                    { title: '7TNT Touches', val: '2,450', inc: '20%', icon: 'pi-users', bg: 'bg-orange-50', color: 'text-orange-600' },
                    { title: 'Audio Touches', val: '1,870', inc: '18%', icon: 'pi-link', bg: 'bg-purple-50', color: 'text-purple-600' }
                ].map((card, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.bg} mr-3`}>
                            <i className={`pi ${card.icon} ${card.color} text-xl`}></i>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 font-semibold mb-0.5">{card.title}</div>
                            <div className="flex items-end">
                                <span className="text-2xl font-bold text-gray-800 leading-none">{card.val}</span>
                            </div>
                            {card.inc && (
                                <div className="text-[10px] font-semibold text-gray-400 mt-1 flex items-center">
                                    <span className="text-emerald-500 mr-1"><i className="pi pi-arrow-up text-[8px]"></i> {card.inc}</span> vs last month
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Row 2: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Student Progress Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 mb-6">Student Progress Overview</h3>
                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-center sm:justify-around lg:justify-between px-2 gap-6 lg:gap-4">
                        <ProgressDonutChart />
                        <div className="space-y-4 w-full sm:w-auto">
                            <div className="flex items-center text-sm w-full">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shrink-0"></span>
                                <span className="text-gray-800 font-bold mr-auto">Completed</span>
                                <span className="text-gray-500 font-medium ml-4">56 <span className="text-gray-400 text-xs">(36%)</span></span>
                            </div>
                            <div className="flex items-center text-sm w-full">
                                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2 shrink-0"></span>
                                <span className="text-gray-800 font-bold mr-auto">In Progress</span>
                                <span className="text-gray-500 font-medium ml-4">72 <span className="text-gray-400 text-xs">(46%)</span></span>
                            </div>
                            <div className="flex items-center text-sm w-full">
                                <span className="w-3 h-3 rounded-full bg-gray-400 mr-2 shrink-0"></span>
                                <span className="text-gray-800 font-bold mr-auto whitespace-nowrap">Not Started</span>
                                <span className="text-gray-500 font-medium ml-4">28 <span className="text-gray-400 text-xs">(18%)</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Classroom Activity */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800">Classroom Activity <span className="text-gray-400 font-normal text-sm ml-1">(This Month)</span></h3>
                    </div>
                    <ClassroomActivityChart />
                </div>

                {/* 7TNT Word Page Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 mb-1">7TNT Word Page Overview</h3>
                    <div className="text-3xl font-black text-[#051220]">2,450</div>
                    <div className="text-xs text-gray-500 font-medium mb-1">Total Touches This Month</div>
                    <div className="text-sm font-semibold text-emerald-500 flex items-center mb-2">
                        <i className="pi pi-arrow-up text-[10px] mr-1"></i> 20% <span className="text-gray-400 font-normal ml-1">vs last month</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end">
                        <WordPageLineChart />
                    </div>

                    <button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-colors shadow-indigo-200">
                        View 7TNT Analytics
                    </button>
                </div>
            </div>

            {/* Row 3: Feature Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                {/* Digital */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full lg:col-span-2 relative">
                    <h3 className="font-bold text-indigo-600 mb-4 flex items-center"><i className="pi pi-desktop mr-2"></i> Digital</h3>
                    <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FeatureCard icon="pi-users" title="My Students" desc="View Students & Progress" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-chart-line" title="My Charts" desc="View Assigned Charts" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-file" title="Training Content" desc="Access Digital Content" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                            </div>
                            <div>
                                <FeatureCard icon="pi-book" title="Study Materials" desc="Access Study Materials" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-file-edit" title="Assessments" desc="Access & View Results" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-link" title="7TNT Word Page" desc="Track My Touches" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-indigo-600 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-indigo-700">
                        View All Digital Tools <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* Non-Digital */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full lg:col-span-2 relative">
                    <h3 className="font-bold text-emerald-600 mb-4 flex items-center"><i className="pi pi-desktop mr-2 text-emerald-600"></i> Non-Digital</h3>
                    <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FeatureCard icon="pi-file-pdf" title="Student Reports" desc="View Student Reports" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                                <FeatureCard icon="pi-chart-pie" title="Created Charts" desc="View Charts" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                                <FeatureCard icon="pi-print" title="Print Charts" desc="Print for Classrooms" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                            </div>
                            <div>
                                <FeatureCard icon="pi-share-alt" title="Distribution Status" desc="Track Chart Distribution" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                                <FeatureCard icon="pi-map" title="Location Overview" desc="View Location Progress" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-emerald-600 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-emerald-700 mt-auto">
                        View All Non-Digital Tools <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* Audio */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full lg:col-span-1 relative">
                    <h3 className="font-bold text-orange-500 mb-4 flex items-center"><i className="pi pi-play mr-2"></i> Audio</h3>
                    <div className="flex-1 flex flex-col space-y-1">
                        <FeatureCard icon="pi-play" title="Audio Player" desc="Listen to Audio Content" iconBg="bg-orange-50" iconColor="text-orange-500" />
                        <FeatureCard icon="pi-headphones" title="My Audio Touches" desc="View My Audio Activity" iconBg="bg-orange-50" iconColor="text-orange-500" />
                        <FeatureCard icon="pi-chart-bar" title="Audio Analytics" desc="Detailed Audio Reports" iconBg="bg-orange-50" iconColor="text-orange-500" />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-orange-500 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-orange-600 mt-auto">
                        View All Audio Tools <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-x-auto flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Activities</h3>
                    <div className="flex-1">
                        <table className="w-full text-left text-sm min-w-[500px]">
                            <thead>
                                <tr className="text-gray-500 font-semibold border-b border-gray-100">
                                    <th className="pb-3 px-2">Activity</th>
                                    <th className="pb-3 px-2">Type</th>
                                    <th className="pb-3 px-2">Details</th>
                                    <th className="pb-3 px-2 text-right">Date & Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {[
                                    { act: 'Student Enrolled: Michael Brown', type: 'Enrollment', typeColor: 'bg-gray-100 text-gray-700', details: 'New student added', time: 'May 31, 2025 10:30 AM' },
                                    { act: 'Chart Completed: RLLT Chart - Phase 2', type: 'Chart', typeColor: 'bg-indigo-100 text-indigo-700', details: 'By 12 students', time: 'May 31, 2025 09:45 AM' },
                                    { act: 'Assessment Completed: Lesson 05', type: 'Assessment', typeColor: 'bg-emerald-100 text-emerald-700', details: 'By 8 students', time: 'May 31, 2025 09:20 AM' },
                                    { act: 'Audio Played: Lesson 07', type: 'Audio', typeColor: 'bg-orange-100 text-orange-700', details: 'Total plays: 45', time: 'May 31, 2025 08:55 AM' }
                                ].map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 px-2 font-medium">{row.act}</td>
                                        <td className="py-3.5 px-2"><span className={`${row.typeColor} px-2.5 py-1 rounded-md text-xs font-bold`}>{row.type}</span></td>
                                        <td className="py-3.5 px-2 text-gray-600">{row.details}</td>
                                        <td className="py-3.5 px-2 text-gray-500 text-xs font-medium text-right">{row.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-indigo-600 font-semibold text-sm flex justify-center items-center cursor-pointer hover:text-indigo-700">
                        View All Activities <i className="pi pi-arrow-right text-xs ml-2"></i>
                    </div>
                </div>

                {/* My Students at a Glance */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 overflow-x-auto flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">My Students at a Glance</h3>
                        <span className="text-indigo-600 text-sm font-semibold cursor-pointer hover:underline">View All Students</span>
                    </div>
                    <div className="flex-1">
                        <table className="w-full text-left text-sm min-w-[450px]">
                            <thead>
                                <tr className="text-gray-500 font-semibold border-b border-gray-100">
                                    <th className="pb-3 px-2">Student Name</th>
                                    <th className="pb-3 px-2 text-center">Progress</th>
                                    <th className="pb-3 px-2 text-center">Charts Completed</th>
                                    <th className="pb-3 px-2 text-right">Last Activity</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {[
                                    { name: 'Michael Brown', prog: 75, color: 'bg-emerald-500', comp: '4 / 6', act: 'May 31, 2025' },
                                    { name: 'Sarah Johnson', prog: 60, color: 'bg-blue-500', comp: '3 / 6', act: 'May 31, 2025' },
                                    { name: 'David Miller', prog: 90, color: 'bg-blue-500', comp: '5 / 6', act: 'May 30, 2025' },
                                    { name: 'Emily Davis', prog: 40, color: 'bg-orange-500', comp: '2 / 6', act: 'May 30, 2025' },
                                    { name: 'James Wilson', prog: 80, color: 'bg-emerald-500', comp: '4 / 6', act: 'May 30, 2025' }
                                ].map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 px-2 font-bold text-gray-800">{row.name}</td>
                                        <td className="py-3.5 px-2">
                                            <div className="flex items-center justify-center space-x-3">
                                                <ProgressBar progress={row.prog} colorClass={row.color} />
                                                <span className="font-bold w-8 text-right text-gray-800">{row.prog}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-2 text-center text-gray-500 font-medium">{row.comp}</td>
                                        <td className="py-3.5 px-2 text-right text-gray-500">{row.act}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
