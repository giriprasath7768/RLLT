import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';

const SidebarItem = ({ item, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (item.items) {
        return (
            <div className="flex flex-col">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between px-6 py-4 cursor-pointer transition-all duration-200 border-l-4 border-transparent text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    <div className="flex items-center gap-4">
                        <i className={`${item.icon} text-xl`}></i>
                        <span className="text-base tracking-wide">{item.label}</span>
                    </div>
                    <i className={`pi ${isOpen ? 'pi-chevron-down' : 'pi-chevron-right'} text-sm`}></i>
                </div>
                {isOpen && (
                    <div className="bg-gray-800 flex flex-col">
                        {item.items.map((subItem, idx) => (
                            <NavLink
                                key={idx}
                                to={subItem.to}
                                onClick={onClick}
                                className={({ isActive }) =>
                                    `flex items-center gap-4 pl-14 pr-6 py-3 transition-all duration-200 border-l-4 ${isActive
                                        ? 'bg-gray-700 border-white text-white font-bold'
                                        : 'border-transparent text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`
                                }
                            >
                                <i className={`${subItem.icon} text-lg`}></i>
                                <span className="text-sm tracking-wide">{subItem.label}</span>
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={item.to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 transition-all duration-200 border-l-4 ${isActive
                    ? 'bg-gray-700 border-white text-white font-bold'
                    : 'border-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
            }
        >
            <i className={`${item.icon} text-xl`}></i>
            <span className="text-base tracking-wide">{item.label}</span>
        </NavLink>
    );
};

const StudentSidebar = ({ visible, onHide }) => {

    const menuItems = [
        { label: 'Overview Dashboard', icon: 'pi pi-home', to: '/dashboard/student' },
        { label: 'Assessment Results', icon: 'pi pi-chart-line', to: '/dashboard/student/assessment-result' },
        { label: 'My Chart Listings', icon: 'pi pi-chart-bar', to: '/dashboard/student/charts' },
        {
            label: 'Classroom',
            icon: 'pi pi-desktop',
            items: [
                { label: 'My Courses', icon: 'pi pi-home', to: '/dashboard/student/classroom' },
                { label: 'My Assignments', icon: 'pi pi-file-edit', to: '/dashboard/student/classroom/assignments' },
                { label: 'Q&A', icon: 'pi pi-question-circle', to: '/dashboard/student/classroom/qna' },
                { label: '7TNT Word', icon: 'pi pi-file-word', to: '/dashboard/student/7tnt-word' },
                { label: 'Resources', icon: 'pi pi-folder-open', to: '/dashboard/student/classroom/resources' }
            ]
        },
        { label: 'SMT Page', icon: 'pi pi-book', to: '/dashboard/student/book-index' },
        { label: 'Players', icon: 'pi pi-play', to: '/dashboard/student/players' },
        { label: '7 TNT Players', icon: 'pi pi-play', to: '/dashboard/student/7tnt-players' },
        { label: 'Recordings', icon: 'pi pi-microphone', to: '/dashboard/student/recordings' }
    ];

    const SidebarContent = ({ onItemClick }) => (
        <div className="flex flex-col py-4 h-full bg-[#1F2937]">
            <div className="px-6 mb-8 mt-2 flex flex-col items-center">
                <img src="/custom-logo.png" alt="Student Logo" className="w-20 h-20 rounded-full border border-gray-600 mb-3 shadow-md object-cover" />
                <span className="text-white text-sm font-semibold tracking-wider">STUDENT PORTAL</span>
            </div>
            {menuItems.map((item, index) => (
                <SidebarItem key={index} item={item} onClick={onItemClick} />
            ))}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 bg-[#1F2937] border-r border-[#1F2937] flex-shrink-0 min-h-[calc(100vh-80px)] overflow-y-auto sticky top-20">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <PrimeSidebar
                visible={visible}
                onHide={onHide}
                className="w-full sm:w-80 p-0"
                style={{ backgroundColor: '#1F2937' }}
                icons={(
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700 w-full mb-4">
                        <img src="/custom-logo.png" alt="Logo" className="h-8 w-8 rounded-full border border-gray-300 object-cover shadow-sm" />
                        <span className="text-white font-bold text-sm tracking-widest uppercase">Student Menu</span>
                    </div>
                )}
            >
                <div className="h-full">
                    <SidebarContent onItemClick={onHide} />
                </div>
            </PrimeSidebar>
        </>
    );
};

export default StudentSidebar;
