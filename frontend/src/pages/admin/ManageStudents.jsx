import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExportOptionsModal from '../../components/ExportOptionsModal';
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

    // Export Modal State
    const [exportModalVisible, setExportModalVisible] = useState(false);

    // Assign Chart Modal State
    const [assignChartDialog, setAssignChartDialog] = useState(false);
    const [availableCharts, setAvailableCharts] = useState([]);
    const [selectedChart, setSelectedChart] = useState(null);
    const [aStartDate, setAStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [aEndDate, setAEndDate] = useState('');

    const printColumns = [
        { field: 'category', header: 'Category' },
        { field: 'stage', header: 'Stage' },
        { field: 'dob', header: 'Age' },
        { field: 'name', header: 'Name' },
        { field: 'email', header: 'Email ID' },
        { field: 'mobile_number', header: 'Mobile Number' },
        { field: 'location_name', header: 'Location' },
        { field: 'admin_name', header: 'Assigned Admin' },
        { field: 'assessment_marks', header: 'Marks' },
        { field: 'is_active', header: 'Status' }
    ];

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

    const handleAutoGroup = () => {
        const selected = selectedStudents || [];
        if (selected.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select students to group.', life: 3000 });
            return;
        }

        const selectedIds = selected.map(s => s.id);
        const freshSelected = students.filter(s => selectedIds.includes(s.id));
        const alreadyGrouped = freshSelected.filter(s => s.group_name);

        if (alreadyGrouped.length > 0) {
            toast.current.show({ severity: 'warn', summary: 'Already Grouped', detail: 'Some selected students are already in a group. Please ungroup them first.', life: 5000 });
            return;
        }

        StudentService.autoGroupStudents(selectedIds).then(res => {
            toast.current.show({ severity: 'success', summary: 'Grouped', detail: res.message, life: 3000 });
            loadData();
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Failed to auto group', life: 3000 });
        });
    };

    const handleUngroup = () => {
        const selected = selectedStudents || [];
        if (selected.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select students to ungroup.', life: 3000 });
            return;
        }

        const studentIds = selected.map(s => s.id);
        StudentService.ungroupStudents(studentIds).then(res => {
            toast.current.show({ severity: 'success', summary: 'Ungrouped', detail: res.message, life: 3000 });
            loadData();
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Failed to ungroup', life: 3000 });
        });
    };

    const handleOpenAssignChart = () => {
        const selected = selectedStudents || [];
        if (selected.length === 0) {
            toast.current.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select students to assign a chart.', life: 3000 });
            return;
        }
        setAssignChartDialog(true);
    };

    const submitAssignChart = () => {
        if (!selectedChart || !aStartDate || !aEndDate) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please complete all fields.', life: 3000 });
            return;
        }

        const selectedIds = (selectedStudents || []).map(s => s.id);
        const payload = {
            user_ids: selectedIds,
            chart_id: selectedChart.id,
            chart_type: selectedChart.chart_type,
            start_date: new Date(aStartDate).toISOString(),
            end_date: new Date(aEndDate).toISOString()
        };

        StudentService.bulkAssignChart(payload).then(res => {
            toast.current.show({ severity: 'success', summary: 'Assigned', detail: res.message, life: 3000 });
            setAssignChartDialog(false);
            setSelectedChart(null);
            setSelectedStudents([]);
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to assign chart', life: 3000 });
        });
    };

    const assignChartDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={() => setAssignChartDialog(false)} />
            <Button label="Assign" icon="pi pi-check" onClick={submitAssignChart} severity="success" />
        </React.Fragment>
    );

    const topCardContent = (
        <div className="flex flex-wrap gap-4 w-full justify-start items-center">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg">
                <span className="font-bold text-[#2F5597] text-sm">BULK ACTIVATE:</span>
                <InputSwitch checked={bulkToggle} onChange={handleBulkToggle} />
            </div>
            <Button label="Group Students" icon="pi pi-users" severity="info" onClick={handleAutoGroup} className="hidden md:flex ml-4" />
            <Button label="Ungroup" icon="pi pi-user-minus" severity="warning" outlined onClick={handleUngroup} className="hidden md:flex ml-2" />
            <Button label="Assign Chart" icon="pi pi-chart-line" severity="success" outlined onClick={handleOpenAssignChart} className="hidden md:flex ml-2" />
            <Button label="Export" icon="pi pi-file-pdf" severity="help" onClick={() => setExportModalVisible(true)} className="ml-auto hidden md:flex" />
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

    const handlePdfExport = (selectedFields) => {
        try {
            setExportModalVisible(false);

            const doc = new jsPDF('portrait', 'pt', 'a4');
            const activeColumns = printColumns.filter(col => selectedFields.includes(col.field));

            const exportColumns = activeColumns.map(col => ({
                header: col.header,
                dataKey: col.field
            }));

            const data = filteredStudents.map(stu => {
                let row = {};
                activeColumns.forEach(col => {
                    if (col.field === 'is_active') {
                        row[col.field] = stu.is_active ? 'Active' : 'Inactive';
                    } else if (col.field === 'mobile_number') {
                        row[col.field] = stu.mobile_number || '-';
                    } else if (col.field === 'dob') {
                        row[col.field] = calculateStudentLevel(stu.dob).age || '-';
                    } else if (col.field === 'assessment_marks') {
                        row[col.field] = (stu.assessment_marks !== null && stu.assessment_marks !== undefined) ? stu.assessment_marks : '-';
                    } else {
                        row[col.field] = stu[col.field] || '';
                    }
                });
                return row;
            });

            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const searchSuffix = globalFilter ? `_${globalFilter.replace(/[^a-zA-Z0-9]/g, '')}` : '';
            const filename = `Student_Report_${dateStr}${searchSuffix}.pdf`;
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
                    doc.text('Manage Students Report', hookData.settings.margin.left, 30);

                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Export Date: ${dateStr}`, hookData.settings.margin.left, 45);

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
                        <Column header="S.No" body={(data, options) => options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="category" header="Category" sortable style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="stage" header="Stage" sortable style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="dob" header="Age" body={(rowData) => calculateStudentLevel(rowData.dob).age} sortable style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="name" header="Name" sortable style={{ minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="email" header="Email ID" sortable style={{ minWidth: '14rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="mobile_number" header="Mobile Number" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="location_name" header="Location" sortable style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="admin_name" header="Assigned Admin" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="group_name" header="Group Name" sortable style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
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
                                    { label: 'Group', value: stu.group_name || '-' },
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

            <Dialog visible={assignChartDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Assign Training Chart" modal footer={assignChartDialogFooter} onHide={() => setAssignChartDialog(false)}>
                <div className="flex flex-col gap-4 mt-2">
                    <div className="field">
                        <label htmlFor="assignChartSelect" className="font-bold block mb-2">Available Charts</label>
                        <Dropdown
                            id="assignChartSelect"
                            value={selectedChart}
                            options={availableCharts}
                            onChange={(e) => setSelectedChart(e.value)}
                            optionLabel="label"
                            placeholder="Select a Chart..."
                            className="w-full"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="aStartDate" className="font-bold block mb-2">Start Date</label>
                        <input
                            id="aStartDate"
                            type="date"
                            value={aStartDate}
                            onChange={(e) => setAStartDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="aEndDate" className="font-bold block mb-2">End Date (Auto-Calculated)</label>
                        <input
                            id="aEndDate"
                            type="date"
                            value={aEndDate}
                            readOnly
                            className="w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900"
                        />
                        <small className="block mt-1 text-gray-500 text-xs">Generated based on Chart tracking duration automatically.</small>
                    </div>
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
