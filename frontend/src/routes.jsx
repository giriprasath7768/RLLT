import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import AdminLayout from './components/layout/AdminLayout';
import LocationCRUD from './pages/admin/LocationCRUD';
import ResetPassword from './components/auth/ResetPassword';

import AdminManagement from './pages/admin/AdminManagement';
import ManageLeader from './pages/admin/ManageLeader';
import ManageStudents from './pages/admin/ManageStudents';
import ManageAssessment from './pages/admin/ManageAssessment';
import ManageAssessmentResults from './pages/admin/ManageAssessmentResults';
import BookMaster from './pages/admin/BookMaster';
import ChapterMaster from './pages/admin/ChapterMaster';
import MainChart from './pages/admin/MainChart';
import TwentyFourSevenChart from './pages/admin/TwentyFourSevenChart';
import TwentyFourSevenChartView from './pages/admin/TwentyFourSevenChartView';
import TwentyFourSevenMorningEveningChart from './pages/admin/TwentyFourSevenMorningEveningChart';
import MainChartView from './pages/admin/MainChartView';
import MorningEveningChart from './pages/admin/MorningEveningChart';
import DLSizeChart from './pages/admin/DLSizeChart';
import TwentyFourSevenDLSizeChart from './pages/admin/TwentyFourSevenDLSizeChart';
import CChart from './pages/admin/CChart';
import VCardChart from './pages/admin/VCardChart';
import OilChart from './pages/admin/OilChart';
import WeeklyChart from './pages/admin/WeeklyChart';
import SevenTNTMainChartView from './pages/admin/SevenTNTMainChartView';
import SevenTNTWeeklyChart from './pages/admin/SevenTNTWeeklyChart';
import SevenTNTDayCycleChart from './pages/admin/SevenTNTDayCycleChart';
import SevenTNTDayCycleChartView from './pages/admin/SevenTNTDayCycleChartView';
import RLLTTableData from './pages/admin/RLLTTableData';
import TTOMRegisteredUsers from './pages/admin/TTOMRegisteredUsers';

import Register from './pages/Register';
import CreateContent from './pages/admin/CreateContent';
import SevenTNTMainChart from './pages/admin/SevenTNTMainChart';
import LightChart from './pages/admin/LightChart';
import StudentReport from './pages/admin/StudentReport';
import SevenTNTPlayers from './pages/admin/SevenTNTPlayers';
import SevenTNTPlayer from './pages/admin/SevenTNTPlayer';
import TTomTPlayer from './pages/admin/TTomTPlayer';
import SMTPlayer from './pages/admin/SMTPlayer';
import Players from './pages/admin/Players';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import DashboardLeader from './pages/admin/DashboardLeader';
import StudentAssessmentTest from './pages/student/StudentAssessmentTest';
import AssessmentUnderReview from './pages/student/AssessmentUnderReview';
import StudentLayout from './components/layout/StudentLayout';
import DashboardStudent from './pages/student/DashboardStudent';
import StudentAssessmentResult from './pages/student/StudentAssessmentResult';
import StudentChartListing from './pages/student/StudentChartListing';
import StudentPlayers from './pages/student/StudentPlayers';
import Recordings from './pages/Recordings';
import WordEditor from './pages/admin/WordEditor';
import BookIndex from './pages/admin/BookIndex';
import ScreenRecorder from './pages/admin/ScreenRecorder';
import ImageGallery from './pages/admin/ImageGallery';

// Dashboard Components
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
        return <div className="p-10 flex flex-col items-center justify-center h-full">
            <i className="pi pi-lock text-6xl text-red-400 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
            <p className="text-gray-500 mt-2">You don't have permission to view this module.</p>
        </div>;
    }

    return children ? <>{children}</> : <Outlet />;
};

const EnhancedStudentDashboardWrapper = ({ children }) => {
    const [status, setStatus] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8000/api/me', { withCredentials: true })
            .then(res => setStatus(res.data.assessment_status || 'pending'))
            .catch(() => setStatus('error'));
    }, []);

    if (!status) return <div className="p-10 bg-gray-900 text-white min-h-screen flex items-center justify-center font-bold text-xl">Loading Student Portal...</div>;

    if (status === 'pending') {
        return <Navigate to="/dashboard/assessment" replace />;
    } else if (status === 'under_review') {
        return <Navigate to="/dashboard/under-review" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Layout mapping for Super Admin, Admin, and Leader */}
            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'leader']} children={<AdminLayout />} />}>

                {/* Super Admin Restricted Routes */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                    <Route path="/dashboard/super-admin" element={<DashboardSuperAdmin />} />
                    <Route path="/admin/manage-admin" element={<AdminManagement />} />
                    <Route path="/admin/locations" element={<LocationCRUD />} />
                </Route>

                {/* Admin Restricted Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/dashboard/admin" element={<DashboardAdmin />} />
                </Route>

                {/* Leader Restricted Routes */}
                <Route element={<ProtectedRoute allowedRoles={['leader']} />}>
                    <Route path="/dashboard/leader" element={<DashboardLeader />} />
                </Route>

                {/* Open inside Layout (Restricted externally by ['super_admin', 'admin', 'leader']) */}
                {/* Available for Leader as well: */}
                <Route path="/admin/manage-students" element={<ManageStudents />} />
                <Route path="/admin/manage-assessment" element={<ManageAssessment />} />
                <Route path="/admin/assessment-results" element={<ManageAssessmentResults />} />

                <Route path="/admin/chart-listing/twenty-four-seven-chart" element={<TwentyFourSevenChartView />} />
                <Route path="/admin/chart-listing/twenty-four-seven-morning-evening-chart" element={<TwentyFourSevenMorningEveningChart />} />
                <Route path="/admin/chart-listing/main-chart" element={<MainChartView />} />
                <Route path="/admin/chart-listing/morning-evening-chart" element={<MorningEveningChart />} />
                <Route path="/admin/chart-listing/dl-size-chart" element={<DLSizeChart />} />
                <Route path="/admin/chart-listing/twenty-four-seven-dl-size-chart" element={<TwentyFourSevenDLSizeChart />} />
                <Route path="/admin/chart-listing/c-chart" element={<CChart />} />
                <Route path="/admin/chart-listing/vcard-chart" element={<VCardChart />} />
                <Route path="/admin/chart-listing/oil-chart" element={<OilChart />} />
                <Route path="/admin/chart-listing/weekly-chart" element={<WeeklyChart />} />

                {/* Admin/SuperAdmin Restricted Routes */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
                    <Route path="/admin/manage-leaders" element={<ManageLeader />} />
                    <Route path="/admin/settings" element={<div className="p-10"><h1 className="text-2xl font-bold">Settings</h1></div>} />
                    <Route path="/admin/ttom-users" element={<TTOMRegisteredUsers />} />
                </Route>

                {/* Shared Restricted Routes (SuperAdmin, Admin, Leader) */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'leader']} />}>
                    <Route path="/admin/7tnt-word" element={<WordEditor />} />
                    <Route path="/admin/charts" element={<MainChart />} />
                    <Route path="/admin/chart-creation/7tnt-main-chart" element={<SevenTNTMainChart />} />
                    <Route path="/admin/chart-creation/7tnt-day-cycle" element={<SevenTNTDayCycleChart />} />
                    <Route path="/admin/chart-creation/light-chart" element={<LightChart />} />
                    <Route path="/admin/reports/student-report" element={<StudentReport />} />
                    <Route path="/admin/chart-listing/7tnt-main-chart" element={<SevenTNTMainChartView />} />
                    <Route path="/admin/chart-listing/7tnt-weekly-chart" element={<SevenTNTWeeklyChart />} />
                    <Route path="/admin/chart-listing/7tnt-day-cycle" element={<SevenTNTDayCycleChartView />} />
                    <Route path="/admin/twenty-four-seven-chart" element={<TwentyFourSevenChart />} />
                    <Route path="/admin/books" element={<BookMaster />} />
                    <Route path="/admin/chapters" element={<ChapterMaster />} />
                    <Route path="/admin/rllt-data" element={<RLLTTableData />} />
                    <Route path="/admin/image-gallery" element={<ImageGallery />} />
                    <Route path="/admin/smt-player" element={<SMTPlayer />} />
                    <Route path="/admin/book-index" element={<BookIndex />} />
                    <Route path="/admin/players" element={<Players />} />
                    <Route path="/admin/7tnt-players" element={<SevenTNTPlayers />} />
                    <Route path="/admin/7tnt-player" element={<SevenTNTPlayer />} />
                </Route>

                {/* Restricted Routes (SuperAdmin, Admin only) for specific items removed from Leader */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
                    <Route path="/admin/create-training" element={<CreateContent />} />
                    <Route path="/admin/manage-training" element={<CreateContent />} />
                    <Route path="/admin/recordings" element={<Recordings />} />
                    <Route path="/admin/screen-recorder" element={<ScreenRecorder />} />
                </Route>
            </Route>

            {/* Student Dashboard Layout mapped for 'student' role */}
            <Route element={<ProtectedRoute allowedRoles={['student']} children={<EnhancedStudentDashboardWrapper><StudentLayout /></EnhancedStudentDashboardWrapper>} />}>
                <Route path="/dashboard/student" element={<DashboardStudent />} />
                <Route path="/dashboard/student/assessment-result" element={<StudentAssessmentResult />} />
                <Route path="/dashboard/student/charts" element={<StudentChartListing />} />
                <Route path="/dashboard/student/players" element={<StudentPlayers />} />
                <Route path="/dashboard/student/smt-player" element={<SMTPlayer />} />
                <Route path="/dashboard/student/book-index" element={<BookIndex />} />
                <Route path="/dashboard/student/recordings" element={<Recordings />} />

                {/* Dynamically Reused Chart Interfaces (Preloaded with User Data) */}
                <Route path="/dashboard/student/chart-listing/twenty-four-seven-chart" element={<TwentyFourSevenChartView />} />
                <Route path="/dashboard/student/chart-listing/twenty-four-seven-morning-evening" element={<TwentyFourSevenMorningEveningChart />} />
                <Route path="/dashboard/student/chart-listing/twenty-four-seven-dl-size-chart" element={<TwentyFourSevenDLSizeChart />} />
                <Route path="/dashboard/student/chart-listing/main-chart" element={<MainChartView />} />
                <Route path="/dashboard/student/chart-listing/7tnt-main-chart" element={<SevenTNTMainChartView />} />
                <Route path="/dashboard/student/chart-listing/7tnt-weekly-chart" element={<SevenTNTWeeklyChart />} />
                <Route path="/dashboard/student/chart-listing/7tnt-day-cycle" element={<SevenTNTDayCycleChartView />} />
                <Route path="/dashboard/student/chart-listing/morning-evening-chart" element={<MorningEveningChart />} />
                <Route path="/dashboard/student/chart-listing/dl-size-chart" element={<DLSizeChart />} />
                <Route path="/dashboard/student/chart-listing/c-chart" element={<CChart />} />
                <Route path="/dashboard/student/chart-listing/oil-chart" element={<OilChart />} />
                <Route path="/dashboard/student/weekly-chart" element={<WeeklyChart />} />
                <Route path="/dashboard/student/7tnt-word" element={<WordEditor />} />
                <Route path="/dashboard/student/7tnt-players" element={<SevenTNTPlayers />} />
                <Route path="/dashboard/student/7tnt-player" element={<SevenTNTPlayer />} />
            </Route>

            {/* Other Dashboards */}
            <Route path="/dashboard/assessment" element={<ProtectedRoute allowedRoles={['student']}><StudentAssessmentTest /></ProtectedRoute>} />
            <Route path="/dashboard/under-review" element={<ProtectedRoute allowedRoles={['student']}><AssessmentUnderReview /></ProtectedRoute>} />
            <Route path="/dashboard/ttom/player" element={<ProtectedRoute allowedRoles={['ttom_user']}><TTomTPlayer /></ProtectedRoute>} />
            <Route path="/admin/ttomt-player" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'leader']}><TTomTPlayer /></ProtectedRoute>} />
            <Route path="/dashboard/student/ttomt-player" element={<ProtectedRoute allowedRoles={['student']}><EnhancedStudentDashboardWrapper><TTomTPlayer /></EnhancedStudentDashboardWrapper></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DefaultDashboard /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default AppRoutes;
