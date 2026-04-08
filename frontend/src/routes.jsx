import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import AdminLayout from './components/layout/AdminLayout';
import LocationCRUD from './pages/admin/LocationCRUD';

import AdminManagement from './pages/admin/AdminManagement';
import ManageLeader from './pages/admin/ManageLeader';
import ManageStudents from './pages/admin/ManageStudents';
import ManageAssessment from './pages/admin/ManageAssessment';
import BookMaster from './pages/admin/BookMaster';
import ChapterMaster from './pages/admin/ChapterMaster';
import MainChart from './pages/admin/MainChart';
import TwentyFourSevenChart from './pages/admin/TwentyFourSevenChart';
import TwentyFourSevenChartView from './pages/admin/TwentyFourSevenChartView';
import TwentyFourSevenMorningEveningChart from './pages/admin/TwentyFourSevenMorningEveningChart';
import MainChartView from './pages/admin/MainChartView';
import MorningEveningChart from './pages/admin/MorningEveningChart';
import DLSizeChart from './pages/admin/DLSizeChart';
import CChart from './pages/admin/CChart';
import VCardChart from './pages/admin/VCardChart';
import OilChart from './pages/admin/OilChart';
import RLLTTableData from './pages/admin/RLLTTableData';
import Register from './pages/Register';
import CreateContent from './pages/admin/CreateContent';


// Placeholder dashboards
const DashboardSuperAdmin = () => (
    <div className="p-10">
        <div className="mb-8">
            <h1 className="text-3xl font-black text-[#051220] tracking-tight mb-2">Dashboard</h1>
            <p className="text-gray-500">Welcome back, Super Administrator. Here's an overview of your platform.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Users</div>
                <div className="text-4xl font-black text-[#c8a165]">1,284</div>
            </div>
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Active Media</div>
                <div className="text-4xl font-black text-[#051220]">524</div>
            </div>
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Cloud Usage</div>
                <div className="text-4xl font-black text-[#051220]">68%</div>
            </div>
        </div>
    </div>
);

const DashboardAdmin = () => <div className="p-8 text-gray-800"><h1>Admin Dashboard</h1></div>;
const DashboardLeader = () => <div className="p-8 text-gray-800"><h1>Leader Dashboard</h1></div>;
const DashboardStudent = () => <div className="p-8 text-gray-800"><h1>Student Dashboard</h1></div>;
const DashboardTtomUser = () => <div className="p-8 text-gray-800"><h1>TTOM User Dashboard</h1></div>;
const DefaultDashboard = () => <div className="p-8 text-gray-800"><h1>Dashboard</h1></div>;

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/me', { withCredentials: true });
                setIsAuthenticated(true);
                setUserRole(res.data.role);
            } catch (err) {
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, [location.pathname]);

    if (isAuthenticated === null) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return <div className="p-8 text-red-500">Access Denied</div>;
    }

    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<ProtectedRoute allowedRoles={['super_admin']} children={<AdminLayout />} />}>
                <Route path="/dashboard/super-admin" element={<DashboardSuperAdmin />} />
                <Route path="/admin/manage-admin" element={<AdminManagement />} />
                <Route path="/admin/manage-leaders" element={<ManageLeader />} />
                <Route path="/admin/manage-students" element={<ManageStudents />} />
                <Route path="/admin/manage-assessment" element={<ManageAssessment />} />
                <Route path="/admin/create-training" element={<CreateContent />} />
                <Route path="/admin/manage-training" element={<CreateContent />} />
                <Route path="/admin/charts" element={<MainChart />} />
                <Route path="/admin/twenty-four-seven-chart" element={<TwentyFourSevenChart />} />
                <Route path="/admin/chart-listing/twenty-four-seven-chart" element={<TwentyFourSevenChartView />} />
                <Route path="/admin/chart-listing/twenty-four-seven-morning-evening-chart" element={<TwentyFourSevenMorningEveningChart />} />
                <Route path="/admin/chart-listing/main-chart" element={<MainChartView />} />
                <Route path="/admin/chart-listing/morning-evening-chart" element={<MorningEveningChart />} />
                <Route path="/admin/chart-listing/dl-size-chart" element={<DLSizeChart />} />
                <Route path="/admin/chart-listing/c-chart" element={<CChart />} />
                <Route path="/admin/chart-listing/vcard-chart" element={<VCardChart />} />
                <Route path="/admin/chart-listing/oil-chart" element={<OilChart />} />

                <Route path="/admin/books" element={<BookMaster />} />
                <Route path="/admin/chapters" element={<ChapterMaster />} />
                <Route path="/admin/rllt-data" element={<RLLTTableData />} />
                <Route path="/admin/locations" element={<LocationCRUD />} />
                <Route path="/admin/settings" element={<div className="p-10"><h1 className="text-2xl font-bold">Settings</h1></div>} />
            </Route>

            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardAdmin /></ProtectedRoute>} />
            <Route path="/dashboard/leader" element={<ProtectedRoute allowedRoles={['leader']}><DashboardLeader /></ProtectedRoute>} />
            <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']}><DashboardStudent /></ProtectedRoute>} />
            <Route path="/dashboard/ttom" element={<ProtectedRoute allowedRoles={['ttom_user']}><DashboardTtomUser /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DefaultDashboard /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
