import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Paginator } from 'primereact/paginator';
import { StudentService } from '../../services/studentService';
import MobileDataCard from '../../components/common/MobileDataCard';
import { calculateStudentLevel } from '../../utils/studentUtils';
import '../../assets/css/AdminManagement.css';

export default function ManageStudents() {
    let emptyStudent = {
        id: null,
        name: '',
        email: '',
        mobile_number: '',
        address: '',
        enrollment_number: '',
        dob: null,
        gender: '',
        category: '',
        stage: '',
        is_active: false
    };

    const [students, setStudents] = useState([]);
    const [studentDialog, setStudentDialog] = useState(false);
    const [deleteStudentDialog, setDeleteStudentDialog] = useState(false);
    const [student, setStudent] = useState(emptyStudent);
    const [selectedStudents, setSelectedStudents] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    const [bulkToggle, setBulkToggle] = useState(false);

    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const toast = useRef(null);
    const dt = useRef(null);

    const genderOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Other', value: 'Other' },
        { label: 'Prefer not to say', value: 'Prefer not to say' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        StudentService.getStudents().then(data => {
            // Process dates for the Calendar component if present
            const processedData = (data || []).map(s => {
                if (s.dob) s.dob = new Date(s.dob);
                return s;
            });
            setStudents(processedData);
        }).catch(() => setStudents([]));
    };

    const openNew = () => {
        setStudent(emptyStudent);
        setSubmitted(false);
        setStudentDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setStudentDialog(false);
    };

    const hideDeleteStudentDialog = () => {
        setDeleteStudentDialog(false);
    };

    const saveStudent = () => {
        setSubmitted(true);
        if (student.name && student.email) {
            let _student = { ...student };

            // Format Date for API submission
            if (_student.dob && _student.dob instanceof Date) {
                _student.dob = new Date(_student.dob.getTime() - (_student.dob.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            } else {
                _student.dob = null;
            }

            const handleError = (err, fallback) => {
                let errorDetail = fallback;
                if (err.response?.data?.detail) {
                    if (Array.isArray(err.response.data.detail)) {
                        errorDetail = err.response.data.detail.map(d => `${d.loc?.[1] || 'Field'}: ${d.msg}`).join(', ');
                    } else if (typeof err.response.data.detail === 'string') {
                        errorDetail = err.response.data.detail;
                    }
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: errorDetail, life: 4000 });
            };

            if (student.id) {
                StudentService.updateStudent(_student.id, _student).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Student Updated', life: 3000 });
                    loadData();
                }).catch(err => handleError(err, 'Failed to update'));
            } else {
                StudentService.createStudent(_student).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Student Created.', life: 3000 });
                    loadData();
                }).catch(err => handleError(err, 'Failed to create'));
            }
            setStudentDialog(false);
            setStudent(emptyStudent);
        }
    };

    const editStudent = (stu) => {
        setStudent({ ...stu });
        setStudentDialog(true);
    };

    const confirmDeleteStudent = (stu) => {
        setStudent(stu);
        setDeleteStudentDialog(true);
    };

    const deleteStudentFn = () => {
        StudentService.deleteStudent(student.id).then(() => {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Student Deleted', life: 3000 });
            loadData();
        });
        setDeleteStudentDialog(false);
        setStudent(emptyStudent);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _student = { ...student };
        _student[`${name}`] = val;
        setStudent(_student);
    };

    // Toggle Activation Logic API CALL
    const onActivationToggle = (e, rowData) => {
        const newStatus = e.value;
        const previousStatus = rowData.is_active;

        // Optimistic UI Update
        let _students = [...students];
        let index = _students.findIndex(s => s.id === rowData.id);
        if (index > -1) {
            _students[index].is_active = newStatus;
            setStudents(_students);
        }

        StudentService.activateStudent(rowData.id, newStatus).then(res => {
            if (newStatus && !rowData.activation_email_sent) {
                toast.current.show({ severity: 'success', summary: 'Activated', detail: 'Student activated and credentials sent to email.', life: 4000 });
            } else {
                toast.current.show({ severity: 'info', summary: 'Status Updated', detail: `Student status set to ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`, life: 3000 });
            }
            loadData(); // Sync exact server state
        }).catch(err => {
            // Revert on failure
            _students[index].is_active = previousStatus;
            setStudents([..._students]);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update activation status.', life: 3000 });
        });
    };

    const handleBulkToggle = (e) => {
        const activate = e.value;
        setBulkToggle(activate);

        if (activate) {
            const selected = selectedStudents || [];
            if (selected.length === 0) {
                toast.current.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select at least one student first.', life: 3000 });
                setTimeout(() => setBulkToggle(false), 500);
                return;
            }

            const inactiveIds = selected.filter(s => !s.is_active).map(s => s.id);
            if (inactiveIds.length === 0) {
                toast.current.show({ severity: 'info', summary: 'Info', detail: 'All students in the current view are already active.', life: 3000 });
                setTimeout(() => setBulkToggle(false), 500); // Visual reset organically
                return;
            }

            StudentService.bulkActivateStudents(inactiveIds).then(res => {
                toast.current.show({ severity: 'success', summary: 'Bulk Processed', detail: res.message, life: 4000 });
                loadData();
            }).catch(err => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to bulk activate students.', life: 3000 });
                setBulkToggle(false);
            });
        }
    };

    const topCardContent = (
        <div className="flex flex-wrap gap-4 w-full justify-start items-center">
            <Button label="New Student" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                <span className="font-bold text-[#2F5597] text-sm">BULK ACTIVATE:</span>
                <InputSwitch checked={bulkToggle} onChange={handleBulkToggle} />
            </div>
            <Button label="Export" icon="pi pi-upload" severity="help" onClick={() => dt.current.exportCSV()} className="ml-auto hidden md:flex" />
        </div>
    );

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Manage Students</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search Enroll No, Name..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editStudent(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteStudent(rowData)} />
            </React.Fragment>
        );
    };



    const marksBodyTemplate = (rowData) => {
        return <div className="text-center font-bold text-[#2F5597]">{rowData.assessment_marks ?? '-'}</div>;
    };

    const statusBodyTemplate = (rowData) => {
        return (
            <div className="flex justify-center items-center">
                <InputSwitch
                    checked={rowData.is_active}
                    onChange={(e) => onActivationToggle(e, rowData)}
                    tooltip={rowData.is_active ? 'Active' : 'Inactive'}
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    const dateBodyTemplate = (rowData) => {
        if (!rowData.created_at) return '-';
        return new Date(rowData.created_at).toLocaleDateString();
    };

    const filteredStudents = (students || []).filter(stu => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (stu.name && stu.name.toLowerCase().includes(search)) ||
            (stu.email && stu.email.toLowerCase().includes(search)) ||
            (stu.enrollment_number && stu.enrollment_number.toLowerCase().includes(search)) ||
            (stu.category && stu.category.toLowerCase().includes(search)) ||
            (stu.stage && String(stu.stage).toLowerCase().includes(search)) ||
            (stu.location_name && stu.location_name.toLowerCase().includes(search)) ||
            (stu.admin_name && stu.admin_name.toLowerCase().includes(search))
        );
    });

    const studentDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" onClick={saveStudent} />
        </React.Fragment>
    );

    const deleteStudentDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteStudentDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteStudentFn} />
        </React.Fragment>
    );

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />
            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                    {topCardContent}
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                    <DataTable ref={dt} value={students} dataKey="id"
                        selectionMode="checkbox" selection={selectedStudents} onSelectionChange={(e) => setSelectedStudents(e.value)}
                        paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        globalFilter={globalFilter} header={tableHeader}
                        className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'}>

                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                        <Column header="S.No" body={(data, options) => first + options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="category" header="Category" sortable style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="stage" header="Stage" sortable style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="dob" header="Age" body={(rowData) => calculateStudentLevel(rowData.dob).age} sortable style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="name" header="Name" sortable style={{ minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="email" header="Email ID" sortable style={{ minWidth: '14rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="mobile_number" header="Mobile Number" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="location_name" header="Location" sortable style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="admin_name" header="Assigned Admin" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="assessment_marks" header="Marks" body={marksBodyTemplate} sortable align="center" style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="is_active" header="Status" body={statusBodyTemplate} sortable align="center" style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column header="Activity" body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredStudents.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} students" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(stu => (
                            <MobileDataCard
                                key={stu.id}
                                title={`${stu.name} (${stu.category ? `Cat: ${stu.category}` : 'Uncategorized'}, Stage: ${stu.stage || '-'})`}
                                data={[
                                    { label: 'Age', value: calculateStudentLevel(stu.dob).age },
                                    { label: 'Email', value: stu.email },
                                    { label: 'Mobile', value: stu.mobile_number || '-' },
                                    { label: 'Location', value: stu.location_name || '-' },
                                    { label: 'Admin', value: stu.admin_name || '-' },
                                    { label: 'Marks', value: stu.assessment_marks ?? '-' },
                                    {
                                        label: 'Status',
                                        value: (
                                            <InputSwitch
                                                checked={stu.is_active}
                                                onChange={(e) => onActivationToggle(e, stu)}
                                            />
                                        )
                                    }
                                ]}
                                onEdit={() => editStudent(stu)}
                                onDelete={() => confirmDeleteStudent(stu)}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No students found.
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="block md:hidden fixed bottom-6 right-6 z-50">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success shadow-lg" size="large" onClick={openNew} aria-label="Add New" />
            </div>

            <Dialog visible={studentDialog} style={{ width: '40rem' }} breakpoints={{ '960px': '75vw', '641px': '95vw' }} header="Student Profile" modal className="p-fluid" footer={studentDialogFooter} onHide={hideDialog}>
                <div className="formgrid grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field mb-4">
                        <label htmlFor="name" className="font-bold block mb-2">Student Name *</label>
                        <InputText id="name" value={student.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={submitted && !student.name ? 'p-invalid' : ''} />
                    </div>
                    <div className="field mb-4">
                        <label htmlFor="email" className="font-bold block mb-2">Email ID *</label>
                        <InputText id="email" value={student.email} onChange={(e) => onInputChange(e, 'email')} required disabled={student.id ? true : false} className={submitted && !student.email ? 'p-invalid' : ''} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field mb-4">
                        <label htmlFor="mobile_number" className="font-bold block mb-2">Mobile Number</label>
                        <InputText id="mobile_number" value={student.mobile_number} onChange={(e) => onInputChange(e, 'mobile_number')} keyfilter="num" />
                    </div>
                    <div className="field mb-4">
                        <label htmlFor="enrollment_number" className="font-bold block mb-2">Enrollment Number</label>
                        <InputText id="enrollment_number" value={student.enrollment_number} onChange={(e) => onInputChange(e, 'enrollment_number')} placeholder="Auto-generated if empty" disabled={student.id ? true : false} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field mb-4">
                        <label htmlFor="dob" className="font-bold block mb-2">Date of Birth</label>
                        <Calendar id="dob" value={student.dob} onChange={(e) => {
                            const cal = calculateStudentLevel(e.value);
                            setStudent({ ...student, dob: e.value, category: cal.category, stage: cal.stage });
                        }} dateFormat="dd/mm/yy" showIcon maxDate={new Date()} />
                        {student.category && (
                            <small className="block mt-1 text-green-600 font-bold">
                                Category: {student.category} | Stage: {student.stage}
                            </small>
                        )}
                    </div>
                    <div className="field mb-4">
                        <label htmlFor="gender" className="font-bold block mb-2">Gender</label>
                        <Dropdown id="gender" value={student.gender} options={genderOptions} onChange={(e) => setStudent({ ...student, gender: e.value })} placeholder="Select Gender" />
                    </div>
                </div>

                <div className="field mb-4">
                    <label htmlFor="address" className="font-bold block mb-2">Address</label>
                    <InputText id="address" value={student.address} onChange={(e) => onInputChange(e, 'address')} />
                </div>
            </Dialog>

            <Dialog visible={deleteStudentDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Deletion" modal footer={deleteStudentDialogFooter} onHide={hideDeleteStudentDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle mr-3 text-red-500" style={{ fontSize: '2rem' }} />
                    {student && (
                        <span>
                            Are you sure you want to delete student <b>{student.name}</b>?
                        </span>
                    )}
                </div>
            </Dialog>
        </div>
    );
}
