import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Players = () => {
    const [charts, setCharts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:8000/api/charts/list', { withCredentials: true })
            .then(res => {
                const mappedCharts = res.data.map(chart => {
                    const trackingDaysLabel = chart.tracking_days ? `${chart.tracking_days} Days` : '30 Days';
                    const chartTypeLabel = chart.chart_type || "Main Chart";

                    return {
                        id: chart.id,
                        name: chart.banner_text || "Unnamed Chart",
                        type: chartTypeLabel,
                        trackingDays: trackingDaysLabel,
                        raw: chart
                    };
                });
                setCharts(mappedCharts);
            })
            .catch(err => console.error("Could not fetch charts list", err))
            .finally(() => setLoading(false));
    }, []);

    const playerActionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    label="T-Tom-T Player"
                    icon="pi pi-play"
                    className="p-button-sm p-button-outlined"
                    severity="info"
                    onClick={() => navigate(`/admin/ttomt-player?days=${rowData.trackingDays === '40 Days' ? 40 : 30}`, {
                        state: {
                            payload: rowData.raw.state_payload,
                            module: rowData.raw.module,
                            facet: rowData.raw.facet,
                            phase: rowData.raw.phase
                        }
                    })}
                />
                <Button
                    label="SM-T Player"
                    icon="pi pi-play-circle"
                    className="p-button-sm p-button-outlined"
                    severity="secondary"
                    onClick={() => console.log('Navigate to SM-T player', rowData)}
                />
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen font-sans">
            <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 m-0">Players</h1>
                        <p className="text-gray-500 mt-1">Select a player layout based on the chart configuration.</p>
                    </div>
                </div>

                <div className="card overflow-hidden w-full hidden md:block">
                    <DataTable
                        value={charts}
                        loading={loading}
                        className="p-datatable-sm w-full custom-admin-table"
                        responsiveLayout="scroll"
                        showGridlines
                        emptyMessage="No charts found."
                    >
                        <Column field="name" header="Chart Name" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                        <Column field="trackingDays" header="Tracking Days" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                        <Column header="Player" body={playerActionBodyTemplate} headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ width: '350px' }}></Column>
                    </DataTable>
                </div>

                {/* Basic Mobile Fallback to ensure buttons are visible */}
                <div className="md:hidden flex flex-col gap-4">
                    {!loading && charts.map(chart => (
                        <div key={chart.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2">
                            <div className="font-bold text-lg text-gray-800">{chart.name}</div>
                            <div className="text-sm text-gray-600"><span className="font-semibold">Duration:</span> {chart.trackingDays}</div>
                            <div className="flex gap-2 mt-2">
                                <Button label="T-Tom-T Player" size="small" outlined severity="info" onClick={() => navigate(`/admin/ttomt-player?days=${chart.trackingDays === '40 Days' ? 40 : 30}`, {
                                    state: {
                                        payload: chart.raw.state_payload,
                                        module: chart.raw.module,
                                        facet: chart.raw.facet,
                                        phase: chart.raw.phase
                                    }
                                })} />
                                <Button label="SM-T Player" size="small" outlined severity="secondary" onClick={() => { }} />
                            </div>
                        </div>
                    ))}
                    {!loading && charts.length === 0 && (
                        <div className="text-gray-500 p-4 border rounded text-center">No charts found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Players;
