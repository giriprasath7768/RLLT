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
import { AdminService } from '../../services/admins';
import { LocationService } from '../../services/locations';
import MobileDataCard from '../../components/common/MobileDataCard';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../assets/css/AdminManagement.css';
import PrintSelectionModal from '../../components/PrintSelectionModal';
import ExportOptionsModal from '../../components/ExportOptionsModal';
import { getCountries, getCountryCallingCode, isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';

const getMaxPhoneLength = (code) => {
    const lengths = {
        'IN': 10, 'US': 10, 'CA': 10, 'GB': 10, 'AU': 9, 'NZ': 9,
        'DE': 11, 'FR': 9, 'IT': 10, 'ES': 9, 'BR': 11, 'JP': 10,
        'CN': 11, 'ZA': 9, 'RU': 10, 'MX': 10, 'SG': 8, 'AE': 9
    };
    return lengths[code] || 15;
};

export default function AdminManagement() {
    let emptyAdmin = {
        id: null,
        name: '',
        email: '',
        mobile_number: '',
        country_code: 'IN',
        address: '',
        location_id: '',
        is_active: true
    };

    const [admins, setAdmins] = useState([]);
    const [locations, setLocations] = useState([]);
    const [adminDialog, setAdminDialog] = useState(false);
    const [deleteAdminDialog, setDeleteAdminDialog] = useState(false);
    const [deleteAdminsDialog, setDeleteAdminsDialog] = useState(false);
    const [admin, setAdmin] = useState(emptyAdmin);
    const [selectedAdmins, setSelectedAdmins] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);

    // Print Modal State
    const [printModalVisible, setPrintModalVisible] = useState(false);
    const [selectedPrintColumns, setSelectedPrintColumns] = useState([]);
    const [isPrinting, setIsPrinting] = useState(false);

    // Export Modal State
    const [exportModalVisible, setExportModalVisible] = useState(false);

    const printColumns = [
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email ID' },
        { field: 'mobile_number', header: 'Mobile' },
        { field: 'city', header: 'Location (City)' },
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

    // Auto-populated fields
    const [autoCountry, setAutoCountry] = useState('');
    const [autoContinent, setAutoContinent] = useState('');

    const countriesList = React.useMemo(() => {
        try {
            const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
            return getCountries().map(code => ({
                label: regionNames.of(code),
                value: code,
                dialCode: `+${getCountryCallingCode(code)}`
            })).sort((a, b) => a.label.localeCompare(b.label));
        } catch (e) {
            return [];
        }
    }, []);

    const groupedLocationOptions = React.useMemo(() => {
        const grouped = locations.reduce((acc, loc) => {
            if (!acc[loc.country]) {
                acc[loc.country] = {
                    label: loc.country,
                    items: []
                };
            }
            acc[loc.country].items.push({ label: loc.city, value: loc.id });
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
    }, [locations]);

    const getFlagEmoji = (countryCode) => {
        if (!countryCode) return '';
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        AdminService.getAdmins().then(data => setAdmins(Array.isArray(data) ? data : []));
        LocationService.getLocations().then(data => setLocations(Array.isArray(data) ? data : []));
    };

    const openNew = () => {
        setAdmin(emptyAdmin);
        setAutoCountry('');
        setAutoContinent('');
        setSubmitted(false);
        setAdminDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setAdminDialog(false);
    };

    const hideDeleteAdminDialog = () => {
        setDeleteAdminDialog(false);
    };

    const saveAdmin = () => {
        setSubmitted(true);
        const isPhoneValid = admin.mobile_number ? isValidPhoneNumber(admin.mobile_number, admin.country_code || 'IN') : false;

        if (admin.name && admin.email && admin.location_id && admin.address && admin.mobile_number && isPhoneValid) {
            let _admin = { ...admin };
            const parsed = parsePhoneNumberFromString(_admin.mobile_number, _admin.country_code || 'IN');
            if (parsed) {
                _admin.mobile_number = parsed.formatInternational();
            }

            if (admin.id) {
                AdminService.updateAdmin(_admin.id, _admin).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Admin Updated', life: 3000 });
                    loadData();
                }).catch(err => {
                    const errorMsg = Array.isArray(err.response?.data?.detail) ? err.response.data.detail.map(d => d.msg).join(', ') : (err.response?.data?.detail || 'Failed to update');
                    toast.current.show({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
                });
            } else {
                AdminService.createAdmin(_admin).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Admin Created. Password sent securely.', life: 3000 });
                    loadData();
                }).catch(err => {
                    const errorMsg = Array.isArray(err.response?.data?.detail) ? err.response.data.detail.map(d => `${d.loc?.join('.')} ${d.msg}`).join(', ') : (err.response?.data?.detail || 'Failed to create');
                    toast.current.show({ severity: 'error', summary: 'Error', detail: errorMsg, life: 3000 });
                });
            }
            setAdminDialog(false);
            setAdmin(emptyAdmin);
        }
    };

    const editAdmin = (adm) => {
        let parsedCountry = 'IN';
        let pureNumber = adm.mobile_number || '';

        if (adm.mobile_number) {
            const parsed = parsePhoneNumberFromString(adm.mobile_number);
            if (parsed && parsed.country) {
                parsedCountry = parsed.country;
                pureNumber = parsed.nationalNumber;
            }
        }

        setAdmin({ ...adm, country_code: parsedCountry, mobile_number: pureNumber });
        setAutoCountry(adm.country);
        setAutoContinent(adm.continent);
        setAdminDialog(true);
    };

    const confirmDeleteAdmin = (adm) => {
        setAdmin(adm);
        setDeleteAdminDialog(true);
    };

    const deleteAdmin = () => {
        AdminService.deleteAdmin(admin.id).then(() => {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Admin Deleted', life: 3000 });
            loadData();
        });
        setDeleteAdminDialog(false);
        setAdmin(emptyAdmin);
    };

    const confirmDeleteSelected = () => {
        setDeleteAdminsDialog(true);
    };

    const deleteSelectedAdmins = () => {
        const deletePromises = selectedAdmins.map(adm => AdminService.deleteAdmin(adm.id));
        Promise.all(deletePromises)
            .then(() => {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Admins Deleted', life: 3000 });
                setDeleteAdminsDialog(false);
                setSelectedAdmins(null);
                loadData();
            })
            .catch(err => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Bulk deletion failed', life: 3000 });
            });
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _admin = { ...admin };
        _admin[`${name}`] = val;
        setAdmin(_admin);
    };

    const onSwitchChange = (e, name) => {
        let _admin = { ...admin };
        _admin[`${name}`] = e.value;
        setAdmin(_admin);
    };

    const onLocationChange = (e) => {
        const locId = e.value;
        let _admin = { ...admin, location_id: locId };
        setAdmin(_admin);

        // Auto-populate logic
        const selectedLoc = locations.find(l => l.id === locId);
        if (selectedLoc) {
            setAutoCountry(selectedLoc.country);
            setAutoContinent(selectedLoc.continent);
        } else {
            setAutoCountry('');
            setAutoContinent('');
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="New Admin" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
            </div>
        );
    };

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

            const data = filteredAdmins.map(adm => {
                let row = {};
                activeColumns.forEach(col => {
                    if (col.field === 'is_active') {
                        row[col.field] = adm.is_active ? 'Active' : 'Inactive';
                    } else if (col.field === 'mobile_number') {
                        row[col.field] = adm.mobile_number || '-';
                    } else {
                        row[col.field] = adm[col.field] || '';
                    }
                });
                return row;
            });

            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const searchSuffix = globalFilter ? `_${globalFilter.replace(/[^a-zA-Z0-9]/g, '')}` : '';
            const filename = `Report_${dateStr}${searchSuffix}.pdf`;
            const totalPagesExp = '{total_pages_count_string}';

            // Implementation of autoTable call
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
                    doc.text('Admin Management Report', hookData.settings.margin.left, 30);

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

            // Call autoTable using the direct function call which is more robust in this environment
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

    const rightToolbarTemplate = () => {
        return (
            <div className="flex gap-2">
                <Button label="Print" icon="pi pi-print" severity="secondary" outlined onClick={printTable} />
                <Button label="Export" icon="pi pi-file-pdf" severity="help" onClick={exportPdf} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined severity="info" className="mr-2" onClick={() => editAdmin(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteAdmin(rowData)} />
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

    const topCardContent = (
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between w-full">
            <div className="flex flex-wrap gap-2">
                <Button label="New Admin" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Button label="Print" icon="pi pi-print" severity="secondary" outlined onClick={printTable} />
                <Button label="Export" icon="pi pi-file-pdf" severity="help" onClick={exportPdf} />
            </div>
        </div>
    );

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Manage Admin</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const selectedCountryTemplate = (option, props) => {
        if (option) {
            return (
                <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{getFlagEmoji(option.value)}</span>
                    <span className="font-semibold text-gray-800">{option.dialCode}</span>
                </div>
            );
        }
        return <span>{props.placeholder}</span>;
    };

    const countryOptionTemplate = (option) => {
        return (
            <div className="flex items-center gap-2 w-full">
                <span className="text-xl leading-none">{getFlagEmoji(option.value)}</span>
                <span className="font-medium text-gray-700">{option.label}</span>
                <span className="text-gray-400 text-sm ml-auto whitespace-nowrap">{option.dialCode}</span>
            </div>
        );
    };

    const deleteAdminDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteAdminDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteAdmin} />
        </React.Fragment>
    );

    const deleteAdminsDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={() => setDeleteAdminsDialog(false)} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteSelectedAdmins} />
        </React.Fragment>
    );

    // (locationOptions is natively mapped via groupedLocationOptions hook above)

    const filteredAdmins = admins.filter(admin => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (admin.name && admin.name.toLowerCase().includes(search)) ||
            (admin.email && admin.email.toLowerCase().includes(search)) ||
            (admin.mobile_number && admin.mobile_number.toLowerCase().includes(search)) ||
            (admin.city && admin.city.toLowerCase().includes(search))
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
                    <DataTable ref={dt} value={admins} selection={selectedAdmins} onSelectionChange={(e) => setSelectedAdmins(e.value)} dataKey="id"
                        paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        globalFilter={globalFilter} header={tableHeader}
                        className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'}>
                        <Column header="S.No" body={(data, options) => first + options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="name" header="Name" sortable style={{ width: '15%', wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column field="email" header="Email ID" sortable style={{ width: '25%', wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column field="mobile_number" header="Mobile" sortable style={{ width: '15%', wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column field="city" header="Location (City)" sortable style={{ width: '15%', wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column field="is_active" header="Status" body={statusBodyTemplate} sortable align="center" style={{ width: '12%', wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column header="Activity" body={actionBodyTemplate} exportable={false} style={{ width: '15%' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredAdmins.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} admins" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    {filteredAdmins.length > 0 ? (
                        filteredAdmins.map(admin => (
                            <MobileDataCard
                                key={admin.id}
                                title={admin.name}
                                data={[
                                    { label: 'Email', value: admin.email },
                                    { label: 'Mobile', value: admin.mobile_number || '-' },
                                    { label: 'Location', value: admin.city },
                                    { label: 'Status', value: admin.is_active ? 'ACTIVE' : 'INACTIVE' }
                                ]}
                                onEdit={() => editAdmin(admin)}
                                onDelete={() => confirmDeleteAdmin(admin)}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No admins found.
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="block md:hidden fixed bottom-6 right-6 z-50">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success shadow-lg" size="large" onClick={openNew} aria-label="Add New" />
            </div>

            <Dialog visible={adminDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-3xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl overflow-hidden bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Admin Details</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="formgrid grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="field mb-4">
                                <label htmlFor="name" className="font-semibold block mb-1 text-sm text-gray-700">Name *</label>
                                <InputText id="name" value={admin.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !admin.name })} />
                                {submitted && !admin.name && <small className="p-error block mt-1 text-red-500">Name is required.</small>}
                            </div>
                            <div className="field mb-4">
                                <label htmlFor="email" className="font-semibold block mb-1 text-sm text-gray-700">Email ID *</label>
                                <InputText id="email" value={admin.email} onChange={(e) => onInputChange(e, 'email')} required keyfilter="email" className={classNames({ 'p-invalid': submitted && !admin.email })} />
                                {submitted && !admin.email && <small className="p-error block mt-1 text-red-500">Email is required.</small>}
                            </div>
                        </div>

                        <div className="field mb-4">
                            <label htmlFor="mobile_number" className="font-semibold block mb-1 text-sm text-gray-700">Mobile Number *</label>
                            <div className="flex gap-4 w-full">
                                <div className="w-[35%] md:w-[30%]">
                                    <Dropdown
                                        value={admin.country_code || 'IN'}
                                        onChange={(e) => onInputChange(e, 'country_code')}
                                        options={countriesList}
                                        filter
                                        filterBy="label,dialCode"
                                        filterPlaceholder="Search code..."
                                        valueTemplate={selectedCountryTemplate}
                                        itemTemplate={countryOptionTemplate}
                                        placeholder="Code"
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <InputText
                                        id="mobile_number"
                                        value={admin.mobile_number}
                                        onChange={(e) => onInputChange(e, 'mobile_number')}
                                        keyfilter="num"
                                        maxLength={getMaxPhoneLength(admin.country_code || 'IN')}
                                        placeholder="Enter mobile sequence"
                                        className={`w-full ${submitted && (!admin.mobile_number || !isValidPhoneNumber(admin.mobile_number, admin.country_code || 'IN')) ? 'p-invalid' : ''}`}
                                    />
                                </div>
                            </div>
                            {submitted && !admin.mobile_number && <small className="p-error block mt-1 text-red-500">Mobile number is required.</small>}
                            {submitted && admin.mobile_number && !isValidPhoneNumber(admin.mobile_number, admin.country_code || 'IN') && <small className="p-error block mt-1 text-red-500">Invalid mobile number length/format for selected country.</small>}
                        </div>

                        <div className="field mb-4 mt-min text-gray-700">
                            <label htmlFor="address" className="font-semibold block mb-1 text-sm text-gray-700">Address *</label>
                            <InputTextarea id="address" value={admin.address} onChange={(e) => onInputChange(e, 'address')} rows={2} cols={20} required className={classNames({ 'p-invalid': submitted && !admin.address })} />
                            {submitted && !admin.address && <small className="p-error block mt-1 text-red-500">Address is required.</small>}
                        </div>

                        <div className="formgrid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="field col-span-1">
                                <label htmlFor="location_id" className="font-semibold block mb-1 text-sm text-gray-700">Location (City) *</label>
                                <Dropdown id="location_id" value={admin.location_id} options={groupedLocationOptions}
                                    optionGroupLabel="label" optionGroupChildren="items" optionLabel="label" optionValue="value"
                                    onChange={onLocationChange} placeholder="Select City" filter
                                    filterPlaceholder="Search by city..." required
                                    className={`w-full ${submitted && !admin.location_id ? 'p-invalid' : ''}`}
                                    panelClassName="md:w-[22rem]" />
                                {submitted && !admin.location_id && <small className="p-error block mt-1 text-red-500">Location is required.</small>}
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

                        <div className="field flex items-center justify-between mb-4">
                            <div>
                                <label htmlFor="is_active" className="font-semibold block text-sm text-gray-800 m-0">Active Status</label>
                                <small className="text-gray-500 mt-1 block">Toggle to enable or disable this admin account globally.</small>
                            </div>
                            <InputSwitch id="is_active" checked={admin.is_active} onChange={(e) => onSwitchChange(e, 'is_active')} />
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save" severity="success" onClick={saveAdmin} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog visible={deleteAdminDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Deletion" modal className="custom-admin-dialog" footer={deleteAdminDialogFooter} onHide={hideDeleteAdminDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {admin && (
                        <span>
                            Are you sure you want to delete admin <b>{admin.name} ({admin.email})</b>?
                        </span>
                    )}
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
                        <h2 className="print-header">Manage Admins</h2>
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
                                {filteredAdmins.map((adm, index) => (
                                    <tr key={adm.id || index}>
                                        {printColumns
                                            .filter(col => selectedPrintColumns.includes(col.field))
                                            .map(col => (
                                                <td key={col.field}>
                                                    {col.field === 'is_active'
                                                        ? (adm.is_active ? 'ACTIVE' : 'INACTIVE')
                                                        : col.field === 'mobile_number'
                                                            ? (adm.mobile_number || '-')
                                                            : adm[col.field]}
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
