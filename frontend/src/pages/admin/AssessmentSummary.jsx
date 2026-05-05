import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { AssessmentService } from '../../services/assessmentService';
import { LocationService } from '../../services/locations';

const TRANSFORMATIONS = ['family', 'finance', 'government', 'spirituality', 'talent', 'training', 'service'];

const getEmptySettings = () => {
    let empty = {};
    TRANSFORMATIONS.forEach(t => {
        empty[t] = {
            description: '',
            low: { range: '', desc: '' },
            moderate: { range: '', desc: '' },
            high: { range: '', desc: '' }
        };
    });
    return empty;
};

const AssessmentSummary = () => {
    const [summaries, setSummaries] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Dialog state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [summaryLocations, setSummaryLocations] = useState([]);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const [summarySettings, setSummarySettings] = useState(getEmptySettings());
    const [isSaving, setIsSaving] = useState(false);
    
    const toast = useRef(null);

    useEffect(() => {
        loadData();
        
        LocationService.getLocations().then(data => {
            const locOptions = data.map(l => ({ label: `${l.city}, ${l.country}`, value: l.id }));
            setSummaryLocations(locOptions);
        }).catch(err => console.error("Could not load locations", err));
    }, []);

    const loadData = () => {
        setLoading(true);
        AssessmentService.getAllSummarySettings()
            .then(data => {
                setSummaries(data);
            })
            .catch(err => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not load summaries' }))
            .finally(() => setLoading(false));
    };

    const openNew = () => {
        setSummarySettings(getEmptySettings());
        setSelectedLocationId(null);
        setDialogVisible(true);
    };

    const editSummary = (rowData) => {
        setSelectedLocationId(rowData.location_id);
        
        // Ensure all properties exist from backend schema
        const populated = getEmptySettings();
        if (rowData.settings) {
            for (const t of TRANSFORMATIONS) {
                if (rowData.settings[t]) {
                    populated[t] = { ...populated[t], ...rowData.settings[t] };
                }
            }
        }
        setSummarySettings(populated);
        setDialogVisible(true);
    };

    const confirmDeleteSummary = (rowData) => {
        if (window.confirm('Are you sure you want to delete these summary settings?')) {
            AssessmentService.deleteSummarySettings(rowData.id)
                .then(() => {
                    toast.current?.show({ severity: 'success', summary: 'Successful', detail: 'Summary Settings Deleted', life: 3000 });
                    loadData();
                })
                .catch(err => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Deletion failed' }));
        }
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const handleSettingChange = (transformation, field, value, subfield = null) => {
        setSummarySettings(prev => {
            const updated = { ...prev };
            if (!updated[transformation]) {
                updated[transformation] = getEmptySettings()[transformation];
            }
            if (subfield) {
                updated[transformation][field] = { ...updated[transformation][field], [subfield]: value };
            } else {
                updated[transformation][field] = value;
            }
            return updated;
        });
    };

    const handleLocationChange = (e) => {
        const newLocationId = e.value;
        setSelectedLocationId(newLocationId);
        
        // Check if settings exist for this location already
        const existing = summaries.find(s => s.location_id === newLocationId);
        if (existing) {
            const populated = getEmptySettings();
            if (existing.settings) {
                for (const t of TRANSFORMATIONS) {
                    if (existing.settings[t]) {
                        populated[t] = { ...populated[t], ...existing.settings[t] };
                    }
                }
            }
            setSummarySettings(populated);
            toast.current?.show({ severity: 'info', summary: 'Loaded', detail: 'Loaded existing settings for this location' });
        } else {
            setSummarySettings(getEmptySettings());
        }
    };

    const handleSave = () => {
        if (!selectedLocationId) {
            toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'Please select a location' });
            return;
        }
        setIsSaving(true);
        AssessmentService.saveSummarySettings(selectedLocationId, summarySettings)
            .then(() => {
                toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Settings saved successfully' });
                hideDialog();
                loadData();
            })
            .catch(err => toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not save settings' }))
            .finally(() => setIsSaving(false));
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined className="mr-2 text-blue-600" onClick={() => editSummary(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteSummary(rowData)} />
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    };

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />

            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 m-0">Assessment Summary</h1>
                    <Button label="Add Summary Settings" icon="pi pi-plus" className="bg-blue-600 text-white font-bold border-none" onClick={openNew} />
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden w-full p-4">
                    <DataTable value={summaries} loading={loading} emptyMessage="No summary settings found." className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines>
                        <Column field="location_name" header="Location" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                        <Column field="created_at" header="Last Updated" sortable body={(rowData) => formatDate(rowData.created_at)} headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ width: '8rem' }} headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                    </DataTable>
                </div>
            </div>

            <Dialog visible={dialogVisible} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-4xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">{selectedLocationId && summaries.find(s => s.location_id === selectedLocationId) ? 'Edit' : 'Add'} Assessment Summary Settings</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>
                        
                        <div className="field mb-6">
                            <label className="font-semibold block mb-2 text-sm text-gray-700">Location <span className="text-red-500">*</span></label>
                            <Dropdown value={selectedLocationId} options={summaryLocations} onChange={handleLocationChange} placeholder="Select a Location" className="w-full" filter />
                            <small className="text-gray-500 block mt-1">Summary settings are bound to specific locations.</small>
                        </div>

                        {selectedLocationId && summarySettings && Object.keys(summarySettings).length > 0 && (
                            <Accordion multiple className="custom-accordion">
                                {TRANSFORMATIONS.map(t => (
                                    <AccordionTab key={t} header={t.charAt(0).toUpperCase() + t.slice(1)}>
                                        <div className="flex flex-col gap-4">
                                            <div className="field">
                                                <label className="font-semibold block mb-1 text-sm text-gray-700">Main Description</label>
                                                <InputTextarea rows={2} value={summarySettings[t]?.description || ''} onChange={(e) => handleSettingChange(t, 'description', e.target.value)} className="w-full" />
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                                <div className="flex flex-col gap-2">
                                                    <h4 className="font-bold text-red-600 m-0">Low</h4>
                                                    <div className="field">
                                                        <label className="text-xs font-semibold text-gray-600">Range (e.g. 0-12)</label>
                                                        <InputText value={summarySettings[t]?.low?.range || ''} onChange={(e) => handleSettingChange(t, 'low', e.target.value, 'range')} className="w-full" />
                                                    </div>
                                                    <div className="field flex-1 flex flex-col">
                                                        <label className="text-xs font-semibold text-gray-600">Description</label>
                                                        <InputTextarea rows={3} value={summarySettings[t]?.low?.desc || ''} onChange={(e) => handleSettingChange(t, 'low', e.target.value, 'desc')} className="w-full flex-1" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col gap-2 md:border-l md:border-r border-gray-200 md:px-4">
                                                    <h4 className="font-bold text-yellow-600 m-0">Moderate</h4>
                                                    <div className="field">
                                                        <label className="text-xs font-semibold text-gray-600">Range (e.g. 13-24)</label>
                                                        <InputText value={summarySettings[t]?.moderate?.range || ''} onChange={(e) => handleSettingChange(t, 'moderate', e.target.value, 'range')} className="w-full" />
                                                    </div>
                                                    <div className="field flex-1 flex flex-col">
                                                        <label className="text-xs font-semibold text-gray-600">Description</label>
                                                        <InputTextarea rows={3} value={summarySettings[t]?.moderate?.desc || ''} onChange={(e) => handleSettingChange(t, 'moderate', e.target.value, 'desc')} className="w-full flex-1" />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex flex-col gap-2">
                                                    <h4 className="font-bold text-green-600 m-0">High</h4>
                                                    <div className="field">
                                                        <label className="text-xs font-semibold text-gray-600">Range (e.g. 25-36)</label>
                                                        <InputText value={summarySettings[t]?.high?.range || ''} onChange={(e) => handleSettingChange(t, 'high', e.target.value, 'range')} className="w-full" />
                                                    </div>
                                                    <div className="field flex-1 flex flex-col">
                                                        <label className="text-xs font-semibold text-gray-600">Description</label>
                                                        <InputTextarea rows={3} value={summarySettings[t]?.high?.desc || ''} onChange={(e) => handleSettingChange(t, 'high', e.target.value, 'desc')} className="w-full flex-1" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTab>
                                ))}
                            </Accordion>
                        )}

                        {!selectedLocationId && (
                            <div className="text-center p-8 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                                Please select a location to enter settings.
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <Button label="Close" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save Settings" severity="success" onClick={handleSave} disabled={!selectedLocationId || isSaving} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default AssessmentSummary;
