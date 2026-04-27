import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { InputText } from 'primereact/inputtext';

const StudentPlayers = () => {
    const [assignedCharts, setAssignedCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch assignments for the student to only show players they have access to
        const fetchAssignments = async () => {
            try {
                const assignmentRes = await axios.get('http://' + window.location.hostname + ':8000/api/assignments/my', { withCredentials: true });
                const assignments = assignmentRes.data;
                if (assignments.length === 0) {
                    setAssignedCharts([]);
                    setLoading(false);
                    return;
                }

                const allChartsRes = await axios.get('http://' + window.location.hostname + ':8000/api/charts/list', { withCredentials: true });
                const allCharts = allChartsRes.data;

                const mapped = [];

                assignments.forEach(assignment => {
                    const chartData = allCharts.find(c => String(c.id) === String(assignment.chart_id));
                    if (chartData) {
                        const payloadStr = chartData.state_payload || "";
                        const is24x7 = payloadStr.includes('"m4b"');
                        const trackingDaysLabel = chartData.tracking_days ? `${chartData.tracking_days} Days` : '30 Days';

                        mapped.push({
                            assignment,
                            chartData,
                            is24x7,
                            chartName: chartData.banner_text || `Module ${chartData.module} / Phase ${chartData.phase}`,
                            trackingDays: trackingDaysLabel
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

    const navigateToPlayer = (chartData, filter, days, isTtomT) => {
        const queryDays = days === '40 Days' ? 40 : 30;
        if (isTtomT) {
            navigate(`/dashboard/student/ttomt-player?days=${queryDays}`, {
                state: {
                    payload: chartData.state_payload,
                    module: chartData.module,
                    facet: chartData.facet,
                    phase: chartData.phase,
                    filter: filter
                }
            });
        } else {
            navigate(`/dashboard/student/smt-player?days=${queryDays}`, {
                state: {
                    payload: chartData.state_payload,
                    module: chartData.module,
                    facet: chartData.facet,
                    phase: chartData.phase,
                    filter: filter
                }
            });
        }
    };

    const validateSearch = (e) => {
        setSearchQuery(e.target.value);
        setFirst(0);
    };

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const filteredCharts = assignedCharts.filter(item => item.chartName.toLowerCase().includes(searchQuery.toLowerCase()));
    const paginatedCharts = filteredCharts.slice(first, first + rows);

    if (loading) {
        return <div className="p-10 flex justify-center"><i className="pi pi-spin pi-spinner text-4xl text-[#c8a165]"></i></div>;
    }

    return (
        <div className="w-full flex justify-center py-8 px-4 sm:px-6 font-sans">
            <div className="w-full max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-[#051220] tracking-tight mb-2">Interactive Players</h1>
                        <p className="text-gray-500 text-lg">Access multimedia player environments for your assigned charts.</p>
                    </div>
                    {assignedCharts.length > 0 && (
                        <span className="p-input-icon-left w-full md:w-auto">
                            <i className="pi pi-search" />
                            <InputText
                                value={searchQuery}
                                onChange={validateSearch}
                                placeholder="Search assigned players..."
                                className="w-full md:w-72 rounded-xl"
                            />
                        </span>
                    )}
                </div>

                {assignedCharts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
                        <i className="pi pi-folder-open text-6xl text-gray-300 mb-4"></i>
                        <h2 className="text-2xl font-bold text-gray-800">No Players Available</h2>
                        <p className="text-gray-500 mt-2">You currently do not have any active chart assignments.</p>
                    </div>
                ) : filteredCharts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800">No matching players found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        {paginatedCharts.map((item, idx) => {
                            const { assignment, chartData, is24x7, chartName, trackingDays } = item;

                            const variants = [
                                { label: 'T-Tom-T Player', icon: 'pi-play', filter: 'main', color: 'bg-blue-600', isTtomT: true },
                                { label: 'T-Tom-T (Morning & Evening)', icon: 'pi-play', filter: 'morning_evening', color: 'bg-orange-500', isTtomT: true },
                                { label: 'SM-T Player', icon: 'pi-play-circle', filter: 'main', color: 'bg-gray-600', isTtomT: false }
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
                                                    onClick={() => navigateToPlayer(chartData, v.filter, trackingDays, v.isTtomT)}
                                                    className="bg-white border border-gray-200 p-5 rounded-2xl cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-300 flex items-center group relative overflow-hidden"
                                                >
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${v.color}`}></div>
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${v.color} shadow-inner bg-opacity-90 group-hover:scale-110 transition-transform`}>
                                                        <i className={`pi ${v.icon} text-xl`}></i>
                                                    </div>
                                                    <div className="ml-4 flex-1">
                                                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#051220] transition-colors">{v.label}</h3>
                                                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Launch Player <i className="pi pi-arrow-right text-[10px] ml-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-px"></i></p>
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

export default StudentPlayers;
