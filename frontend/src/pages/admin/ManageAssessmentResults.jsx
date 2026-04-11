import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputSwitch } from 'primereact/inputswitch';
import { Paginator } from 'primereact/paginator';
import { StudentService } from '../../services/studentService';
import { AssessmentService } from '../../services/assessmentService';
import MobileDataCard from '../../components/common/MobileDataCard';
import '../../assets/css/AdminManagement.css';

export default function ManageAssessmentResults() {
    const [students, setStudents] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [bulkToggle, setBulkToggle] = useState(false);

    // modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState(null);
    const [studentResults, setStudentResults] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(false);

    // paginator states
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    const toast = useRef(null);
    const dt = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        StudentService.getStudents().then(data => {
            const submittedStudents = data.filter(s => s.assessment_status && s.assessment_status !== 'pending');
            setStudents(submittedStudents);
            setLoading(false);
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch students.', life: 3000 });
            setLoading(false);
        });
    };

    const openActivityModal = (student) => {
        setSelectedStudent(student);
        setResultsLoading(true);
        setModalVisible(true);
        AssessmentService.getAssessmentResults(student.id).then(res => {
            setStudentResults(res);
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to load assessment results.', life: 3000 });
        }).finally(() => {
            setResultsLoading(false);
        });
    };

    const onApproveToggle = (e, rowData) => {
        const approve = e.value;
        StudentService.approveAssessment(rowData.id, approve).then(res => {
            toast.current.show({ severity: 'success', summary: approve ? 'Approved' : 'Revoked', detail: approve ? 'Student assessment approved successfully.' : 'Student assessment approval revoked.', life: 3000 });
            const updatedStudents = [...students];
            const index = updatedStudents.findIndex(s => s.id === rowData.id);
            if (index > -1) {
                updatedStudents[index] = { ...updatedStudents[index], assessment_status: approve ? 'approved' : 'under_review' };
                setStudents(updatedStudents);
            }
        }).catch(err => {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update assessment status.', life: 3000 });
        });
    };

    const activityBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-eye" rounded outlined className="p-button-sm text-[#2F5597] border-[#2F5597] hover:bg-blue-50 mx-auto" onClick={() => openActivityModal(rowData)} />
            </React.Fragment>
        );
    };

    const approvalBodyTemplate = (rowData) => {
        const isPending = !rowData.assessment_status || rowData.assessment_status === 'pending';
        const isApproved = rowData.assessment_status === 'approved';

        return (
            <div className="flex justify-center items-center">
                <InputSwitch
                    checked={isApproved}
                    disabled={isPending}
                    onChange={(e) => onApproveToggle(e, rowData)}
                    tooltip={isPending ? 'Assessment Pending' : isApproved ? 'Approved' : 'Under Review - Click to Approve'}
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    const marksBodyTemplate = (rowData) => {
        return <div className="text-center font-black text-[#051220]">{rowData.assessment_marks ?? '-'}</div>;
    };

    const handleBulkToggle = (e) => {
        const approve = e.value;
        setBulkToggle(approve);

        if (approve) {
            const selected = selectedStudents || [];
            if (selected.length === 0) {
                toast.current.show({ severity: 'warn', summary: 'No Selection', detail: 'Please select at least one assessment results row first.', life: 3000 });
                setTimeout(() => setBulkToggle(false), 500);
                return;
            }

            const unapprovedIds = selected.filter(s => s.assessment_status !== 'approved').map(s => s.id);
            if (unapprovedIds.length === 0) {
                toast.current.show({ severity: 'info', summary: 'Info', detail: 'All visible assessments are already approved.', life: 3000 });
                setTimeout(() => setBulkToggle(false), 500);
                return;
            }

            StudentService.bulkApproveAssessments(unapprovedIds, true).then(res => {
                toast.current.show({ severity: 'success', summary: 'Bulk Processed', detail: res.message, life: 4000 });
                loadData();
            }).catch(err => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to bulk update assessments.', life: 3000 });
                setBulkToggle(false);
            });
        }
    };

    const topCardContent = (
        <div className="flex flex-wrap gap-4 w-full justify-start items-center">
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-2 rounded-lg">
                <span className="font-bold text-green-800 text-sm">BULK APPROVE:</span>
                <InputSwitch checked={bulkToggle} onChange={handleBulkToggle} />
            </div>
            <Button icon="pi pi-refresh" rounded outlined onClick={loadData} className="text-[#2F5597] border-[#2F5597] hover:bg-blue-50 ml-auto" />
            <Button label="Export" icon="pi pi-upload" severity="help" onClick={() => dt.current.exportCSV()} className="hidden md:flex" />
        </div>
    );

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none hidden sm:block">Assessment Results</h4>
            <span className="p-input-icon-left w-full sm:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search Name, Email..." className="w-full sm:w-80 pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const filteredStudents = (students || []).filter(stu => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (stu.name && stu.name.toLowerCase().includes(search)) ||
            (stu.email && stu.email.toLowerCase().includes(search)) ||
            (stu.category && stu.category.toLowerCase().includes(search)) ||
            (stu.stage && String(stu.stage).toLowerCase().includes(search))
        );
    });

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />
            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4 flex justify-between">
                    {topCardContent}
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                    <DataTable ref={dt} value={filteredStudents} dataKey="id"
                        selectionMode="checkbox" selection={selectedStudents} onSelectionChange={(e) => setSelectedStudents(e.value)}
                        paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        header={tableHeader}
                        className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'} loading={loading} emptyMessage="No results matched your filters.">

                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                        <Column header="S.No" body={(data, options) => first + options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="name" header="Name" sortable style={{ minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="email" header="Email ID" sortable style={{ minWidth: '14rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="location_name" header="Location" sortable style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="category" header="Category" sortable style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="stage" header="Stage" sortable style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="assessment_marks" header="Total Grade" body={marksBodyTemplate} sortable align="center" style={{ minWidth: '8rem' }} headerClassName="admin-table-header"></Column>
                        <Column header="Activity" body={activityBodyTemplate} exportable={false} align="center" style={{ minWidth: '6rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="assessment_status" header="Approval Status" body={approvalBodyTemplate} sortable align="center" style={{ minWidth: '10rem' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredStudents.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} results" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    <div className="mb-4">
                        {tableHeader}
                    </div>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map(stu => (
                            <MobileDataCard
                                key={stu.id}
                                title={`${stu.name} (${stu.category ? `Cat: ${stu.category}` : 'Uncategorized'}, Stage: ${stu.stage || '-'})`}
                                data={[
                                    { label: 'Email', value: stu.email },
                                    { label: 'Location', value: stu.location_name || '-' },
                                    { label: 'Total Grade', value: stu.assessment_marks ?? '-' },
                                    {
                                        label: 'Activity',
                                        value: (
                                            <Button icon="pi pi-eye" rounded outlined size="small" onClick={() => openActivityModal(stu)} />
                                        )
                                    },
                                    {
                                        label: 'Approval',
                                        value: (
                                            <InputSwitch
                                                checked={stu.assessment_status === 'approved'}
                                                disabled={!stu.assessment_status || stu.assessment_status === 'pending'}
                                                onChange={(e) => onApproveToggle(e, stu)}
                                            />
                                        )
                                    }
                                ]}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No results found.
                        </div>
                    )}
                </div>
            </div>

            <Dialog header={`Assessment Result Screen: ${selectedStudent?.name || ''}`} visible={modalVisible} style={{ width: '50vw', minHeight: '50vh' }} contentStyle={{ maxHeight: '65vh', overflowY: 'auto' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} onHide={() => setModalVisible(false)} className="rounded-xl shadow-2xl">
                {resultsLoading ? (
                    <div className="flex justify-center p-8"><i className="pi pi-spin pi-spinner text-3xl text-[#2F5597]"></i></div>
                ) : studentResults.length > 0 ? (
                    <div className="flex flex-col gap-4 p-2">
                        {studentResults.map((res, i) => (
                            <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-2">Question {i + 1}: <br /><span className="font-normal text-sm" dangerouslySetInnerHTML={{ __html: res.question_text }}></span></h4>
                                <div className="text-sm flex flex-col gap-1">
                                    <p className="text-gray-600"><span className="font-semibold text-[#051220] tracking-wider text-xs uppercase px-2 py-1 bg-white border border-gray-100 rounded mr-2">Submitted Choice:</span> <span dangerouslySetInnerHTML={{ __html: res.selected_choice_text || 'N/A' }}></span></p>
                                    <p className="text-green-700 font-bold bg-green-50 border border-green-100 w-max px-3 py-1 rounded-md inline-block mt-2 tracking-wide text-xs">Awarded Score: +{res.awarded_grade}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 italic bg-gray-50 rounded-xl border border-gray-200">No responses recorded for this student profile currently.</div>
                )}
            </Dialog>
        </div>
    );
}
