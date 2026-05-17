import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const location = useLocation();

    // Hide Topbar, Sidebar, and Footer when navigating to Book Index to allow immersive full-screen UX
    const isFullScreenMode = location.pathname.includes('/book-index');

    if (isFullScreenMode) {
        return (
            <div className="min-h-screen bg-gray-50/30 flex flex-col font-sans print:block print:min-h-0 print:h-auto">
                <main className="flex-grow min-w-0 h-screen print:block print:h-auto print:overflow-visible">
                    <Outlet />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans print:block print:min-h-0 print:h-auto">
            {/* Header / AppBar */}
            <div className="print:hidden">
                <AdminHeader onMenuToggle={() => setSidebarVisible(true)} />
            </div>

            <div className="flex flex-grow print:block print:h-auto print:overflow-visible">
                {/* Sidebar */}
                <div className="print:hidden flex flex-col">
                    <AdminSidebar
                        visible={sidebarVisible}
                        onHide={() => setSidebarVisible(false)}
                    />
                </div>

                {/* Page Content */}
                <main className="flex-grow bg-gray-50/30 min-w-0 print:block print:bg-white print:m-0 print:p-0 print:overflow-visible print:h-auto">
                    <div className="w-full h-full overflow-x-hidden print:overflow-visible print:h-auto print:block">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Optional Footer */}
            <footer className="py-4 px-4 sm:py-6 sm:px-8 border-t border-gray-50 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-center sm:justify-between items-center text-[11px] sm:text-[12px] text-gray-400 bg-white text-center print:hidden">
                <span>© 2026 App Creators Media. All rights reserved.</span>
                <div className="flex gap-4">
                    <a href="#" className="hover:text-gray-600">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-600">Terms of Service</a>
                </div>
            </footer>
        </div>
    );
};

export default AdminLayout;
