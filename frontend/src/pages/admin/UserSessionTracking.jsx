import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ROLE_LABELS = {
    super_admin: { label: 'SUPER ADMIN', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
    admin: { label: 'ADMIN', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
    leader: { label: 'LEADER', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    student: { label: 'STUDENT', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    ttom_user: { label: 'T-TOM-T USER', bg: 'bg-amber-100 text-amber-800 border-amber-200' }
};

const formatDateTimeDisplay = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const datePart = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).toUpperCase();
    const timePart = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).toUpperCase();
    return { datePart, timePart };
};

const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '-';
    const total = Math.max(0, Math.floor(Number(seconds)));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
        return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
};

const UserSessionTracking = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (roleFilter !== 'all') params.set('role', roleFilter);
            if (statusFilter !== 'all') params.set('status_filter', statusFilter);
            if (searchQuery.trim()) params.set('search', searchQuery.trim());
            if (fromDate) params.set('from_date', fromDate);
            if (toDate) params.set('to_date', toDate);
            params.set('tz_offset', String(new Date().getTimezoneOffset()));
            params.set('t', String(Date.now()));

            const res = await axios.get(
                `http://${window.location.hostname}:8000/api/user-sessions?${params.toString()}`,
                { withCredentials: true }
            );
            setSessions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch user sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [roleFilter, statusFilter, fromDate, toDate]);

    const handleResetFilters = () => {
        setRoleFilter('all');
        setStatusFilter('all');
        setSearchQuery('');
        setFromDate('');
        setToDate('');
    };

    const filteredSessions = React.useMemo(() => {
        if (!searchQuery.trim()) return sessions;
        const q = searchQuery.trim().toLowerCase();
        return sessions.filter(s =>
            (s.user_name || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.role || '').toLowerCase().includes(q) ||
            (s.location_name || '').toLowerCase().includes(q)
        );
    }, [sessions, searchQuery]);

    const stats = React.useMemo(() => {
        const total = filteredSessions.length;
        const active = filteredSessions.filter(s => s.session_status === 'active' && !s.logout_time).length;
        const loggedOut = total - active;
        const uniqueUsers = new Set(filteredSessions.map(s => s.user_id)).size;
        return { total, active, loggedOut, uniqueUsers };
    }, [filteredSessions]);

    return (
        <div className="min-h-screen bg-[#f0f4f8] p-4 md:p-6 font-sans text-gray-800">
            <div className="max-w-[1440px] mx-auto space-y-5">
                {/* Header Banner */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center shadow-md shrink-0">
                            <i className="pi pi-history text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-lg md:text-xl font-black text-[#1e3a8a] uppercase tracking-wider">
                                User Session Tracking
                            </h1>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                Track login time, logout time, and session duration across all user roles (Super Admin, Admin, Leader, Student, T-Tom-T)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={fetchSessions}
                            className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 text-xs uppercase tracking-wider transition-all"
                        >
                            <i className={`pi pi-refresh ${loading ? 'pi-spin' : ''}`}></i>
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Total Sessions</div>
                            <div className="text-2xl font-black text-gray-900 mt-1">{stats.total}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                            <i className="pi pi-list text-lg"></i>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider">Active Sessions</div>
                            <div className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i className="pi pi-circle-fill text-sm animate-pulse"></i>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Logged Out</div>
                            <div className="text-2xl font-black text-gray-800 mt-1">{stats.loggedOut}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                            <i className="pi pi-sign-out text-lg"></i>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-[11px] font-extrabold text-purple-600 uppercase tracking-wider">Unique Users</div>
                            <div className="text-2xl font-black text-purple-800 mt-1">{stats.uniqueUsers}</div>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <i className="pi pi-users text-lg"></i>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                Search User / Email / Location
                            </label>
                            <div className="relative">
                                <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by name, email, role, or location..."
                                    className="w-full pl-8 pr-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                User Role
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                            >
                                <option value="all">ALL ROLES</option>
                                <option value="super_admin">SUPER ADMIN</option>
                                <option value="admin">ADMIN</option>
                                <option value="leader">LEADER</option>
                                <option value="student">STUDENT</option>
                                <option value="ttom_user">T-TOM-T USER</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                Session Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-bold border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                            >
                                <option value="all">ALL STATUS</option>
                                <option value="active">ACTIVE (ONLINE)</option>
                                <option value="logged_out">LOGGED OUT</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                Date / From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                max={toDate || undefined}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full px-2.5 py-2 text-xs font-bold border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    To Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={toDate}
                                    min={fromDate || undefined}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-2.5 py-2 text-xs font-bold border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                                />
                            </div>
                            {(roleFilter !== 'all' || statusFilter !== 'all' || searchQuery || fromDate || toDate) && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    title="Clear all filters"
                                    className="px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shrink-0"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1e3a8a] text-white text-[11px] font-extrabold uppercase tracking-wider">
                                    <th className="py-3.5 px-4">#</th>
                                    <th className="py-3.5 px-4">User Name</th>
                                    <th className="py-3.5 px-4">Email / Mobile</th>
                                    <th className="py-3.5 px-4">Role</th>
                                    <th className="py-3.5 px-4">Location</th>
                                    <th className="py-3.5 px-4">Login Time</th>
                                    <th className="py-3.5 px-4">Logout Time</th>
                                    <th className="py-3.5 px-4">Duration</th>
                                    <th className="py-3.5 px-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-gray-500 font-semibold">
                                            <i className="pi pi-spin pi-spinner mr-2"></i> Loading user sessions...
                                        </td>
                                    </tr>
                                ) : filteredSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="py-12 text-center text-gray-500 font-semibold">
                                            No user session records found for the selected criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSessions.map((session, idx) => {
                                        const roleMeta = ROLE_LABELS[session.role] || {
                                            label: String(session.role || 'USER').toUpperCase(),
                                            bg: 'bg-gray-100 text-gray-800 border-gray-200'
                                        };
                                        const loginFormatted = formatDateTimeDisplay(session.login_time);
                                        const logoutFormatted = formatDateTimeDisplay(session.logout_time);
                                        const isOnline = !session.logout_time && session.session_status === 'active';

                                        return (
                                            <tr key={session.id || idx} className="hover:bg-blue-50/40 transition-colors">
                                                <td className="py-3 px-4 font-bold text-gray-500">{idx + 1}</td>
                                                <td className="py-3 px-4 font-extrabold text-gray-900">
                                                    {session.user_name || '-'}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-700">
                                                    {session.email || '-'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${roleMeta.bg}`}>
                                                        {roleMeta.label}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-gray-700">
                                                    {session.location_name || 'All / Global'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {loginFormatted ? (
                                                        <div className="leading-tight">
                                                            <div className="font-extrabold text-gray-900">{loginFormatted.datePart}</div>
                                                            <div className="text-[11px] font-bold text-blue-700">{loginFormatted.timePart}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {logoutFormatted ? (
                                                        <div className="leading-tight">
                                                            <div className="font-extrabold text-gray-900">{logoutFormatted.datePart}</div>
                                                            <div className="text-[11px] font-bold text-red-600">{logoutFormatted.timePart}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-extrabold text-emerald-600 italic">
                                                            Still Logged In
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-extrabold text-gray-800">
                                                    {formatDuration(session.duration_seconds)}
                                                    {isOnline && (
                                                        <span className="ml-1 text-[10px] font-semibold text-emerald-600">(ongoing)</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {isOnline ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                                                            ACTIVE
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gray-100 text-gray-700 border border-gray-300">
                                                            LOGGED OUT
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSessionTracking;
