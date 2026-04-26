import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import axios from 'axios';

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

const AdminSidebar = ({ visible, onHide }) => {
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/api/me', { withCredentials: true })
            .then(res => setUserRole(res.data.role))
            .catch(err => console.error("Failed to fetch role", err));
    }, []);

    const menuItems = [
        { label: 'Dashboard', icon: 'pi pi-home', to: userRole === 'leader' ? '/dashboard/leader' : userRole === 'admin' ? '/dashboard/admin' : '/dashboard/super-admin' },
        ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'T-Tom-T Registered Users', icon: 'pi pi-user-plus', to: '/admin/ttom-users' }] : []),
        ...(userRole === 'super_admin' ? [{ label: 'Manage Admin', icon: 'pi pi-shield', to: '/admin/manage-admin' }] : []),

        ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'Manage Leaders', icon: 'pi pi-users', to: '/admin/manage-leaders' }] : []),
        { label: 'Manage Students', icon: 'pi pi-id-card', to: '/admin/manage-students' },
        { label: 'Manage Assessment', icon: 'pi pi-file-edit', to: '/admin/manage-assessment' },
        { label: 'Assessment Results', icon: 'pi pi-chart-line', to: '/admin/assessment-results' },
        ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{
            label: 'Chart Creation',
            icon: 'pi pi-chart-bar',
            items: [
                { label: 'Main Chart', icon: 'pi pi-chart-line', to: '/admin/charts' },
                { label: '7TNT Main Chart', icon: 'pi pi-table', to: '/admin/chart-creation/7tnt-main-chart' },
                { label: '7TNT Day Cycle Chart', icon: 'pi pi-calendar-plus', to: '/admin/chart-creation/7tnt-day-cycle' },
                { label: 'V-Card Chart', icon: 'pi pi-id-card', to: '/admin/chart-listing/vcard-chart' },
                { label: '24x7 Chart', icon: 'pi pi-chart-pie', to: '/admin/twenty-four-seven-chart' },
                { label: 'Light Chart', icon: 'pi pi-sun', to: '/admin/chart-creation/light-chart' }
            ]
        }] : []),
        {
            label: 'Chart Listing',
            icon: 'pi pi-list',
            items: [
                { label: 'Main Chart', icon: 'pi pi-eye', to: '/admin/chart-listing/main-chart' },
                { label: '7TNT Main Chart', icon: 'pi pi-table', to: '/admin/chart-listing/7tnt-main-chart' },
                { label: '7TNT Day Cycle Chart', icon: 'pi pi-table', to: '/admin/chart-listing/7tnt-day-cycle' },
                { label: '7TNT Weekly Chart', icon: 'pi pi-calendar', to: '/admin/chart-listing/7tnt-weekly-chart' },
                { label: 'Morning & Evening', icon: 'pi pi-calendar-plus', to: '/admin/chart-listing/morning-evening-chart' },
                { label: 'DL Size Chart', icon: 'pi pi-table', to: '/admin/chart-listing/dl-size-chart' },
                { label: 'C-Chart Index', icon: 'pi pi-chart-pie', to: '/admin/chart-listing/c-chart' },
                { label: 'Oil Chart', icon: 'pi pi-calendar', to: '/admin/chart-listing/oil-chart' },
                { label: 'Weekly Chart', icon: 'pi pi-calendar', to: '/admin/chart-listing/weekly-chart' },
                { label: '24x7 Chart', icon: 'pi pi-chart-pie', to: '/admin/chart-listing/twenty-four-seven-chart' },
                { label: '24x7 Morning/Evening', icon: 'pi pi-calendar-plus', to: '/admin/chart-listing/twenty-four-seven-morning-evening-chart' },
                { label: '24x7 DL Size Chart', icon: 'pi pi-table', to: '/admin/chart-listing/twenty-four-seven-dl-size-chart' }
            ]
        },
        {
            label: 'Reports',
            icon: 'pi pi-chart-bar',
            items: [
                { label: 'Student Report', icon: 'pi pi-file', to: '/admin/reports/student-report' }
            ]
        },
        {
            label: '7TNT Word',
            icon: 'pi pi-file-word',
            to: '/admin/7tnt-word'
        },
        ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{
            label: 'Library',
            icon: 'pi pi-folder-open',
            items: [
                { label: 'Book Master', icon: 'pi pi-book', to: '/admin/books' },
                { label: 'Chapter Master', icon: 'pi pi-bookmark', to: '/admin/chapters' },
                { label: 'RLLT Table Data', icon: 'pi pi-table', to: '/admin/rllt-data' }
            ]
        }] : []),
        ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{ label: 'Book Index', icon: 'pi pi-book', to: '/admin/book-index' }] : []),
        ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'Recordings', icon: 'pi pi-microphone', to: '/admin/recordings' }] : []),
        ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'Screen Recorder', icon: 'pi pi-desktop', to: '/admin/screen-recorder' }] : []),
        ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'Manage Training Contents', icon: 'pi pi-video', to: '/admin/manage-training' }] : []),
        ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{ label: 'Players', icon: 'pi pi-play', to: '/admin/players' }] : []),
        ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{ label: '7 TNT Players', icon: 'pi pi-play', to: '/admin/7tnt-players' }] : []),
        ...(userRole === 'super_admin' ? [{ label: 'Locations', icon: 'pi pi-map-marker', to: '/admin/locations' }] : []),
    ];

    const SidebarContent = ({ onItemClick }) => (
        <div className="flex flex-col py-4 h-full bg-[#1F2937]">
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
                        <span className="text-white font-bold text-sm tracking-widest uppercase">Menu</span>
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

export default AdminSidebar;
