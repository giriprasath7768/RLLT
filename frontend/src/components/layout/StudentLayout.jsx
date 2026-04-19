import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import StudentSidebar from './StudentSidebar';

const StudentLayout = () => {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const location = useLocation();

    // Hide Topbar, Sidebar, and Footer when navigating to Book Index to allow immersive full-screen UX
    const isFullScreenMode = location.pathname.includes('/book-index');

    if (isFullScreenMode) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex flex-col font-sans">
                <main className="flex-grow min-w-0 h-screen">
                    <Outlet />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header / AppBar (Reuses existing nice AdminHeader which handles Profile overlays seamlessly) */}
            <AdminHeader onMenuToggle={() => setSidebarVisible(true)} />

            <div className="flex flex-grow">
                {/* Sidebar tailored purely for Students */}
                <StudentSidebar
                    visible={sidebarVisible}
                    onHide={() => setSidebarVisible(false)}
                />

                {/* Main Content Pane */}
                <main className="flex-grow bg-[#F3F4F6] min-w-0 flex flex-col items-center">
                    <div className="w-full max-w-screen-2xl p-4 sm:p-8 h-full overflow-y-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            <footer className="py-4 px-4 sm:py-6 sm:px-8 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-center sm:justify-between items-center text-[12px] text-gray-500 bg-white">
                <span>© 2026 App Creators Media. All rights reserved.</span>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
                    <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                </div>
            </footer>
        </div>
    );
};

export default StudentLayout;
