import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';

const SevenTNTPlayers = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const navigateToPlayer = (chartType, chartName) => {
        const basePath = location.pathname.includes('/dashboard/student') ? '/dashboard/student' : '/admin';
        navigate(`${basePath}/7tnt-player`, {
            state: {
                chartType,
                chartName
            }
        });
    };

    const charts = [
        { id: 'main', label: '7 TNT Main Chart', icon: 'pi-chart-line', color: 'bg-blue-600' },
        { id: 'weekly', label: 'SevenTNT Weekly Chart', icon: 'pi-calendar', color: 'bg-orange-500' },
        { id: 'day_cycle', label: 'SevenTNT Day Cycle Chart', icon: 'pi-sync', color: 'bg-green-600' }
    ];

    const validateSearch = (e) => {
        setSearchQuery(e.target.value);
        setFirst(0);
    };

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const filteredCharts = charts.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
    const paginatedCharts = filteredCharts.slice(first, first + rows);

    return (
        <div className="w-full flex justify-center py-8 px-4 sm:px-6 font-sans">
            <div className="w-full max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-[#051220] tracking-tight mb-2">7 TNT Players</h1>
                        <p className="text-gray-500 text-lg">Select a 7 TNT chart to launch the player.</p>
                    </div>
                    {charts.length > 0 && (
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

                {charts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
                        <i className="pi pi-folder-open text-6xl text-gray-300 mb-4"></i>
                        <h2 className="text-2xl font-bold text-gray-800">No Players Available</h2>
                        <p className="text-gray-500 mt-2">There are currently no charts configured.</p>
                    </div>
                ) : filteredCharts.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800">No matching players found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                            <div className="bg-[#051220] px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[4px] border-[#c8a165]">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-wide">7 TNT Charts Playlist</h2>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 bg-gray-50">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {paginatedCharts.map((chart, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => navigateToPlayer(chart.id, chart.label)}
                                            className="bg-white border border-gray-200 p-5 rounded-2xl cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-300 flex items-center group relative overflow-hidden"
                                        >
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${chart.color}`}></div>
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${chart.color} shadow-inner bg-opacity-90 group-hover:scale-110 transition-transform`}>
                                                <i className={`pi ${chart.icon} text-xl`}></i>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <h3 className="font-bold text-gray-800 text-lg group-hover:text-[#051220] transition-colors">{chart.label}</h3>
                                                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Launch Player <i className="pi pi-arrow-right text-[10px] ml-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-px"></i></p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
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

export default SevenTNTPlayers;
