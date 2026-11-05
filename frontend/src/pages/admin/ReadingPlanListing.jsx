import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toast } from 'primereact/toast';

const ReadingPlanListing = () => {
    const navigate = useNavigate();
    const toast = useRef(null);

    const [readingPlans, setReadingPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [userRole, setUserRole] = useState(null);

    const host = 'http://' + window.location.hostname + ':8000';

    useEffect(() => {
        axios.get(`${host}/api/me`, { withCredentials: true })
            .then(res => setUserRole(res.data.role))
            .catch(() => {});
    }, []);

    const fetchReadingPlans = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${host}/api/charts/reading-plans`, {
                withCredentials: true
            });
            setReadingPlans(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching reading plans:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Could not load Reading Plan charts list.',
                life: 3000
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReadingPlans();
    }, []);

    const baseRoute = userRole === 'student' ? '/dashboard/student' : '/admin';

    const handleViewChart = (item) => {
        navigate(`${baseRoute}/reading-plan/view`, {
            state: {
                readingPlanId: item.id,
                preselect: {
                    module: item.module,
                    facet: item.facet,
                    phase: item.phase
                }
            }
        });
    };

    const handleDeleteChart = async (item) => {
        if (!window.confirm(`Are you sure you want to delete "${item.chart_name}"?`)) {
            return;
        }
        setDeletingId(item.id);
        try {
            await axios.delete(`${host}/api/charts/reading-plans/${item.id}`, {
                withCredentials: true
            });
            setReadingPlans(prev => prev.filter(p => p.id !== item.id));
            toast.current?.show({
                severity: 'success',
                summary: 'Deleted',
                detail: `"${item.chart_name}" has been deleted.`,
                life: 3000
            });
        } catch (err) {
            console.error('Error deleting reading plan:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Delete Failed',
                detail: 'Could not delete Reading Plan chart.',
                life: 3000
            });
        } finally {
            setDeletingId(null);
        }
    };

    const filteredPlans = readingPlans.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (item.chart_name || '').toLowerCase().includes(q) ||
            (item.created_by || '').toLowerCase().includes(q) ||
            (item.date || '').toLowerCase().includes(q) ||
            (item.time || '').toLowerCase().includes(q) ||
            (item.location || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
            <Toast ref={toast} />

            <div className="max-w-7xl mx-auto">
                {/* Page Header Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-black text-[#0B2149] tracking-tight">
                                Reading Plan Charts
                            </h1>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold bg-[#0B2149] text-white shadow-sm">
                                Total Created: {readingPlans.length}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            View and manage all saved Reading Plan charts with creator details, date, and time.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search chart name, creator, date..."
                                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B2149]"
                            />
                        </div>
                        {userRole !== 'student' && (
                            <button
                                type="button"
                                onClick={() => navigate('/admin/reading-plan')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B2149] hover:bg-[#132f63] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                            >
                                <i className="pi pi-plus text-xs"></i>
                                <span>Create Reading Plan</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabular Listing */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <i className="pi pi-spin pi-spinner text-3xl text-[#0B2149] mb-3"></i>
                            <p className="text-gray-600 font-bold text-sm">Loading Reading Plan charts...</p>
                        </div>
                    ) : filteredPlans.length === 0 ? (
                        <div className="p-12 text-center">
                            <i className="pi pi-book text-4xl text-gray-300 mb-3"></i>
                            <p className="text-gray-600 font-bold text-base mb-1">
                                No Reading Plan charts found
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm mb-4">
                                Generate a chart from the Reading Plan page and click Save Chart to see it listed here.
                            </p>
                            {userRole !== 'student' && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin/reading-plan')}
                                    className="px-4 py-2 rounded-lg bg-[#0B2149] hover:bg-[#132f63] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                                >
                                    Go to Reading Plan Calculator
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#0B2149] text-white text-xs sm:text-sm uppercase tracking-wider">
                                        <th className="py-3.5 px-4 font-bold w-16 text-center">#</th>
                                        <th className="py-3.5 px-4 font-bold">Chart Name</th>
                                        <th className="py-3.5 px-4 font-bold">Created By</th>
                                        <th className="py-3.5 px-4 font-bold text-center">Created On Date</th>
                                        <th className="py-3.5 px-4 font-bold text-center">Created On Time</th>
                                        <th className="py-3.5 px-4 font-bold text-center w-44">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-xs sm:text-sm">
                                    {filteredPlans.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => handleViewChart(item)}
                                            className="hover:bg-blue-50/60 transition-colors cursor-pointer"
                                        >
                                            <td className="py-3.5 px-4 font-bold text-gray-500 text-center">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-extrabold text-[#0B2149] text-sm sm:text-base">
                                                    {item.chart_name}
                                                </div>
                                                <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                                                    Module {item.module} • Facet {item.facet} • Phase {item.phase}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-gray-800">
                                                    {item.created_by || 'Admin'}
                                                </div>
                                                {item.location && (
                                                    <div className="text-[11px] text-gray-500 font-medium">
                                                        {item.location}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gray-700 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-800">
                                                    <i className="pi pi-calendar text-xs text-[#007020]"></i>
                                                    {item.date || '-'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-gray-700 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-800">
                                                    <i className="pi pi-clock text-xs text-[#2563eb]"></i>
                                                    {item.time || '-'}
                                                </span>
                                            </td>
                                            <td
                                                className="py-3.5 px-4 text-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewChart(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#007020] hover:bg-[#008a28] text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                                                        title="View Chart"
                                                    >
                                                        <i className="pi pi-eye text-xs"></i>
                                                        <span>View</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteChart(item)}
                                                        disabled={deletingId === item.id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                                        title="Delete Chart"
                                                    >
                                                        <i className={`pi ${deletingId === item.id ? 'pi-spin pi-spinner' : 'pi-trash'} text-xs`}></i>
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReadingPlanListing;
