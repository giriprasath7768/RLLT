import React from 'react';

const DonutChart = () => (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="4"></circle>
            {/* Orange 21% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="4" strokeDasharray="21 79" strokeDashoffset="-79"></circle>
            {/* Blue 30% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="-49"></circle>
            {/* Purple 49% */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#6366f1" strokeWidth="4" strokeDasharray="49 51" strokeDashoffset="0"></circle>
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-gray-500 text-xs font-semibold">Total Charts</span>
            <span className="text-2xl font-bold text-gray-800">1,395</span>
        </div>
    </div>
);

const ActivityLineChart = () => (
    <div className="w-full h-48 mt-4 relative">
        <div className="absolute top-0 right-0 flex space-x-4 text-xs font-semibold">
            <div className="flex items-center text-gray-600"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span> Students Enrolled</div>
            <div className="flex items-center text-gray-600"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> T-TomT Registered</div>
        </div>
        <svg className="w-full h-full pt-6" viewBox="0 0 400 130" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="32.5" x2="400" y2="32.5" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="65" x2="400" y2="65" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="97.5" x2="400" y2="97.5" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="130" x2="400" y2="130" stroke="#f3f4f6" strokeWidth="1" />
            
            {/* Purple Line (Students Enrolled) */}
            <path d="M 0 100 C 20 80, 40 50, 60 40 S 100 20, 120 30 S 160 40, 180 20 S 220 40, 240 50 S 280 30, 300 20 S 340 10, 360 20 S 380 0, 400 10" fill="none" stroke="#6366f1" strokeWidth="2.5" />
            <circle cx="60" cy="40" r="3.5" fill="#6366f1" />
            <circle cx="120" cy="30" r="3.5" fill="#6366f1" />
            <circle cx="180" cy="20" r="3.5" fill="#6366f1" />
            <circle cx="240" cy="50" r="3.5" fill="#6366f1" />
            <circle cx="300" cy="20" r="3.5" fill="#6366f1" />
            <circle cx="360" cy="20" r="3.5" fill="#6366f1" />
            
            {/* Green Line (T-TomT Registered) */}
            <path d="M 0 120 C 20 110, 40 90, 60 80 S 100 60, 120 60 S 160 80, 180 70 S 220 80, 240 90 S 280 60, 300 50 S 340 40, 360 20 S 380 10, 400 0" fill="none" stroke="#10b981" strokeWidth="2.5" />
            <circle cx="60" cy="80" r="3.5" fill="#10b981" />
            <circle cx="120" cy="60" r="3.5" fill="#10b981" />
            <circle cx="180" cy="70" r="3.5" fill="#10b981" />
            <circle cx="240" cy="90" r="3.5" fill="#10b981" />
            <circle cx="300" cy="50" r="3.5" fill="#10b981" />
            <circle cx="360" cy="20" r="3.5" fill="#10b981" />
        </svg>
        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
            <span>May 1</span>
            <span>May 8</span>
            <span>May 15</span>
            <span>May 22</span>
            <span>May 31</span>
        </div>
    </div>
);

const WordPageLineChart = () => (
    <div className="w-full h-36 mt-4 relative">
        <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
            <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1="0" y1="0" x2="400" y2="0" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="40" x2="400" y2="40" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="#f3f4f6" strokeWidth="1" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="#f3f4f6" strokeWidth="1" />

            <path d="M 0 100 L 40 80 L 80 80 L 120 50 L 160 40 L 200 60 L 240 70 L 280 40 L 320 50 L 360 20 L 400 10 L 400 120 L 0 120 Z" fill="url(#purpleGradient)" />
            <path d="M 0 100 L 40 80 L 80 80 L 120 50 L 160 40 L 200 60 L 240 70 L 280 40 L 320 50 L 360 20 L 400 10" fill="none" stroke="#6366f1" strokeWidth="2.5" />
            
            <circle cx="40" cy="80" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="80" cy="80" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="120" cy="50" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="160" cy="40" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="200" cy="60" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="240" cy="70" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="280" cy="40" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="320" cy="50" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="360" cy="20" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
            <circle cx="400" cy="10" r="3.5" fill="#fff" stroke="#6366f1" strokeWidth="2"/>
        </svg>
        <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
            <span>May 1</span>
            <span>May 8</span>
            <span>May 15</span>
            <span>May 22</span>
            <span>May 31</span>
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

export default function DashboardSuperAdmin() {
    return (
        <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-6 lg:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-[#051220] tracking-tight">Super Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Welcome back, Super Admin! <span role="img" aria-label="shield">🛡️</span></p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <div className="flex items-center border border-gray-200 bg-white rounded-lg px-4 py-2 text-sm text-gray-600 shadow-sm font-medium cursor-pointer hover:bg-gray-50">
                        <i className="pi pi-calendar mr-2 text-gray-400"></i>
                        May 1 - May 31, 2025
                        <i className="pi pi-chevron-down ml-3 text-gray-400 text-xs"></i>
                    </div>
                    <div className="relative cursor-pointer hover:opacity-80">
                        <i className="pi pi-bell text-xl text-gray-600"></i>
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-white">5</span>
                    </div>
                    <div className="flex items-center space-x-2 border-l border-gray-200 pl-4 cursor-pointer hover:opacity-80">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            SA
                        </div>
                        <div className="text-sm font-semibold text-gray-700 hidden sm:block">Super Admin <i className="pi pi-chevron-down text-[10px] ml-1 text-gray-400"></i></div>
                    </div>
                </div>
            </div>

            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                {[
                    { title: 'Total Admins', val: '32', inc: '12%', icon: 'pi-user', bg: 'bg-indigo-50', color: 'text-indigo-600' },
                    { title: 'Total Leaders', val: '245', inc: '18%', icon: 'pi-user', bg: 'bg-emerald-50', color: 'text-emerald-600' },
                    { title: 'Total Students', val: '4,589', inc: '15%', icon: 'pi-users', bg: 'bg-blue-50', color: 'text-blue-600' },
                    { title: 'T-TomT Registered', val: '1,234', inc: '10%', icon: 'pi-user-plus', bg: 'bg-orange-50', color: 'text-orange-600' },
                    { title: 'Active Locations', val: '48', icon: 'pi-map-marker', bg: 'bg-indigo-50', color: 'text-indigo-600' },
                    { title: 'Total Classrooms', val: '236', icon: 'pi-building', bg: 'bg-blue-50', color: 'text-blue-600' }
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
                {/* Location Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">Location Overview</h3>
                        <div className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded cursor-pointer">View by: Regions <i className="pi pi-chevron-down text-[10px]"></i></div>
                    </div>
                    <div className="relative h-48 w-full bg-blue-50/30 rounded-xl overflow-hidden flex items-center justify-center">
                        {/* Placeholder Map Pattern */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                        
                        {/* Mock Map Bubbles */}
                        <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-200">
                                <span className="text-indigo-700 font-bold text-xs">128</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold mt-1">North America</span>
                        </div>
                        
                        <div className="absolute bottom-1/4 left-1/3 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-200">
                                <span className="text-indigo-700 font-bold text-sm">245</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold mt-1">South America</span>
                        </div>

                        <div className="absolute top-1/4 right-1/3 flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-200">
                                <span className="text-indigo-700 font-bold text-sm">320</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold mt-1">Europe</span>
                        </div>

                        <div className="absolute top-1/2 right-1/4 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-200">
                                <span className="text-indigo-700 font-bold text-lg">980</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-semibold mt-1">Asia</span>
                        </div>
                    </div>
                </div>

                {/* Charts Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-2">Charts Overview</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <DonutChart />
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span><span className="text-gray-600 font-medium">Digital</span></div>
                            <span className="font-bold text-gray-800">680 <span className="text-gray-400 font-normal ml-1">(49%)</span></span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span><span className="text-gray-600 font-medium">Non-Digital</span></div>
                            <span className="font-bold text-gray-800">420 <span className="text-gray-400 font-normal ml-1">(30%)</span></span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span><span className="text-gray-600 font-medium">Audio</span></div>
                            <span className="font-bold text-gray-800">295 <span className="text-gray-400 font-normal ml-1">(21%)</span></span>
                        </div>
                    </div>
                </div>

                {/* Activity Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800">Activity Overview <span className="text-gray-400 font-normal text-sm ml-1">(This Month)</span></h3>
                    </div>
                    <ActivityLineChart />
                </div>
            </div>

            {/* Row 3: Detail Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Digital */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full relative">
                    <h3 className="font-bold text-indigo-600 mb-4 flex items-center"><i className="pi pi-desktop mr-2"></i> Digital</h3>
                    <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FeatureCard icon="pi-users" title="Manage Users" desc="Admins, Leaders, Students..." iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-file" title="Assessments" desc="View Assessment Results" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-chart-bar" title="7TNT Word Page" desc="Track Touches & Analytics" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                            </div>
                            <div>
                                <FeatureCard icon="pi-book" title="Study Materials" desc="Manage Training Contents" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-building" title="Classrooms" desc="Manage Classrooms" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                                <FeatureCard icon="pi-chart-line" title="Reports" desc="View Reports & Analytics" iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-indigo-600 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-indigo-700">
                        View All <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* Non-Digital */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full relative">
                    <h3 className="font-bold text-emerald-600 mb-4 flex items-center"><i className="pi pi-book mr-2"></i> Non-Digital</h3>
                    <div className="flex-1 flex flex-col space-y-1">
                        <FeatureCard icon="pi-file-pdf" title="View Student Reports" desc="Detailed reports & progress" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                        <FeatureCard icon="pi-chart-pie" title="View Created Charts" desc="All location based charts" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                        <FeatureCard icon="pi-print" title="Print Chart" desc="Generate printable charts" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                        <FeatureCard icon="pi-box" title="Distribute Materials" desc="Track distribution status" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-emerald-600 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-emerald-700">
                        View All <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* Audio */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full relative">
                    <h3 className="font-bold text-orange-500 mb-4 flex items-center"><i className="pi pi-headphones mr-2"></i> Audio</h3>
                    <div className="flex-1 flex flex-col space-y-1">
                        <FeatureCard icon="pi-play" title="Audio Players" desc="Access all audio content" iconBg="bg-orange-50" iconColor="text-orange-500" />
                        <FeatureCard icon="pi-verified" title="Track Assistive Touch" desc="Monitor audio engagement" iconBg="bg-orange-50" iconColor="text-orange-500" />
                        <FeatureCard icon="pi-chart-bar" title="Audio Analytics" desc="Detailed audio reports" iconBg="bg-orange-50" iconColor="text-orange-500" />
                        <FeatureCard icon="pi-folder" title="Content Management" desc="Manage audio files" iconBg="bg-orange-50" iconColor="text-orange-500" />
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-orange-500 font-semibold text-sm flex justify-between items-center cursor-pointer hover:text-orange-600">
                        View All <i className="pi pi-arrow-right text-xs"></i>
                    </div>
                </div>

                {/* System Summary */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 mb-4">System Summary</h3>
                    <div className="flex-1 flex flex-col justify-between">
                        {[
                            { label: 'Active Locations', value: '48', icon: 'pi-map-marker' },
                            { label: 'Active Classrooms', value: '236', icon: 'pi-building' },
                            { label: 'Ongoing Trainings', value: '89', icon: 'pi-spin pi-spinner' },
                            { label: 'Completed Trainings', value: '1,245', icon: 'pi-check-circle' },
                            { label: 'Total Touches (7TNT)', value: '12,458', icon: 'pi-wave-pulse' },
                            { label: 'Total Audio Touches', value: '35,678', icon: 'pi-volume-up' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                                <div className="flex items-center text-gray-600 text-sm font-medium">
                                    <i className={`pi ${item.icon} text-indigo-400 mr-2 w-4`}></i> {item.label}
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
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 lg:col-span-2 overflow-x-auto">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Activities</h3>
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead>
                            <tr className="text-gray-500 font-semibold border-b border-gray-100">
                                <th className="pb-3 px-2">Activity</th>
                                <th className="pb-3 px-2">Type</th>
                                <th className="pb-3 px-2">Performed By</th>
                                <th className="pb-3 px-2">Location</th>
                                <th className="pb-3 px-2">Date & Time</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {[
                                { act: 'New Chart Created: RLLT Chart - Phase 2', type: 'Chart', typeColor: 'bg-purple-100 text-purple-700', by: 'Admin John', loc: 'New York, USA', time: 'May 31, 2025 10:30 AM' },
                                { act: 'Leader Assigned: Sarah Johnson', type: 'Leader', typeColor: 'bg-emerald-100 text-emerald-700', by: 'Super Admin', loc: 'London, UK', time: 'May 31, 2025 09:15 AM' },
                                { act: 'Student Enrolled: Michael Brown', type: 'Student', typeColor: 'bg-blue-100 text-blue-700', by: 'Admin Robert', loc: 'Toronto, Canada', time: 'May 31, 2025 08:45 AM' },
                                { act: 'Audio File Uploaded: Lesson 12', type: 'Audio', typeColor: 'bg-orange-100 text-orange-700', by: 'Admin John', loc: 'Sydney, Australia', time: 'May 31, 2025 08:10 AM' }
                            ].map((row, idx) => (
                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-2 font-medium">{row.act}</td>
                                    <td className="py-3 px-2"><span className={`${row.typeColor} px-2.5 py-1 rounded-md text-xs font-bold`}>{row.type}</span></td>
                                    <td className="py-3 px-2 text-gray-600">{row.by}</td>
                                    <td className="py-3 px-2 text-gray-600">{row.loc}</td>
                                    <td className="py-3 px-2 text-gray-500 text-xs font-medium">{row.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 7TNT Word Page Overview */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-1">7TNT Word Page Overview</h3>
                    <div className="text-3xl font-black text-[#051220]">12,458</div>
                    <div className="text-xs text-gray-500 font-medium mb-1">Total Touches This Month</div>
                    <div className="text-sm font-semibold text-emerald-500 flex items-center mb-4">
                        <i className="pi pi-arrow-up text-[10px] mr-1"></i> 15% <span className="text-gray-400 font-normal ml-1">vs last month</span>
                    </div>
                    
                    <div className="flex-1">
                        <WordPageLineChart />
                    </div>

                    <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-colors shadow-indigo-200">
                        View 7TNT Word Page Analytics <i className="pi pi-chevron-down text-xs ml-1 opacity-80"></i>
                    </button>
                </div>
            </div>
        </div>
    );
}
