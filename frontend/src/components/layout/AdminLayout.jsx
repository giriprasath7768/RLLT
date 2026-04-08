import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
    const [sidebarVisible, setSidebarVisible] = useState(false);

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Header / AppBar */}
            <AdminHeader onMenuToggle={() => setSidebarVisible(true)} />
            
            <div className="flex flex-grow">
                {/* Sidebar */}
                <AdminSidebar 
                    visible={sidebarVisible} 
                    onHide={() => setSidebarVisible(false)} 
                />

                {/* Page Content */}
                <main className="flex-grow bg-gray-50/30 min-w-0">
                    <div className="w-full h-full overflow-x-hidden">
                        <Outlet />
                    </div>
                </main>
            </div>
            
            {/* Optional Footer */}
            <footer className="py-4 px-4 sm:py-6 sm:px-8 border-t border-gray-50 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-center sm:justify-between items-center text-[11px] sm:text-[12px] text-gray-400 bg-white text-center">
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
