import React from 'react';

const DonutChart = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="4"></circle>
            {/* Orange 19% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="4" strokeDasharray="19 81" strokeDashoffset="-81"></circle>
            {/* Blue 31% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="31 69" strokeDashoffset="-50"></circle>
            {/* Purple 50% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#6366f1" strokeWidth="4" strokeDasharray="50 50" strokeDashoffset="0"></circle>
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-gray-500 text-xs font-semibold">Total Charts</span>
            <span className="text-2xl font-bold text-gray-800">420</span>
        </div>
    </div>
);

const EnrollmentLineChart = () => (
    <div className="w-full h-48 mt-4 relative flex">
        <div className="flex flex-col justify-between text-xs text-gray-400 pb-6 pr-3 h-full text-right shrink-0">
            <span>2K</span>
            <span>1.5K</span>
            <span>1K</span>
            <span>500</span>
            <span>0</span>
        </div>
        <div className="flex-1 relative h-full">
            <svg className="w-full h-[calc(100%-24px)]" viewBox="0 0 400 120" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="enrollmentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f3f4f6" strokeWidth="1" />
                
                <path d="M 0 100 L 26.6 80 L 53.3 75 L 80 40 L 106.6 50 L 133.3 70 L 160 75 L 186.6 50 L 213.3 40 L 240 20 L 266.6 30 L 293.3 10 L 320 20 L 346.6 25 L 373.3 15 L 400 0 L 400 120 L 0 120 Z" fill="url(#enrollmentGrad)" />
                <path d="M 0 100 L 26.6 80 L 53.3 75 L 80 40 L 106.6 50 L 133.3 70 L 160 75 L 186.6 50 L 213.3 40 L 240 20 L 266.6 30 L 293.3 10 L 320 20 L 346.6 25 L 373.3 15 L 400 0" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
                
                {[
                    [0,100], [26.6,80], [53.3,75], [80,40], [106.6,50], [133.3,70], [160,75], [186.6,50], [213.3,40], [240,20], [266.6,30], [293.3,10], [320,20], [346.6,25], [373.3,15], [400,0]
                ].map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="3" fill="#8b5cf6" />
                ))}
            </svg>
            <div className="flex justify-between text-xs text-gray-400 mt-2 absolute bottom-0 w-full font-medium">
                <span>May 1</span>
                <span>May 8</span>
                <span>May 15</span>
                <span>May 22</span>
                <span>May 31</span>
            </div>
        </div>
    </div>
);

const TrainingLineChart = () => (
    <div className="w-full h-48 mt-4 relative flex">
        <div className="flex flex-col justify-between text-xs text-gray-400 pb-6 pr-3 h-full text-right shrink-0">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
        </div>
        <div className="flex-1 relative h-full pt-2">
            <div className="absolute -top-6 right-0 flex space-x-4 text-[10px] font-semibold">
                <div className="flex items-center text-gray-600"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span> Trainings Started</div>
                <div className="flex items-center text-gray-600"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span> Trainings Completed</div>
            </div>
            <svg className="w-full h-[calc(100%-24px)]" viewBox="0 0 400 120" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="30" x2="400" y2="30" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="60" x2="400" y2="60" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="90" x2="400" y2="90" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="0" y1="120" x2="400" y2="120" stroke="#f3f4f6" strokeWidth="1" />
                
                <path d="M 0 100 L 26.6 85 L 53.3 70 L 80 65 L 106.6 60 L 133.3 50 L 160 55 L 186.6 60 L 213.3 45 L 240 55 L 266.6 45 L 293.3 50 L 320 40 L 346.6 45 L 373.3 25 L 400 15" fill="none" stroke="#6366f1" strokeWidth="2" />
                <path d="M 0 110 L 26.6 100 L 53.3 90 L 80 85 L 106.6 80 L 133.3 85 L 160 85 L 186.6 70 L 213.3 80 L 240 85 L 266.6 75 L 293.3 80 L 320 75 L 346.6 65 L 373.3 60 L 400 40" fill="none" stroke="#10b981" strokeWidth="2" />
                
                {[
                    [0,100], [26.6,85], [53.3,70], [80,65], [106.6,60], [133.3,50], [160,55], [186.6,60], [213.3,45], [240,55], [266.6,45], [293.3,50], [320,40], [346.6,45], [373.3,25], [400,15]
                ].map((pt, i) => (
                    <circle key={`p-${i}`} cx={pt[0]} cy={pt[1]} r="2.5" fill="#6366f1" />
                ))}
                
                {[
                    [0,110], [26.6,100], [53.3,90], [80,85], [106.6,80], [133.3,85], [160,85], [186.6,70], [213.3,80], [240,85], [266.6,75], [293.3,80], [320,75], [346.6,65], [373.3,60], [400,40]
                ].map((pt, i) => (
                    <circle key={`g-${i}`} cx={pt[0]} cy={pt[1]} r="2.5" fill="#10b981" />
                ))}
            </svg>
            <div className="flex justify-between text-xs text-gray-400 mt-2 absolute bottom-0 w-full font-medium">
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

                <path d="M 0 100 L 30 80 L 60 85 L 90 70 L 120 75 L 150 50 L 180 60 L 210 70 L 240 50 L 270 55 L 300 30 L 330 40 L 360 20 L 400 10 L 400 120 L 0 120 Z" fill="url(#wordGrad)" />
                <path d="M 0 100 L 30 80 L 60 85 L 90 70 L 120 75 L 150 50 L 180 60 L 210 70 L 240 50 L 270 55 L 300 30 L 330 40 L 360 20 L 400 10" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                
                {[
                    [0,100], [30,80], [60,85], [90,70], [120,75], [150,50], [180,60], [210,70], [240,50], [270,55], [300,30], [330,40], [360,20], [400,10]
                ].map((pt, i) => (
                    <circle key={i} cx={pt[0]} cy={pt[1]} r="3" fill="#8b5cf6" />
                ))}
            </svg>
            <div className="flex justify-between text-xs text-gray-400 mt-2 absolute bottom-0 w-full font-medium">
                <span>May 1</span>
                <span>May 8</span>
                <span>May 15</span>
                <span>May 22</span>
                <span>May 31</span>
            </div>
        </div>
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

export default function DashboardAdmin() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-6 lg:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#051220] tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Welcome back, Admin! <span role="img" aria-label="wave">👋</span></p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <div className="flex items-center border border-gray-200 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm font-medium cursor-pointer hover:bg-gray-50">
                        <i className="pi pi-map-marker mr-2 text-gray-400"></i>
                        All Locations
                        <i className="pi pi-chevron-down ml-2 text-gray-400 text-xs"></i>
                    </div>
                    <div className="flex items-center border border-gray-200 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm font-medium cursor-pointer hover:bg-gray-50">
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
                            <img src="https://ui-avatars.com/api/?name=Admin+User&background=2563eb&color=fff" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-sm font-semibold text-gray-700 hidden sm:block">Admin User <i className="pi pi-chevron-down text-[10px] ml-1 text-gray-400"></i></div>
                    </div>
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                {[
                    { title: 'Total Leaders', val: '78', inc: '18%', icon: 'pi-users', bg: 'bg-indigo-50', color: 'text-indigo-600' },
                    { title: 'Total Students', val: '1,245', inc: '14%', icon: 'pi-user', bg: 'bg-blue-50', color: 'text-blue-600' },
                    { title: 'T-TomT Registered', val: '420', inc: '9%', icon: 'pi-user-plus', bg: 'bg-orange-50', color: 'text-orange-600' },
                    { title: 'Active Classrooms', val: '56', inc: '11%', icon: 'pi-building', bg: 'bg-blue-50', color: 'text-blue-600' },
                    { title: 'Active Charts', val: '320', inc: '8%', icon: 'pi-book', bg: 'bg-emerald-50', color: 'text-emerald-600' },
                    { title: 'Ongoing Trainings', val: '89', inc: '12%', icon: 'pi-file-edit', bg: 'bg-indigo-50', color: 'text-indigo-600' }
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

            {/* Row 2: Overviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Students Enrollment Trend */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Students Enrollment Trend</h3>
                        <div className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded cursor-pointer border border-gray-100">This Month <i className="pi pi-chevron-down text-[10px] ml-1"></i></div>
                    </div>
                    <EnrollmentLineChart />
                </div>

                {/* Chart Distribution */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-2">Chart Distribution (By Type)</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <DonutChart />
                    </div>
                    <div className="mt-4 space-y-2 px-4">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span><span className="text-gray-600 font-medium">Digital</span></div>
                            <span className="font-bold text-gray-800">210 <span className="text-gray-400 font-normal ml-1">(50%)</span></span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span><span className="text-gray-600 font-medium">Non-Digital</span></div>
                            <span className="font-bold text-gray-800">130 <span className="text-gray-400 font-normal ml-1">(31%)</span></span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span><span className="text-gray-600 font-medium">Audio</span></div>
                            <span className="font-bold text-gray-800">80 <span className="text-gray-400 font-normal ml-1">(19%)</span></span>
                        </div>
                    </div>
                </div>

                {/* Training Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800">Training Overview</h3>
                        <div className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded cursor-pointer border border-gray-100">This Month <i className="pi pi-chevron-down text-[10px] ml-1"></i></div>
                    </div>
                    <TrainingLineChart />
                </div>
            </div>

            {/* Row 3: Detail Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                {/* Digital */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full relative lg:col-span-2">
                    <h3 className="font-bold text-indigo-600 mb-4 flex items-center"><i className="pi pi-desktop mr-2"></i> Digital</h3>
                    <div className="flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <FeatureCard icon="pi-users" title="Manage Users" desc="Leaders, Students, T-TomT" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-file" title="Training Content" desc="Manage Digital Content" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-building" title="Classrooms" desc="Manage Classrooms" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                            </div>
                            <div>
                                <FeatureCard icon="pi-book" title="Study Materials" desc="Upload & Manage Materials" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-book" title="Study Materials" desc="Manage Classrooms" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-chart-bar" title="7TNT Word Page" desc="Track Touches & Analytics" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-indigo-600 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-indigo-700">
                        View All <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* Non-Digital */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full relative">
                    <h3 className="font-bold text-emerald-600 mb-4 flex items-center"><i className="pi pi-desktop mr-2 text-emerald-600"></i> Non-Digital</h3>
                    <div className="flex-1 flex flex-col space-y-1">
                        <FeatureCard icon="pi-image" title="View Student Reports" desc="Detailed progress & reports" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                        <FeatureCard icon="pi-chart-pie" title="View Created Charts" desc="All location based charts" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                        <FeatureCard icon="pi-print" title="Print Charts" desc="Generate printable charts" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-emerald-600 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-emerald-700 mt-auto">
                        View All <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* Audio */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full relative">
                    <h3 className="font-bold text-orange-500 mb-4 flex items-center"><i className="pi pi-play mr-2"></i> Audio</h3>
                    <div className="flex-1 flex flex-col space-y-1">
                        <FeatureCard icon="pi-play" title="Audio Players" desc="Access all audio content" iconBg="bg-orange-50" iconColor="text-orange-500" />
                        <FeatureCard icon="pi-verified" title="Track Assistive Touch" desc="Monitor audio engagement" iconBg="bg-orange-50" iconColor="text-orange-500" />
                        <FeatureCard icon="pi-chart-bar" title="Audio Analytics" desc="Detailed audio reports" iconBg="bg-orange-50" iconColor="text-orange-500" />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-orange-500 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-orange-600 mt-auto">
                        View All <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* System Summary */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 mb-4">System Summary</h3>
                    <div className="flex-1 flex flex-col justify-between">
                        {[
                            { label: 'Total Locations', value: '48', icon: 'pi-users' },
                            { label: 'Total Classrooms', value: '236', icon: 'pi-verified' },
                            { label: 'Completed Trainings', value: '1,245', icon: 'pi-file-edit' },
                            { label: 'Total Touches (7TNT)', value: '12,458', icon: 'pi-link' },
                            { label: 'Total Audio Touches', value: '35,678', icon: 'pi-file' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                                <div className="flex items-center text-gray-600 text-sm font-medium">
                                    <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-500 flex items-center justify-center mr-2">
                                        <i className={`pi ${item.icon} text-[10px]`}></i>
                                    </div>
                                    {item.label}
                                </div>
                                <div className="font-bold text-gray-800">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activities */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 lg:col-span-2 overflow-x-auto flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Activities</h3>
                    <div className="flex-1">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead>
                                <tr className="text-gray-500 font-semibold border-b border-gray-100">
                                    <th className="pb-3 px-2">Activity</th>
                                    <th className="pb-3 px-2">Type</th>
                                    <th className="pb-3 px-2">By</th>
                                    <th className="pb-3 px-2">Location</th>
                                    <th className="pb-3 px-2">Date & Time</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {[
                                    { act: 'New Chart Created: RLLT Chart - Phase 3', type: 'Chart', typeColor: 'bg-indigo-100 text-indigo-700', by: 'Leader John', loc: 'New York, USA', time: 'May 31, 2025 10:30 AM' },
                                    { act: 'Student Enrolled: David Miller', type: 'Student', typeColor: 'bg-blue-100 text-blue-700', by: 'Leader Sarah', loc: 'Chicago, USA', time: 'May 31, 2025 09:45 AM' },
                                    { act: 'Training Content Uploaded: Module 4', type: 'Content', typeColor: 'bg-emerald-100 text-emerald-700', by: 'Admin User', loc: 'London, UK', time: 'May 31, 2025 09:20 AM' },
                                    { act: 'Audio Added: Lesson 08', type: 'Audio', typeColor: 'bg-orange-100 text-orange-700', by: 'Admin User', loc: 'Sydney, Australia', time: 'May 31, 2025 08:15 AM' }
                                ].map((row, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3.5 px-2 font-medium">{row.act}</td>
                                        <td className="py-3.5 px-2"><span className={`${row.typeColor} px-2.5 py-1 rounded-md text-xs font-bold`}>{row.type}</span></td>
                                        <td className="py-3.5 px-2 text-gray-600">{row.by}</td>
                                        <td className="py-3.5 px-2 text-gray-600">{row.loc}</td>
                                        <td className="py-3.5 px-2 text-gray-500 text-xs font-medium">{row.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-indigo-600 font-semibold text-sm flex justify-center items-center cursor-pointer hover:text-indigo-700">
                        View All Activities <i className="pi pi-arrow-right text-xs ml-2"></i>
                    </div>
                </div>

                {/* 7TNT Word Page Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 mb-1">7TNT Word Page Overview</h3>
                    <div className="text-3xl font-black text-[#051220]">12,458</div>
                    <div className="text-xs text-gray-500 font-medium mb-1">Total Touches This Month</div>
                    <div className="text-sm font-semibold text-emerald-500 flex items-center mb-2">
                        <i className="pi pi-arrow-up text-[10px] mr-1"></i> 15% <span className="text-gray-400 font-normal ml-1">vs last month</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end">
                        <WordPageLineChart />
                    </div>

                    <button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-colors shadow-indigo-200">
                        View 7TNT Analytics
                    </button>
                </div>
            </div>
        </div>
    );
}
