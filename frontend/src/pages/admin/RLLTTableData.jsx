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
import * as XLSX from 'xlsx';

const RLLTTableData = () => {
    let emptyRecord = {
        id: null,
        module: 1,
        facet: 1,
        phase: 1,
        day: 1,
        art: '',
        scheduled_value_days: 1
    };

    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    
    // CRUD state
    const [recordDialog, setRecordDialog] = useState(false);
    const [deleteRecordDialog, setDeleteRecordDialog] = useState(false);
    const [importDialog, setImportDialog] = useState(false);
    const [record, setRecord] = useState(emptyRecord);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/rllt_lookup', { withCredentials: true });
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

    const saveRecord = async () => {
        setSubmitted(true);
        if (record.module && record.facet && record.phase && record.art.trim()) {
            let _dataList = [...dataList];
            let _record = { ...record };

            try {
                if (record.id) {
                    const response = await axios.put(`http://localhost:8000/api/rllt_lookup/${record.id}`, _record, { withCredentials: true });
                    const index = findIndexById(record.id);
                    _dataList[index] = response.data;
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Record Updated', life: 3000 });
                } else {
                    const response = await axios.post('http://localhost:8000/api/rllt_lookup/', _record, { withCredentials: true });
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
            await axios.delete(`http://localhost:8000/api/rllt_lookup/${record.id}`, { withCredentials: true });
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
                        const cleanKey = k.toLowerCase().replace(/\s+/g, '');
                        normalized[cleanKey] = row[k];
                    });

                    return {
                        module: parseInt(normalized['module']) || 0,
                        facet: parseInt(normalized['facet']) || 0,
                        phase: parseInt(normalized['phase']) || 0,
                        day: parseInt(normalized['day']) || 0,
                        art: String(normalized['arttime'] || normalized['art'] || ''),
                        scheduled_value_days: parseInt(normalized['scheduleddays'] || normalized['scheduled'] || normalized['scheduled_value_days']) || 0
                    };
                }).filter(r => r.module > 0 && r.facet > 0);

                if (parsedRllt.length === 0) {
                    toast.current.show({ severity: 'error', summary: 'Mapping Failed', detail: 'Could not match required columns (Module, Facet, etc) from the Excel file.' });
                    e.options.clear();
                    return;
                }

                setLoading(true);
                axios.post('http://localhost:8000/api/rllt_lookup/bulk', parsedRllt, { withCredentials: true })
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

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="New Lookup" icon="pi pi-plus" severity="success" onClick={openNew} />
                <Button label="Import Excel" icon="pi pi-upload" className="p-button-help" onClick={() => setImportDialog(true)} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2 justify-end">
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editRecord(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteRecord(rowData)} />
            </div>
        );
    };

    const header = (
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">RLLT Map Explorer</h2>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Global Search"
                    className="p-2 border rounded"
                />
            </span>
        </div>
    );

    const recordDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" onClick={saveRecord} />
        </React.Fragment>
    );

    const deleteRecordDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteRecordDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteRecord} />
        </React.Fragment>
    );

    return (
        <div className="p-10">
            <Toast ref={toast} />
            <div className="card bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <Toolbar className="mb-4 bg-transparent border-none p-0" left={leftToolbarTemplate}></Toolbar>
                <DataTable
                    value={dataList}
                    paginator
                    rows={15}
                    dataKey="id"
                    loading={loading}
                    globalFilter={globalFilter}
                    header={header}
                    emptyMessage="No settings configured."
                    className="p-datatable-sm"
                    stripedRows
                >
                    <Column field="module" header="Module" sortable />
                    <Column field="facet" header="Facet" sortable />
                    <Column field="phase" header="Phase" sortable />
                    <Column field="day" header="Day" sortable />
                    <Column field="art" header="ART Time" sortable />
                    <Column field="scheduled_value_days" header="Scheduled Days" sortable />
                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }}></Column>
                </DataTable>
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

                <div className="field mb-2">
                    <label htmlFor="scheduled_value_days" className="font-bold block mb-2">Total Scheduled Range</label>
                    <InputNumber id="scheduled_value_days" value={record.scheduled_value_days} onValueChange={(e) => onInputNumberChange(e, 'scheduled_value_days')} useGrouping={false} />
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
