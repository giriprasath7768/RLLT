import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { Toolbar } from 'primereact/toolbar';
import { FileUpload } from 'primereact/fileupload';
import { Paginator } from 'primereact/paginator';
import * as XLSX from 'xlsx';
import '../../assets/css/AdminManagement.css';
import MobileDataCard from '../../components/common/MobileDataCard';

const RLLTTableData = () => {
    let emptyRecord = {
        id: null,
        module: 1,
        facet: 1,
        phase: 1,
        day: 1,
        art: '',
        scheduled_value_days: 1,
        ot_bks: '',
        nt_bks: '',
        we5: '',
        pro: '',
        psa: '',
        chp: 0,
        ver: 0,
        ppl: ''
    };

    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [selectedRecords, setSelectedRecords] = useState(null);

    // CRUD state
    const [recordDialog, setRecordDialog] = useState(false);
    const [deleteRecordDialog, setDeleteRecordDialog] = useState(false);
    const [deleteSelectedDialog, setDeleteSelectedDialog] = useState(false);
    const [importDialog, setImportDialog] = useState(false);
    const [record, setRecord] = useState(emptyRecord);
    const [submitted, setSubmitted] = useState(false);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(15);
    const dt = useRef(null);
    const toast = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://' + window.location.hostname + ':8000/api/rllt_lookup', { withCredentials: true });
            setDataList(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching RLLT data:', error);
            setLoading(false);
        }
    };

    const openNew = () => {
        setRecord(emptyRecord);
        setSubmitted(false);
        setRecordDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setRecordDialog(false);
    };

    const hideDeleteRecordDialog = () => {
        setDeleteRecordDialog(false);
    };

    const hideDeleteSelectedDialog = () => {
        setDeleteSelectedDialog(false);
    };

    const saveRecord = async () => {
        setSubmitted(true);
        if (record.module && record.facet && record.phase && record.art.trim()) {
            let _dataList = [...dataList];
            let _record = { ...record };

            try {
                if (record.id) {
                    const response = await axios.put(`http://${window.location.hostname}:8000/api/rllt_lookup/${record.id}`, _record, { withCredentials: true });
                    const index = findIndexById(record.id);
                    _dataList[index] = response.data;
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Record Updated', life: 3000 });
                } else {
                    const response = await axios.post('http://' + window.location.hostname + ':8000/api/rllt_lookup/', _record, { withCredentials: true });
                    _dataList.push(response.data);
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Record Created', life: 3000 });
                }
                setDataList(_dataList);
                setRecordDialog(false);
                setRecord(emptyRecord);
            } catch (error) {
                console.error("Save error: ", error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to save record', life: 3000 });
            }
        }
    };

    const editRecord = (rec) => {
        setRecord({ ...rec });
        setRecordDialog(true);
    };

    const confirmDeleteRecord = (rec) => {
        setRecord(rec);
        setDeleteRecordDialog(true);
    };

    const deleteRecord = async () => {
        try {
            await axios.delete(`http://${window.location.hostname}:8000/api/rllt_lookup/${record.id}`, { withCredentials: true });
            let _dataList = dataList.filter((val) => val.id !== record.id);
            setDataList(_dataList);
            setDeleteRecordDialog(false);
            setRecord(emptyRecord);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Record Deleted', life: 3000 });
        } catch (error) {
            console.error("Delete error: ", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete record', life: 3000 });
        }
    };

    const confirmDeleteSelected = () => {
        setDeleteSelectedDialog(true);
    };

    const deleteSelectedRecords = async () => {
        try {
            setLoading(true);
            await Promise.all(selectedRecords.map(rec => 
                axios.delete(`http://${window.location.hostname}:8000/api/rllt_lookup/${rec.id}`, { withCredentials: true })
            ));
            
            let _dataList = dataList.filter(val => !selectedRecords.some(selected => selected.id === val.id));
            setDataList(_dataList);
            setDeleteSelectedDialog(false);
            setSelectedRecords(null);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Records Deleted', life: 3000 });
        } catch (error) {
            console.error("Bulk delete error: ", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete selected records', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const [clearAllDialog, setClearAllDialog] = useState(false);

    const confirmClearAll = () => {
        setClearAllDialog(true);
    };

    const clearAllData = async () => {
        try {
            setLoading(true);
            await axios.delete(`http://${window.location.hostname}:8000/api/rllt_lookup/bulk/all`, { withCredentials: true });
            setDataList([]);
            setClearAllDialog(false);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'All Data Cleared', life: 3000 });
        } catch (error) {
            console.error("Clear all error: ", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to clear all data', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const findIndexById = (id) => {
        let index = -1;
        for (let i = 0; i < dataList.length; i++) {
            if (dataList[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _rec = { ...record };
        _rec[`${name}`] = val;
        setRecord(_rec);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _rec = { ...record };
        _rec[`${name}`] = val;
        setRecord(_rec);
    };

    const handleExcelImportSubmit = (e) => {
        const file = e.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found to import.' });
                    e.options.clear();
                    return;
                }

                    const parsedRllt = data.map(row => {
                        const normalized = {};
                        Object.keys(row).forEach(k => {
                            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                            normalized[cleanKey] = row[k];
                        });
                        
                        const getVal = (keys) => {
                            for (let key of keys) {
                                if (normalized[key] !== undefined && normalized[key] !== null && normalized[key] !== '') {
                                    return normalized[key];
                                }
                            }
                            return undefined;
                        };

                        const getStr = (keys) => {
                            const val = getVal(keys);
                            return val !== undefined ? String(val).trim() : '';
                        };

                        const getInt = (keys) => {
                            const val = parseInt(getVal(keys));
                            return isNaN(val) ? 0 : val;
                        };
    
                        return {
                            module: getInt(['module']),
                            facet: getInt(['facet']),
                            phase: getInt(['phase']),
                            day: getInt(['day']),
                            art: getStr(['arttime', 'art', 'artstring']),
                            scheduled_value_days: getInt(['scheduleddays', 'scheduled', 'scheduledvaluedays']),
                            ot_bks: getStr(['otbks', 'ot', 'otbk', 'oldtestament']),
                            nt_bks: getStr(['ntbks', 'nt', 'ntbk', 'newtestament']),
                            we5: getStr(['we5', 'we']),
                            pro: getStr(['pro']),
                            psa: getStr(['psa']),
                            chp: getInt(['chp', 'chapter', 'chapters']),
                            ver: getInt(['ver', 'verse', 'verses']),
                            ppl: getStr(['ppl'])
                        };
                    }).filter(r => r.module > 0 && r.facet > 0);

                if (parsedRllt.length === 0) {
                    toast.current.show({ severity: 'error', summary: 'Mapping Failed', detail: 'Could not match required columns (Module, Facet, etc) from the Excel file.' });
                    e.options.clear();
                    return;
                }

                setLoading(true);
                axios.post('http://' + window.location.hostname + ':8000/api/rllt_lookup/bulk', parsedRllt, { withCredentials: true })
                    .then(res => {
                        toast.current.show({ severity: 'success', summary: 'Success', detail: res.data.message || 'Imported RLLT Data successfully', life: 3000 });
                        setImportDialog(false);
                        fetchData();
                    })
                    .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to import bulk RLLT parameters' }))
                    .finally(() => {
                        setLoading(false);
                        e.options.clear();
                    });

            } catch (err) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not parse Excel file.' });
                e.options.clear();
            }
        };
        reader.readAsBinaryString(file);
    };

    const topCardContent = (
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between w-full">
            <div className="flex flex-wrap gap-2">
                <Button label="New Lookup" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
                <Button label="Import Excel" icon="pi pi-upload" severity="help" onClick={() => setImportDialog(true)} className="hidden md:flex" />
                <Button label="Clear All Data" icon="pi pi-trash" severity="danger" onClick={confirmClearAll} className="hidden md:flex" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedRecords || !selectedRecords.length} className="hidden md:flex" />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined severity="info" className="mr-2" onClick={() => editRecord(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteRecord(rowData)} />
            </React.Fragment>
        );
    };

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">RLLT Map Explorer</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const recordDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" severity="success" onClick={saveRecord} />
        </React.Fragment>
    );

    const deleteRecordDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteRecordDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteRecord} />
        </React.Fragment>
    );

    const deleteSelectedDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteSelectedDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteSelectedRecords} />
        </React.Fragment>
    );

    const clearAllDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={() => setClearAllDialog(false)} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={clearAllData} />
        </React.Fragment>
    );

    const filteredData = dataList.filter(rec => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (rec.module && rec.module.toString().includes(search)) ||
            (rec.facet && rec.facet.toString().includes(search)) ||
            (rec.phase && rec.phase.toString().includes(search)) ||
            (rec.day && rec.day.toString().includes(search)) ||
            (rec.art && rec.art.toLowerCase().includes(search))
        );
    });

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />
            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                    {topCardContent}
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                    <DataTable ref={dt} value={dataList} dataKey="id"
                        selection={selectedRecords} onSelectionChange={(e) => setSelectedRecords(e.value)}
                        paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        loading={loading} globalFilter={globalFilter} header={tableHeader}
                        className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'} emptyMessage="No settings configured.">
                        <Column selectionMode="multiple" exportable={false} style={{ width: '3rem' }}></Column>
                        <Column header="S.No" body={(data, options) => options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="module" header="Module" sortable style={{ width: '15%' }} headerClassName="admin-table-header"></Column>
                        <Column field="facet" header="Facet" sortable style={{ width: '15%' }} headerClassName="admin-table-header"></Column>
                        <Column field="phase" header="Phase" sortable style={{ width: '15%' }} headerClassName="admin-table-header"></Column>
                        <Column field="day" header="Day" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="art" header="ART Time" sortable style={{ width: '10%' }} headerClassName="admin-table-header"></Column>
                        <Column field="scheduled_value_days" header="Scheduled Days" sortable style={{ width: '10%' }} headerClassName="admin-table-header"></Column>
                        <Column field="ot_bks" header="O.T BKS" sortable style={{ width: '10%' }} headerClassName="admin-table-header"></Column>
                        <Column field="nt_bks" header="N.T BKS" sortable style={{ width: '10%' }} headerClassName="admin-table-header"></Column>
                        <Column field="we5" header="WE5" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="pro" header="PRO" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="psa" header="PSA" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="chp" header="CHP" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="ver" header="VER" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="ppl" header="PPL" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column header="Activity" body={actionBodyTemplate} exportable={false} style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredData.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    {filteredData.length > 0 ? (
                        filteredData.map(rec => (
                            <MobileDataCard
                                key={rec.id}
                                title={`Module ${rec.module} - Facet ${rec.facet}`}
                                data={[
                                    { label: 'Phase', value: rec.phase },
                                    { label: 'Day', value: rec.day },
                                    { label: 'ART Time', value: rec.art },
                                    { label: 'Scheduled Days', value: rec.scheduled_value_days }
                                ]}
                                onEdit={() => editRecord(rec)}
                                onDelete={() => confirmDeleteRecord(rec)}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No settings configured.
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="block md:hidden fixed bottom-6 right-6 z-50">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success shadow-lg" size="large" onClick={openNew} aria-label="Add New" />
            </div>

            <Dialog visible={recordDialog} style={{ width: '30rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Schedule Mapping Lookup" modal className="p-fluid" footer={recordDialogFooter} onHide={hideDialog}>

                <div className="formgrid grid grid-cols-2 gap-4 mt-4 mb-4">
                    <div className="field col-6">
                        <label htmlFor="module" className="font-bold block mb-2">Module Number</label>
                        <InputNumber id="module" value={record.module} onValueChange={(e) => onInputNumberChange(e, 'module')} useGrouping={false} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="facet" className="font-bold block mb-2">Facet Number</label>
                        <InputNumber id="facet" value={record.facet} onValueChange={(e) => onInputNumberChange(e, 'facet')} useGrouping={false} />
                    </div>
                </div>

                <div className="formgrid grid grid-cols-2 gap-4 mb-4">
                    <div className="field col-6">
                        <label htmlFor="phase" className="font-bold block mb-2">Phase Number</label>
                        <InputNumber id="phase" value={record.phase} onValueChange={(e) => onInputNumberChange(e, 'phase')} useGrouping={false} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="day" className="font-bold block mb-2">Day Interval</label>
                        <InputNumber id="day" value={record.day} onValueChange={(e) => onInputNumberChange(e, 'day')} useGrouping={false} />
                    </div>
                </div>

                <div className="field mb-4">
                    <label htmlFor="art" className="font-bold block mb-2">Total ART String <span className="text-red-500">*</span></label>
                    <InputText
                        id="art"
                        value={record.art}
                        onChange={(e) => onInputChange(e, 'art')}
                        placeholder="e.g. 1h.15m"
                        required autoFocus
                        className={classNames({ 'p-invalid': submitted && !record.art })}
                    />
                    {submitted && !record.art && <small className="p-error text-red-500 block mt-1">String value code is strictly required.</small>}
                </div>

                <div className="formgrid grid grid-cols-2 gap-4 mb-4">
                    <div className="field col-6">
                        <label htmlFor="scheduled_value_days" className="font-bold block mb-2">Total Scheduled Range</label>
                        <InputNumber id="scheduled_value_days" value={record.scheduled_value_days} onValueChange={(e) => onInputNumberChange(e, 'scheduled_value_days')} useGrouping={false} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="ppl" className="font-bold block mb-2">PPL</label>
                        <InputText id="ppl" value={record.ppl} onChange={(e) => onInputChange(e, 'ppl')} />
                    </div>
                </div>

                <div className="formgrid grid grid-cols-2 gap-4 mb-4">
                    <div className="field col-6">
                        <label htmlFor="ot_bks" className="font-bold block mb-2">O.T BKS</label>
                        <InputText id="ot_bks" value={record.ot_bks} onChange={(e) => onInputChange(e, 'ot_bks')} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="nt_bks" className="font-bold block mb-2">N.T BKS</label>
                        <InputText id="nt_bks" value={record.nt_bks} onChange={(e) => onInputChange(e, 'nt_bks')} />
                    </div>
                </div>

                <div className="formgrid grid grid-cols-3 gap-4 mb-4">
                    <div className="field col-4">
                        <label htmlFor="we5" className="font-bold block mb-2">WE5</label>
                        <InputText id="we5" value={record.we5} onChange={(e) => onInputChange(e, 'we5')} />
                    </div>
                    <div className="field col-4">
                        <label htmlFor="pro" className="font-bold block mb-2">PRO</label>
                        <InputText id="pro" value={record.pro} onChange={(e) => onInputChange(e, 'pro')} />
                    </div>
                    <div className="field col-4">
                        <label htmlFor="psa" className="font-bold block mb-2">PSA</label>
                        <InputText id="psa" value={record.psa} onChange={(e) => onInputChange(e, 'psa')} />
                    </div>
                </div>

                <div className="formgrid grid grid-cols-2 gap-4 mb-2">
                    <div className="field col-6">
                        <label htmlFor="chp" className="font-bold block mb-2">CHP</label>
                        <InputNumber id="chp" value={record.chp} onValueChange={(e) => onInputNumberChange(e, 'chp')} useGrouping={false} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="ver" className="font-bold block mb-2">VER</label>
                        <InputNumber id="ver" value={record.ver} onValueChange={(e) => onInputNumberChange(e, 'ver')} useGrouping={false} />
                    </div>
                </div>
            </Dialog>

            <Dialog visible={deleteRecordDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Deletion" modal footer={deleteRecordDialogFooter} onHide={hideDeleteRecordDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-red-500" />
                    {record && (
                        <span>
                            Are you sure you want to delete this specific schedule parameter mapped at Module <b>{record.module}</b>?
                        </span>
                    )}
                </div>
            </Dialog>

                <Dialog visible={deleteSelectedDialog} style={{ width: '450px' }} header="Confirm" modal footer={deleteSelectedDialogFooter} onHide={hideDeleteSelectedDialog}>
                    <div className="flex items-center justify-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        {selectedRecords && <span>Are you sure you want to delete the selected records?</span>}
                    </div>
                </Dialog>

                <Dialog visible={clearAllDialog} style={{ width: '450px' }} header="Confirm Clear All" modal footer={clearAllDialogFooter} onHide={() => setClearAllDialog(false)}>
                    <div className="flex items-center justify-center">
                        <i className="pi pi-exclamation-triangle text-red-500 mr-3" style={{ fontSize: '2rem' }} />
                        <span>Are you sure you want to <b>DELETE ALL DATA</b>? This action cannot be undone.</span>
                    </div>
                </Dialog>

            <Dialog visible={importDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Import RLLT Data Excel" modal onHide={() => setImportDialog(false)}>
                <div className="field mb-2 border border-gray-200 rounded-xl overflow-hidden p-2">
                    <FileUpload
                        name="excelFile"
                        customUpload
                        uploadHandler={handleExcelImportSubmit}
                        accept=".xlsx,.csv"
                        maxFileSize={5000000}
                        emptyTemplate={<p className="text-center text-gray-500 my-4">Drag and drop RLLT Explorer Excel file</p>}
                        chooseLabel="Browse"
                        uploadLabel="Upload & Import"
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default RLLTTableData;
