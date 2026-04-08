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
        is_active: false
    };

    const [students, setStudents] = useState([]);
    const [studentDialog, setStudentDialog] = useState(false);
    const [deleteStudentDialog, setDeleteStudentDialog] = useState(false);
    const [student, setStudent] = useState(emptyStudent);
    const [selectedStudents, setSelectedStudents] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [globalFilter, setGlobalFilter] = useState(null);
    
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

            if (student.id) {
                StudentService.updateStudent(_student.id, _student).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Student Updated', life: 3000 });
                    loadData();
                }).catch(err => {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to update', life: 3000 });
                });
            } else {
                StudentService.createStudent(_student).then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Student Created.', life: 3000 });
                    loadData();
                }).catch(err => {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to create', life: 3000 });
                });
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

    const topCardContent = (
        <div className="flex flex-wrap gap-2 w-full justify-start">
            <Button label="New Student" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
            <Button label="Export" icon="pi pi-upload" severity="help" onClick={() => dt.current.exportCSV()} />
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

    const statusBodyTemplate = (rowData) => {
        return (
            <div className="flex justify-center items-center">
                <InputSwitch 
                    checked={rowData.is_active} 
                    onChange={(e) => onActivationToggle(e, rowData)} 
                    tooltip={rowData.is_active ? 'Active' : 'Inactive'} 
                    tooltipOptions={{position: 'top'}}
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
            (stu.enrollment_number && stu.enrollment_number.toLowerCase().includes(search))
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
                            paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                            globalFilter={globalFilter} header={tableHeader}
                            className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                            rowClassName={() => 'bg-white text-black'}>
                        
                        <Column header="S.No" body={(data, options) => first + options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="enrollment_number" header="Enrollment No" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="name" header="Name" sortable style={{ minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="email" header="Email ID" sortable style={{ minWidth: '14rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="mobile_number" header="Mobile" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="created_at" header="Registration Date" body={dateBodyTemplate} sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="is_active" header="Status" body={statusBodyTemplate} sortable align="center" style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
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
                                title={`${stu.name} (${stu.enrollment_number})`}
                                data={[
                                    { label: 'Email', value: stu.email },
                                    { label: 'Mobile', value: stu.mobile_number || '-' },
                                    { label: 'Registration Date', value: dateBodyTemplate(stu) },
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
                        <Calendar id="dob" value={student.dob} onChange={(e) => setStudent({...student, dob: e.value})} dateFormat="dd/mm/yy" showIcon maxDate={new Date()} />
                    </div>
                    <div className="field mb-4">
                        <label htmlFor="gender" className="font-bold block mb-2">Gender</label>
                        <Dropdown id="gender" value={student.gender} options={genderOptions} onChange={(e) => setStudent({...student, gender: e.value})} placeholder="Select Gender" />
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
