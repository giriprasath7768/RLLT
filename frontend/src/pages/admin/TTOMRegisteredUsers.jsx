import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Paginator } from 'primereact/paginator';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptionsModal from '../../components/ExportOptionsModal';
import { TTOMUserService } from '../../services/ttom_users';
import { LocationService } from '../../services/locations';
import { StudentService } from '../../services/studentService'; // Using StudentService to fetch available charts globally
import '../../assets/css/AdminManagement.css'; // Assuming custom styles map here too

export default function TTOMRegisteredUsers() {
    let emptyUser = {
        id: null,
        name: '',
        mobile_number: '',
        address: '',
        location_id: '',
        is_active: true
    };

    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [userDialog, setUserDialog] = useState(false);
    const [deleteUserDialog, setDeleteUserDialog] = useState(false);
    const [user, setUser] = useState(emptyUser);
    const [selectedUsers, setSelectedUsers] = useState(null);

    const [assignChartDialog, setAssignChartDialog] = useState(false);
    const [confirmRemoveChartDialog, setConfirmRemoveChartDialog] = useState(false);
    const [availableCharts, setAvailableCharts] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);
    const [aStartDate, setAStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [aEndDate, setAEndDate] = useState('');

    const [exportModalVisible, setExportModalVisible] = useState(false);

    const printColumns = [
        { field: 'name', header: 'Name' },
        { field: 'mobile_number', header: 'Mobile Number' },
        { field: 'plain_password', header: 'Password (PIN)' },
        { field: 'address', header: 'Address' },
        { field: 'created_at', header: 'Created Date' },
        { field: 'assigned_chart_name', header: 'Assigned Chart' },
        { field: 'is_active', header: 'Status' }
    ];

    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);

    const [autoCountry, setAutoCountry] = useState('');
    const [autoContinent, setAutoContinent] = useState('');

    const groupedLocationOptions = React.useMemo(() => {
        const grouped = locations.reduce((acc, loc) => {
            if (!acc[loc.country]) {
                acc[loc.country] = { label: loc.country, items: [] };
            }
            acc[loc.country].items.push({ label: loc.city, value: loc.id });
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
    }, [locations]);

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(() => {
        loadData();
        StudentService.getAvailableCharts().then(data => {
            setAvailableCharts(data || []);
        }).catch(err => console.error("Failed to load charts:", err));
    }, []);

    useEffect(() => {
        if (!aStartDate) {
            setAEndDate('');
            return;
        }
        try {
            const start = new Date(aStartDate);
            if (isNaN(start.getTime())) throw new Error("Invalid date");
            const daysToAdd = (selectedChart && selectedChart.tracking_days) ? selectedChart.tracking_days - 1 : 29;
            if (daysToAdd < 0) return;
            const end = new Date(start);
            end.setDate(end.getDate() + daysToAdd);
            setAEndDate(end.toISOString().split('T')[0]);
        } catch (e) {
            setAEndDate('');
        }
    }, [aStartDate, selectedChart]);

    const loadData = () => {
        TTOMUserService.getUsers().then(data => setUsers(Array.isArray(data) ? data : []));
        LocationService.getLocations().then(data => setLocations(Array.isArray(data) ? data : []));
    };

    const openNew = () => {
        setUser(emptyUser);
        setAutoCountry('');
        setAutoContinent('');
        setSubmitted(false);
        setUserDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setUserDialog(false);
    };

    const hideDeleteUserDialog = () => {
        setDeleteUserDialog(false);
    };

    const saveUser = async () => {
        setSubmitted(true);
        if (user.name && user.mobile_number && user.location_id) {
            try {
                const payload = {
                    name: user.name,
                    mobile_number: user.mobile_number,
                    address: user.address,
                    location_id: user.location_id,
                    is_active: user.is_active
                };
                if (user.id) {
                    await TTOMUserService.updateUser(user.id, payload);
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'User Updated', life: 3000 });
                } else {
                    await TTOMUserService.createUser(payload);
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'User Created.', life: 3000 });
                }
                loadData();
                setUserDialog(false);
                setUser(emptyUser);
            } catch (err) {
                const errorMsg = err.response?.data?.detail || 'Operation failed';
                toast.current.show({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
            }
        }
    };

    const editUser = (usr) => {
        setUser({ ...usr });
        setAutoCountry(usr.country || '');
        setAutoContinent(usr.continent || '');
        setUserDialog(true);
    };

    const confirmDeleteUser = (usr) => {
        setUser(usr);
        setDeleteUserDialog(true);
    };

    const deleteUser = () => {
        TTOMUserService.deleteUser(user.id).then(() => {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'User Deleted', life: 3000 });
            loadData();
            setDeleteUserDialog(false);
            setUser(emptyUser);
        });
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _user = { ...user };
        _user[`${name}`] = val;
        setUser(_user);
    };

    const onInputSwitchChange = (e, name) => {
        let _user = { ...user };
        _user[`${name}`] = e.value;
        setUser(_user);
    };

    const onLocationChange = (e) => {
        const locId = e.value;
        setUser({ ...user, location_id: locId });

        const selectedLoc = locations.find(l => l.id === locId);
        if (selectedLoc) {
            setAutoCountry(selectedLoc.country);
            setAutoContinent(selectedLoc.continent);
        } else {
            setAutoCountry('');
            setAutoContinent('');
        }
    };

    const handleOpenAssignChart = () => {
        const selected = selectedUsers || [];
        if (selected.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select TTOM users to assign a chart.', life: 3000 });
            return;
        }
        setAssignChartDialog(true);
    };

    const submitAssignChart = () => {
        if (!selectedChart || !aStartDate || !aEndDate) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please complete all fields.', life: 3000 });
            return;
        }

        const selectedIds = (selectedUsers || []).map(s => s.id);
        const payload = {
            user_ids: selectedIds,
            chart_id: selectedChart.id,
            chart_type: selectedChart.chart_type,
            start_date: new Date(aStartDate).toISOString(),
            end_date: new Date(aEndDate).toISOString()
        };

        TTOMUserService.bulkAssignChart(payload).then(res => {
            toast.current.show({ severity: 'success', summary: 'Assigned', detail: res.message, life: 3000 });
            setAssignChartDialog(false);
            setSelectedChart(null);
            setSelectedUsers([]);
            loadData();
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to assign chart', life: 3000 });
        });
    };

    const handleOpenRemoveChart = () => {
        const selected = selectedUsers || [];
        if (selected.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select TTOM users to remove charts.', life: 3000 });
            return;
        }
        setConfirmRemoveChartDialog(true);
    };

    const submitRemoveChart = () => {
        const selectedIds = (selectedUsers || []).map(s => s.id);
        TTOMUserService.bulkRemoveChart({ user_ids: selectedIds }).then(res => {
            toast.current.show({ severity: 'success', summary: 'Removed', detail: res.message, life: 3000 });
            setConfirmRemoveChartDialog(false);
            setSelectedUsers([]);
            loadData();
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to remove charts', life: 3000 });
        });
    };

    const removeChartDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={() => setConfirmRemoveChartDialog(false)} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={submitRemoveChart} />
        </React.Fragment>
    );

    const assignChartDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={() => setAssignChartDialog(false)} />
            <Button label="Assign" icon="pi pi-check" onClick={submitAssignChart} severity="success" />
        </React.Fragment>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex flex-row justify-center gap-3">
                <button type="button" onClick={() => editUser(rowData)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition-colors" title="Edit">
                    <i className="pi pi-pencil px-1"></i>
                </button>
                <button type="button" onClick={() => confirmDeleteUser(rowData)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors" title="Delete">
                    <i className="pi pi-trash px-1"></i>
                </button>
            </div>
        );
    };

    const statusBodyTemplate = (rowData) => {
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${rowData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {rowData.is_active ? 'ACTIVE' : 'INACTIVE'}
            </span>
        );
    };

    const assignedChartBodyTemplate = (rowData) => {
        if (!rowData.assigned_chart_id && !rowData.assigned_chart_type) {
            return <span className="text-red-500 font-bold text-[11px] italic tracking-wide">Chart need to be assigned</span>;
        }

        const chart = availableCharts.find(c => c.id === rowData.assigned_chart_id);
        if (chart) {
            return <div className="flex flex-col"><span className="text-blue-700 font-bold text-sm leading-tight">{chart.label}</span><span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{rowData.assigned_chart_type}</span></div>;
        }

        return (
            <div className="flex flex-col">
                <span className="text-gray-600 font-bold text-sm">Custom Chart</span>
                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{rowData.assigned_chart_type}</span>
            </div>
        );
    };

    const topCardContent = (
        <div className="flex flex-wrap gap-4 w-full justify-start items-center">
            <div className="flex flex-wrap gap-2">
                <Button label="New T-Tom-T User" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button label="Assign Chart" icon="pi pi-chart-line" severity="info" outlined onClick={handleOpenAssignChart} className="hidden md:flex" />
                <Button label="Remove Chart" icon="pi pi-eraser" severity="warning" outlined onClick={handleOpenRemoveChart} className="hidden md:flex" />
            </div>
            <Button label="Export" icon="pi pi-file-pdf" severity="help" onClick={() => setExportModalVisible(true)} className="ml-auto hidden md:flex" />
        </div>
    );

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">T-Tom-T Registered Users</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const deleteUserDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteUserDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteUser} />
        </React.Fragment>
    );

    const filteredUsers = users.filter(usr => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (usr.name && usr.name.toLowerCase().includes(search)) ||
            (usr.mobile_number && usr.mobile_number.toLowerCase().includes(search)) ||
            (usr.address && usr.address.toLowerCase().includes(search)) ||
            (usr.city && usr.city.toLowerCase().includes(search))
        );
    });

    const handlePdfExport = (selectedFields) => {
        try {
            setExportModalVisible(false);
            const doc = new jsPDF('portrait', 'pt', 'a4');
            const activeColumns = printColumns.filter(col => selectedFields.includes(col.field));
            const exportColumns = activeColumns.map(col => ({ header: col.header, dataKey: col.field }));
            const data = filteredUsers.map(usr => {
                let row = {};
                activeColumns.forEach(col => {
                    if (col.field === 'is_active') row[col.field] = usr.is_active ? 'Active' : 'Inactive';
                    else if (col.field === 'created_at') row[col.field] = usr.created_at ? new Date(usr.created_at).toLocaleDateString() : '-';
                    else if (col.field === 'assigned_chart_name') {
                        if (!usr.assigned_chart_id && !usr.assigned_chart_type) {
                            row[col.field] = 'Chart need to be assigned';
                        } else {
                            const chart = availableCharts.find(c => c.id === usr.assigned_chart_id);
                            row[col.field] = chart ? `${chart.label} (${usr.assigned_chart_type})` : `Custom Chart (${usr.assigned_chart_type})`;
                        }
                    }
                    else row[col.field] = usr[col.field] || '-';
                });
                return row;
            });
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const filename = `T-Tom-T_Users_Report_${dateStr}.pdf`;
            const totalPagesExp = '{total_pages_count_string}';
            autoTable(doc, {
                columns: exportColumns,
                body: data,
                margin: { top: 60, bottom: 40 },
                theme: 'grid',
                headStyles: { fillColor: [6, 2, 56] },
                didDrawPage: function (hookData) {
                    doc.setFontSize(16);
                    doc.text('T-Tom-T Registered Users Report', hookData.settings.margin.left, 30);
                }
            });
            doc.save(filename);
        } catch (error) {
            console.error("PDF Generation failed:", error);
        }
    };

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />
            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                    {topCardContent}
                </div>

                <div className="bg-white shadow-sm border border-gray-100 mb-8">
                    <DataTable value={filteredUsers} selection={selectedUsers} onSelectionChange={(e) => setSelectedUsers(e.value)} dataKey="id" header={tableHeader} responsiveLayout="stack" breakpoint="960px" emptyMessage="No users found." className="custom-admin-table" rowClassName={() => 'bg-white'}>
                        <Column headerClassName="admin-table-header" selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                        <Column headerClassName="admin-table-header" field="name" header="Name" sortable body={(rowData) => <span className="font-bold text-gray-800">{rowData.name}</span>} />
                        <Column headerClassName="admin-table-header" field="mobile_number" header="Mobile Number" sortable body={(rowData) => <span className="font-bold text-gray-800">{rowData.mobile_number}</span>} />
                        <Column headerClassName="admin-table-header" field="plain_password" header="Password (PIN)" body={(rowData) => <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">{rowData.plain_password || 'Generating...'}</span>} />
                        <Column headerClassName="admin-table-header" header="Location (City)" body={(rowData) => <span className="font-bold text-gray-800">{rowData.city || '-'}</span>} />
                        <Column headerClassName="admin-table-header" field="address" header="Address" body={(rowData) => <span className="font-bold text-gray-800">{rowData.address}</span>} />
                        <Column headerClassName="admin-table-header" field="created_at" header="Created Date" sortable body={(rowData) => <span className="font-bold text-gray-800">{new Date(rowData.created_at).toLocaleDateString()}</span>} />
                        <Column headerClassName="admin-table-header" header="Assigned Chart" body={assignedChartBodyTemplate} style={{ minWidth: '13rem', maxWidth: '20rem' }} />
                        <Column headerClassName="admin-table-header" field="is_active" header="Status" sortable body={statusBodyTemplate} />
                        <Column headerClassName="admin-table-header" header="Actions" body={actionBodyTemplate} exportable={false} align="center" style={{ minWidth: '8rem' }} />
                    </DataTable>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredUsers.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users" />
                </div>
            </div>

            <Dialog visible={userDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-2xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl overflow-hidden bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">T-Tom-T User Details</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="field mb-4">
                            <label htmlFor="name" className="font-semibold block mb-1 text-sm text-gray-700">Name *</label>
                            <InputText id="name" value={user.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus />
                        </div>

                        <div className="field mb-4">
                            <label htmlFor="mobile_number" className="font-semibold block mb-1 text-sm text-gray-700">Mobile Number *</label>
                            <InputText id="mobile_number" value={user.mobile_number} onChange={(e) => onInputChange(e, 'mobile_number')} keyfilter="num" />
                        </div>

                        <div className="field mb-4 text-gray-700">
                            <label htmlFor="address" className="font-semibold block mb-1 text-sm text-gray-700">Address *</label>
                            <InputTextarea id="address" value={user.address} onChange={(e) => onInputChange(e, 'address')} rows={2} cols={20} required />
                        </div>

                        <div className="formgrid grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="field col-span-1">
                                <label htmlFor="location_id" className="font-semibold block mb-1 text-sm text-gray-700">Location (City) *</label>
                                <Dropdown id="location_id" value={user.location_id} options={groupedLocationOptions}
                                    optionGroupLabel="label" optionGroupChildren="items" optionLabel="label" optionValue="value"
                                    onChange={onLocationChange} placeholder="Select City" filter
                                    className="w-full" panelClassName="md:w-[22rem]" />
                            </div>
                            <div className="field col-span-1">
                                <label htmlFor="autoCountry" className="font-semibold block mb-1 text-sm text-gray-700">Country</label>
                                <InputText id="autoCountry" value={autoCountry} disabled className="bg-gray-100/70 border-gray-200 text-gray-700 font-medium w-full" />
                            </div>
                            <div className="field col-span-1">
                                <label htmlFor="autoContinent" className="font-semibold block mb-1 text-sm text-gray-700">Continent</label>
                                <InputText id="autoContinent" value={autoContinent} disabled className="bg-gray-100/70 border-gray-200 text-gray-700 font-medium w-full" />
                            </div>
                        </div>

                        <div className="formgrid grid">
                            <div className="field col-12 mb-4">
                                <label className="text-gray-700 font-semibold mb-2 block">Account Status</label>
                                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <InputSwitch id="is_active" checked={user.is_active} onChange={(e) => onInputSwitchChange(e, 'is_active')} className="custom-switch" />
                                    <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-gray-500'}`}>{user.is_active ? 'Active Account' : 'Inactive Account'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save" severity="success" onClick={saveUser} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog visible={deleteUserDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Deletion" modal className="custom-admin-dialog" footer={deleteUserDialogFooter} onHide={hideDeleteUserDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {user && (
                        <span>
                            Are you sure you want to delete T-Tom-T user <b>{user.name}</b>?
                        </span>
                    )}
                </div>
            </Dialog>

            <Dialog visible={assignChartDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Assign Training Chart" modal footer={assignChartDialogFooter} onHide={() => setAssignChartDialog(false)}>
                <div className="flex flex-col gap-4 mt-2">
                    <div className="field">
                        <label htmlFor="assignChartSelect" className="font-bold block mb-2 text-black">Available Charts</label>
                        <Dropdown
                            id="assignChartSelect"
                            value={selectedChart}
                            options={availableCharts}
                            onChange={(e) => setSelectedChart(e.value)}
                            optionLabel="label"
                            placeholder="Select a Chart..."
                            className="w-full"
                            style={{ color: 'black' }}
                        />
                    </div>
                    <div className="field flex justify-between gap-4">
                        <div className="w-full">
                            <label htmlFor="aStartDate" className="font-bold block mb-2 text-black">Start Date</label>
                            <input
                                id="aStartDate"
                                type="date"
                                value={aStartDate}
                                onChange={(e) => setAStartDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="w-full">
                            <label htmlFor="aEndDate" className="font-bold block mb-2 text-gray-700">End Date (Auto)</label>
                            <input
                                id="aEndDate"
                                type="date"
                                value={aEndDate}
                                readOnly
                                className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900"
                            />
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog visible={confirmRemoveChartDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Chart Removal" modal className="custom-admin-dialog" footer={removeChartDialogFooter} onHide={() => setConfirmRemoveChartDialog(false)}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    <span>
                        Are you sure you want to completely <b>remove</b> all assigned charts from the selected TTOM user(s)?
                    </span>
                </div>
            </Dialog>

            <ExportOptionsModal
                visible={exportModalVisible}
                onHide={() => setExportModalVisible(false)}
                columns={printColumns}
                onExport={handlePdfExport}
            />
        </div>
    );
}
