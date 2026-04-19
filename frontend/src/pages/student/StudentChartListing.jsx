import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { InputText } from 'primereact/inputtext';

const StudentChartListing = () => {
    const [assignedCharts, setAssignedCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                // Fetch all charts
                const chartsRes = await axios.get('http://localhost:8000/api/charts/list', { withCredentials: true });
                const allCharts = chartsRes.data;

                // Fetch student assignments
                const assignmentsRes = await axios.get('http://localhost:8000/api/assignments/my', { withCredentials: true });
                const assignments = assignmentsRes.data;

                const mapped = [];

                assignments.forEach(assignment => {
                    const chartData = allCharts.find(c => c.id === assignment.chart_id);
                    if (chartData) {
                        const payloadStr = chartData.state_payload || "";
                        const is24x7 = payloadStr.includes('"m4b"');

                        mapped.push({
                            assignment,
                            chartData,
                            is24x7,
                            chartName: chartData.banner_text || `Module ${chartData.module} / Phase ${chartData.phase}`,
                            trackingDays: assignment.chart_type
                        });
                    }
                });

                setAssignedCharts(mapped);
            } catch (error) {
                console.error("Failed to fetch chart assignments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    const navigateToChart = (routePath, chartData, assignment) => {
        navigate(`/dashboard/student/chart-listing/${routePath}`, {
            state: {
                chartData,
                assignment
            }
        });
    };

    const validateSearch = (e) => {
        setSearchQuery(e.target.value);
        setFirst(0); // reset to first page on search
    };

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const filteredCharts = assignedCharts.filter(item => item.chartName.toLowerCase().includes(searchQuery.toLowerCase()));
    const paginatedCharts = filteredCharts.slice(first, first + rows);

    if (loading) {
        return <div className="p-10 flex justify-center text-white"><i className="pi pi-spin pi-spinner text-4xl text-[#c8a165]"></i></div>;
    }

    return (
        <div className="w-full flex justify-center py-8 px-4 sm:px-6">
            <div className="w-full max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-[#051220] tracking-tight mb-2">Assigned Charts</h1>
                        <p className="text-gray-500 text-lg">Click on any chart format below to view your personalized configurations.</p>
                    </div>
                    {assignedCharts.length > 0 && (
                        <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                            <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                            <InputText
                                type="search"
                                value={searchQuery}
                                onChange={validateSearch}
                                placeholder="Search by chart name..."
                                className="w-full md:w-72 pl-10 text-black py-2 border border-gray-300 rounded-md bg-white"
                            />
                        </span>
                    )}
                </div>

                {assignedCharts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
                        <i className="pi pi-folder-open text-6xl text-gray-300 mb-4"></i>
                        <h2 className="text-2xl font-bold text-gray-800">No Charts Assigned</h2>
                        <p className="text-gray-500 mt-2">You currently do not have any active chart assignments.</p>
                    </div>
                ) : filteredCharts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800">No matching charts found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {paginatedCharts.map((item, idx) => {
                            const { assignment, chartData, is24x7, chartName, trackingDays } = item;

                            // Define the variants based on 24x7 or Main
                            const variants = is24x7 ? [
                                { label: '24/7 to 7 Chart', icon: 'pi-calendar', route: 'twenty-four-seven-chart', color: 'bg-indigo-500' },
                                { label: '24/7 Morning & Evening', icon: 'pi-sun', route: 'twenty-four-seven-morning-evening', color: 'bg-orange-500' },
                                { label: '24/7 DLL Size Chart', icon: 'pi-chart-bar', route: 'twenty-four-seven-dl-size-chart', color: 'bg-blue-500' },
                            ] : [
                                { label: 'Main Chart', icon: 'pi-table', route: 'main-chart', color: 'bg-blue-600' },
                                { label: '7TNT Main Chart', icon: 'pi-table', route: '7tnt-main-chart', color: 'bg-green-600' },
                                { label: '7TNT Day Cycle', icon: 'pi-table', route: '7tnt-day-cycle', color: 'bg-emerald-500' },
                                { label: '7TNT Weekly', icon: 'pi-calendar', route: '7tnt-weekly-chart', color: 'bg-teal-500' },
                                { label: 'Morning & Evening', icon: 'pi-sun', route: 'morning-evening-chart', color: 'bg-orange-500' },
                                { label: 'DLL Size Chart', icon: 'pi-sort-alt', route: 'dl-size-chart', color: 'bg-purple-600' },
                                { label: 'C Index Chart', icon: 'pi-list', route: 'c-chart', color: 'bg-teal-600' },
                                { label: 'Oil Chart', icon: 'pi-filter', route: 'oil-chart', color: 'bg-amber-600' },
                                { label: 'Weekly Chart', icon: 'pi-calendar-times', route: 'weekly-chart', color: 'bg-rose-500' },
                            ];

                            return (
                                <div key={idx} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                                    <div className="bg-[#051220] px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[4px] border-[#c8a165]">
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-wide">{chartName}</h2>
                                            <div className="text-gray-400 text-sm mt-1 flex gap-4">
                                                <span><i className="pi pi-calendar mr-1"></i> {new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 sm:mt-0 flex gap-2">
                                            <Tag value={trackingDays} severity="warning" className="font-bold uppercase tracking-wider" rounded />
                                            <Tag value={is24x7 ? "24/7 Edition" : "Standard Edition"} severity={is24x7 ? "success" : "info"} className="font-bold uppercase tracking-wider" rounded />
                                        </div>
                                    </div>

                                    <div className="p-6 sm:p-8 bg-gray-50">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {variants.map((v, vIdx) => (
                                                <div
                                                    key={vIdx}
                                                    onClick={() => navigateToChart(v.route, chartData, assignment)}
                                                    className="bg-white border border-gray-200 p-5 rounded-2xl cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-300 flex items-center group relative overflow-hidden"
                                                >
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${v.color}`}></div>
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${v.color} shadow-inner bg-opacity-90 group-hover:scale-110 transition-transform`}>
                                                        <i className={`pi ${v.icon} text-xl`}></i>
                                                    </div>
                                                    <div className="ml-4 flex-1">
                                                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#051220] transition-colors">{v.label}</h3>
                                                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">View Details <i className="pi pi-arrow-right text-[10px] ml-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-px"></i></p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {filteredCharts.length > 0 && (
                    <div className="mt-8">
                        <Paginator
                            first={first}
                            rows={rows}
                            totalRecords={filteredCharts.length}
                            rowsPerPageOptions={[10, 20, 50]}
                            onPageChange={onPageChange}
                            className="bg-transparent border-none"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentChartListing;
