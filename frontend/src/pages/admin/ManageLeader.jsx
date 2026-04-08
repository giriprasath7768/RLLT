import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Paginator } from 'primereact/paginator';
import { getLeaders, createLeader, updateLeader, deleteLeader } from '../../services/leaderService';
import { AdminService } from '../../services/admins';
import MobileDataCard from '../../components/common/MobileDataCard';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../assets/css/AdminManagement.css';
import PrintSelectionModal from '../../components/PrintSelectionModal';
import ExportOptionsModal from '../../components/ExportOptionsModal';

export default function ManageLeader() {
    let emptyLeader = {
        id: null,
        name: '',
        email: '',
        mobile_number: '',
        address: '',
        admin_id: '',
        is_active: true
    };

    const [leaders, setLeaders] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [leaderDialog, setLeaderDialog] = useState(false);
    const [deleteLeaderDialog, setDeleteLeaderDialog] = useState(false);
    const [deleteLeadersDialog, setDeleteLeadersDialog] = useState(false);
    const [leader, setLeader] = useState(emptyLeader);
    const [selectedLeaders, setSelectedLeaders] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    
    // Auto-populated fields (read-only in form)
    const [autoCity, setAutoCity] = useState('');
    const [autoCountry, setAutoCountry] = useState('');
    const [autoContinent, setAutoContinent] = useState('');

    // Print Modal State
    const [printModalVisible, setPrintModalVisible] = useState(false);
    const [selectedPrintColumns, setSelectedPrintColumns] = useState([]);
    const [isPrinting, setIsPrinting] = useState(false);

    // Export Modal State
    const [exportModalVisible, setExportModalVisible] = useState(false);

    const printColumns = [
        { field: 'name', header: 'Leader Name' },
        { field: 'email', header: 'Email ID' },
        { field: 'mobile_number', header: 'Mobile' },
        { field: 'admin_name', header: 'Assigned Admin' },
        { field: 'city', header: 'Location' },
        { field: 'country', header: 'Country' },
        { field: 'is_active', header: 'Status' }
    ];

    const handlePrintSelection = (selectedFields) => {
        setSelectedPrintColumns(selectedFields);
        setPrintModalVisible(false);
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 300);
    };

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        getLeaders().then(data => setLeaders(data || [])).catch(() => setLeaders([]));
        AdminService.getAdmins().then(data => setAdmins(data || [])).catch(() => setAdmins([]));
    };

    const openNew = () => {
        setLeader(emptyLeader);
        setAutoCity('');
        setAutoCountry('');
        setAutoContinent('');
        setSubmitted(false);
        setLeaderDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setLeaderDialog(false);
    };

    const hideDeleteLeaderDialog = () => {
        setDeleteLeaderDialog(false);
    };

    const saveLeader = () => {
        setSubmitted(true);
        if (leader.name && leader.email && leader.admin_id && leader.address && leader.mobile_number) {
            let _leader = { ...leader };
            if (leader.id) {
                updateLeader(_leader.id, _leader).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Leader Updated', life: 3000 });
                    loadData();
                }).catch(err => {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to update', life: 3000 });
                });
            } else {
                createLeader(_leader).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Leader Created. Password sent securely.', life: 3000 });
                    loadData();
                }).catch(err => {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to create', life: 3000 });
                });
            }
            setLeaderDialog(false);
            setLeader(emptyLeader);
        }
    };

    const editLeader = (ldr) => {
        setLeader({ ...ldr });
        setAutoCity(ldr.city);
        setAutoCountry(ldr.country);
        setAutoContinent(ldr.continent);
        setLeaderDialog(true);
    };

    const confirmDeleteLeader = (ldr) => {
        setLeader(ldr);
        setDeleteLeaderDialog(true);
    };

    const deleteLeaderFn = () => {
        deleteLeader(leader.id).then(() => {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Leader Deleted', life: 3000 });
            loadData();
        });
        setDeleteLeaderDialog(false);
        setLeader(emptyLeader);
    };

    const confirmDeleteSelected = () => {
        setDeleteLeadersDialog(true);
    };

    const deleteSelectedLeaders = () => {
        const deletePromises = selectedLeaders.map(ldr => deleteLeader(ldr.id));
        Promise.all(deletePromises)
            .then(() => {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Leaders Deleted', life: 3000 });
                setDeleteLeadersDialog(false);
                setSelectedLeaders(null);
                loadData();
            })
            .catch(err => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Bulk deletion failed', life: 3000 });
            });
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _leader = { ...leader };
        _leader[`${name}`] = val;
        setLeader(_leader);
    };

    const onSwitchChange = (e, name) => {
        let _leader = { ...leader };
        _leader[`${name}`] = e.value;
        setLeader(_leader);
    };

    const onAdminChange = (e) => {
        const adminId = e.value;
        let _leader = { ...leader, admin_id: adminId };
        setLeader(_leader);
        
        // Auto-populate logic based on assigned admin
        const selectedAdmin = admins.find(a => a.id === adminId);
        if (selectedAdmin) {
            setAutoCity(selectedAdmin.city);
            setAutoCountry(selectedAdmin.country);
            setAutoContinent(selectedAdmin.continent);
        } else {
            setAutoCity('');
            setAutoCountry('');
            setAutoContinent('');
        }
    };

    const filteredLeaders = (leaders || []).filter(ldr => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (ldr.name && ldr.name.toLowerCase().includes(search)) ||
            (ldr.email && ldr.email.toLowerCase().includes(search)) ||
            (ldr.mobile_number && ldr.mobile_number.toLowerCase().includes(search)) ||
            (ldr.city && ldr.city.toLowerCase().includes(search)) ||
            (ldr.admin_name && ldr.admin_name.toLowerCase().includes(search))
        );
    });

    const openExportModal = () => {
        setExportModalVisible(true);
    };

    const handlePdfExport = (selectedFields) => {
        try {
            setExportModalVisible(false);
            
            const doc = new jsPDF('portrait', 'pt', 'a4');
            const activeColumns = printColumns.filter(col => selectedFields.includes(col.field));
            
            const exportColumns = activeColumns.map(col => ({
                header: col.header,
                dataKey: col.field
            }));

            const data = filteredLeaders.map(ldr => {
                let row = {};
                activeColumns.forEach(col => {
                    if (col.field === 'is_active') {
                        row[col.field] = ldr.is_active ? 'Active' : 'Inactive';
                    } else if (col.field === 'mobile_number') {
                        row[col.field] = ldr.mobile_number || '-';
                    } else {
                        row[col.field] = ldr[col.field] || '';
                    }
                });
                return row;
            });

            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const searchSuffix = globalFilter ? `_${globalFilter.replace(/[^a-zA-Z0-9]/g, '')}` : '';
            const filename = `Leader_Report_${dateStr}${searchSuffix}.pdf`;
            const totalPagesExp = '{total_pages_count_string}';

            const tableOptions = {
                columns: exportColumns,
                body: data,
                margin: { top: 60, bottom: 40 },
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                didDrawPage: function (hookData) {
                    doc.setFontSize(16);
                    doc.setTextColor(40);
                    // Header
                    doc.text('Manage Leader Report', hookData.settings.margin.left, 30);
                    
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Export Date: ${dateStr}`, hookData.settings.margin.left, 45);

                    // Footer
                    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
                    doc.setFontSize(10);
                    doc.text(`Page ${hookData.pageNumber} of ${totalPagesExp}`, pageWidth - hookData.settings.margin.right - 50, pageHeight - 20);
                }
            };

            autoTable(doc, tableOptions);

            if (typeof doc.putTotalPages === 'function') {
                doc.putTotalPages(totalPagesExp);
            }

            doc.save(filename);
        } catch (error) {
            console.error("PDF Generation failed:", error);
            if (toast.current) {
                toast.current.show({ severity: 'error', summary: 'PDF Error', detail: 'Generation failed. Please try again.', life: 3000 });
            }
        }
    };

    const exportPdf = () => {
        openExportModal();
    };

    const printTable = () => {
        setPrintModalVisible(true);
    };

    const topCardContent = (
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between w-full">
            <div className="flex flex-wrap gap-2">
                <Button label="New Leader" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button label="Print" icon="pi pi-print" severity="secondary" outlined onClick={printTable} />
                <Button label="Export" icon="pi pi-file-pdf" severity="help" onClick={exportPdf} />
            </div>
        </div>
    );

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Manage Leader</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editLeader(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteLeader(rowData)} />
            </React.Fragment>
        );
    };

    const statusBodyTemplate = (rowData) => {
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${rowData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {rowData.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
        );
    };

    const deleteLeaderDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteLeaderDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteLeaderFn} />
        </React.Fragment>
    );

    const deleteLeadersDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={() => setDeleteLeadersDialog(false)} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteSelectedLeaders} />
        </React.Fragment>
    );

    const adminOptions = admins.map(a => ({ label: `${a.name} (${a.city})`, value: a.id }));

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />
            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                    {topCardContent}
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                    <DataTable ref={dt} value={leaders} dataKey="id" 
                            paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                            globalFilter={globalFilter} header={tableHeader}
                            className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines scrollable scrollDirection="both"
                            rowClassName={() => 'bg-white text-black'}>
                        
                        <Column header="S.No" body={(data, options) => first + options.rowIndex + 1} exportable={false} style={{ minWidth: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="name" header="Leader Name" sortable style={{ minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="email" header="Email ID" sortable style={{ minWidth: '14rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="mobile_number" header="Mobile" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="admin_name" header="Assigned Admin" sortable style={{ minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="city" header="Location" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="country" header="Country" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="is_active" header="Status" body={statusBodyTemplate} sortable align="center" style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredLeaders.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} leaders" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    {filteredLeaders.length > 0 ? (
                        filteredLeaders.map(ldr => (
                            <MobileDataCard 
                                key={ldr.id}
                                title={ldr.name}
                                data={[
                                    { label: 'Email', value: ldr.email },
                                    { label: 'Mobile', value: ldr.mobile_number || '-' },
                                    { label: 'Assigned To', value: ldr.admin_name },
                                    { label: 'Location', value: `${ldr.city}, ${ldr.country}` },
                                    { label: 'Status', value: ldr.is_active ? 'ACTIVE' : 'INACTIVE' }
                                ]}
                                onEdit={() => editLeader(ldr)}
                                onDelete={() => confirmDeleteLeader(ldr)}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No leaders found.
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="block md:hidden fixed bottom-6 right-6 z-50">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success shadow-lg" size="large" onClick={openNew} aria-label="Add New" />
            </div>

            <Dialog visible={leaderDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-3xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl overflow-hidden bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Leader Details</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="formgrid grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="field mb-4">
                                <label htmlFor="name" className="font-semibold block mb-1 text-sm text-gray-700">Leader Name *</label>
                                <InputText id="name" value={leader.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !leader.name })} />
                                {submitted && !leader.name && <small className="p-error block mt-1 text-red-500">Name is required.</small>}
                            </div>
                            <div className="field mb-4">
                                <label htmlFor="email" className="font-semibold block mb-1 text-sm text-gray-700">Email ID *</label>
                                <InputText id="email" value={leader.email} onChange={(e) => onInputChange(e, 'email')} required keyfilter="email" className={classNames({ 'p-invalid': submitted && !leader.email })} />
                                {submitted && !leader.email && <small className="p-error block mt-1 text-red-500">Email is required.</small>}
                            </div>
                        </div>

                        <div className="field mb-4">
                            <label htmlFor="mobile_number" className="font-semibold block mb-1 text-sm text-gray-700">Mobile Number *</label>
                            <InputText id="mobile_number" value={leader.mobile_number} onChange={(e) => onInputChange(e, 'mobile_number')} keyfilter="num" required className={`w-full ${classNames({ 'p-invalid': submitted && !leader.mobile_number })}`} />
                            {submitted && !leader.mobile_number && <small className="p-error block mt-1 text-red-500">Mobile Number is required.</small>}
                        </div>

                        <div className="field mb-4 mt-min text-gray-700">
                            <label htmlFor="address" className="font-semibold block mb-1 text-sm text-gray-700">Address *</label>
                            <InputTextarea id="address" value={leader.address} onChange={(e) => onInputChange(e, 'address')} rows={2} cols={20} required className={classNames({ 'p-invalid': submitted && !leader.address })} />
                            {submitted && !leader.address && <small className="p-error block mt-1 text-red-500">Address is required.</small>}
                        </div>

                        {/* Chained Lookups Section */}
                        <div className="formgrid grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                            <h5 className="font-bold text-gray-800 m-0 mb-2">Geographic Assignment</h5>
                            <div className="field mb-0">
                                <label htmlFor="admin_id" className="font-semibold block mb-1 text-sm text-gray-700">Assigned To Admin *</label>
                                <Dropdown id="admin_id" value={leader.admin_id} options={adminOptions} onChange={onAdminChange} placeholder="Select Admin" filter required className={`w-full ${classNames({ 'p-invalid': submitted && !leader.admin_id })}`} panelClassName="md:w-[22rem]" />
                                {submitted && !leader.admin_id && <small className="p-error block mt-1 text-red-500">Responsible Admin is required.</small>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="field">
                                    <label htmlFor="autoCity" className="font-semibold block mb-1 text-sm text-gray-700">Location</label>
                                    <InputText id="autoCity" value={autoCity} disabled className="bg-gray-100/70 border-gray-200 text-gray-700 font-medium w-full" placeholder="- auto populated -" />
                                </div>
                                <div className="field">
                                    <label htmlFor="autoCountry" className="font-semibold block mb-1 text-sm text-gray-700">Country</label>
                                    <InputText id="autoCountry" value={autoCountry} disabled className="bg-gray-100/70 border-gray-200 text-gray-700 font-medium w-full" placeholder="- auto populated -" />
                                </div>
                            </div>
                        </div>

                        <div className="field flex items-center justify-between mb-4">
                            <div>
                                <label htmlFor="is_active" className="font-semibold block text-sm text-gray-800 m-0">Active Status</label>
                                <small className="text-gray-500 mt-1 block">Toggle to enable or disable this leader account globally.</small>
                            </div>
                            <InputSwitch id="is_active" checked={leader.is_active} onChange={(e) => onSwitchChange(e, 'is_active')} />
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save" severity="success" onClick={saveLeader} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog visible={deleteLeaderDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Deletion" modal className="custom-admin-dialog" footer={deleteLeaderDialogFooter} onHide={hideDeleteLeaderDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {leader && (
                        <span>
                            Are you sure you want to delete leader <b>{leader.name} ({leader.email})</b>?
                        </span>
                    )}
                </div>
            </Dialog>

            <Dialog visible={deleteLeadersDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Bulk Deletion" modal className="custom-admin-dialog" footer={deleteLeadersDialogFooter} onHide={() => setDeleteLeadersDialog(false)}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {selectedLeaders && <span>Are you sure you want to delete the selected leaders?</span>}
                </div>
            </Dialog>

            <ExportOptionsModal 
                visible={exportModalVisible} 
                onHide={() => setExportModalVisible(false)} 
                columns={printColumns} 
                onExport={handlePdfExport} 
            />

            <PrintSelectionModal 
                visible={printModalVisible} 
                onHide={() => setPrintModalVisible(false)} 
                columns={printColumns} 
                onPrint={handlePrintSelection} 
            />

            {/* Hidden Print Table */}
            <div className="print-only-table">
                {isPrinting && (
                    <div className="print-container">
                        <h2 className="print-header">Manage Leaders</h2>
                        <table className="print-data-table">
                            <thead>
                                <tr>
                                    {printColumns
                                        .filter(col => selectedPrintColumns.includes(col.field))
                                        .map(col => (
                                            <th key={col.field}>{col.header}</th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaders.map((ldr, index) => (
                                    <tr key={ldr.id || index}>
                                        {printColumns
                                            .filter(col => selectedPrintColumns.includes(col.field))
                                            .map(col => (
                                                <td key={col.field}>
                                                    {col.field === 'is_active' 
                                                        ? (ldr.is_active ? 'ACTIVE' : 'INACTIVE') 
                                                        : col.field === 'mobile_number'
                                                            ? (ldr.mobile_number || '-')
                                                            : ldr[col.field]}
                                                </td>
                                            ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

const classNames = (obj) => {
    return Object.entries(obj).filter(([_, value]) => Boolean(value)).map(([key, _]) => key).join(' ');
};
