import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { FilterMatchMode } from 'primereact/api';
import { Paginator } from 'primereact/paginator';

const EvaluateAssignments = () => {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    
    const [submissions, setSubmissions] = useState([]);
    const [assignmentsMap, setAssignmentsMap] = useState({});
    const [studentsMap, setStudentsMap] = useState({});
    const [qnaMap, setQnaMap] = useState({});
    
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    
    const [answersDialogVisible, setAnswersDialogVisible] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
    const [selectedAssignmentTitle, setSelectedAssignmentTitle] = useState('');
    
    const toast = useRef(null);

    useEffect(() => {
        fetchLocations();
        fetchAllAssignments();
        fetchAllStudents();
        fetchAllQna();
    }, []);

    useEffect(() => {
        if (selectedLocation) {
            fetchSubmissions(selectedLocation);
        } else {
            setSubmissions([]);
        }
    }, [selectedLocation]);

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/locations`, { withCredentials: true });
            setLocations(res.data);
        } catch (error) {
            console.error("Failed to fetch locations", error);
        }
    };

    const fetchAllAssignments = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/assignments`, { withCredentials: true });
            const map = {};
            res.data.forEach(a => { map[a.id] = a.title; });
            setAssignmentsMap(map);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/students`, { withCredentials: true });
            const map = {};
            res.data.forEach(s => { map[s.id] = s.name; });
            setStudentsMap(map);
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const fetchAllQna = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/qna`, { withCredentials: true });
            const map = {};
            res.data.forEach(q => { map[q.id] = q.question_text; });
            setQnaMap(map);
        } catch (error) {
            console.error("Failed to fetch QnA", error);
        }
    };

    const fetchSubmissions = async (locId) => {
        setLoading(true);
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/submissions?location_id=${locId}`, { withCredentials: true });
            
            // Map the data for easier table display
            const mappedSubmissions = res.data.map(sub => ({
                ...sub,
                student_name: studentsMap[sub.student_id] || 'Unknown Student',
                assignment_title: assignmentsMap[sub.assignment_id] || 'Unknown Assignment'
            }));
            
            // Sort by latest first
            mappedSubmissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setSubmissions(mappedSubmissions);
        } catch (error) {
            console.error("Failed to fetch submissions", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch submissions' });
        } finally {
            setLoading(false);
        }
    };

    const gradeSubmission = async (sub, newGrade) => {
        try {
            await axios.put(`http://${window.location.hostname}:8000/api/classroom/submissions/${sub.id}`, { grade: parseFloat(newGrade), status: 'graded' }, { withCredentials: true });
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Grade updated' });
            if (selectedLocation) {
                fetchSubmissions(selectedLocation);
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update grade' });
        }
    };

    const evaluateTemplate = (rowData) => {
        return (
            <div className="flex justify-center items-center">
                <InputText 
                    type="number" 
                    placeholder="Grade" 
                    defaultValue={rowData.grade || ''} 
                    onBlur={(e) => {
                        if (e.target.value !== '' && e.target.value !== String(rowData.grade)) {
                            gradeSubmission(rowData, e.target.value);
                        }
                    }}
                    className="w-24 bg-white text-black border-gray-300 focus:border-blue-500 shadow-sm rounded-md px-2 py-1"
                />
            </div>
        );
    };

    const handleDownload = async (fileUrl, assignmentTitle, studentName) => {
        try {
            toast.current.show({ severity: 'info', summary: 'Downloading', detail: 'Fetching file...', life: 2000 });
            const response = await axios.get(fileUrl, { responseType: 'blob', withCredentials: true });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            
            // Get original extension
            const ext = fileUrl.split('.').pop() || 'pdf';
            link.download = `${studentName}_${assignmentTitle.replace(/\s+/g, '_')}.${ext}`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Download completed', life: 2000 });
        } catch (error) {
            console.error("Download failed", error);
            // Fallback to window.open if blob fetch fails (e.g. CORS)
            window.open(fileUrl, "_blank");
        }
    };

    const actionTemplate = (rowData) => {
        // Ensure file_url has a leading slash and is properly formatted
        let normalizedFileUrl = rowData.file_url || '';
        if (normalizedFileUrl && !normalizedFileUrl.startsWith('/')) {
            // If it's just a filename or missing a slash, prepend it
            if (!normalizedFileUrl.includes('/')) {
                normalizedFileUrl = `/static/uploads/submissions/${normalizedFileUrl}`;
            } else {
                normalizedFileUrl = `/${normalizedFileUrl}`;
            }
        }
        
        // Ensure we point to the correct backend host
        const fullFileUrl = normalizedFileUrl ? `http://${window.location.hostname}:8000${normalizedFileUrl}` : '';

        return (
            <div className="flex flex-col gap-2 justify-center items-center w-full">
                {rowData.file_url && (
                    <Button label="Download Assignment" icon="pi pi-download" outlined severity="success" size="small" className="w-full whitespace-nowrap text-sm" onClick={() => handleDownload(fullFileUrl, rowData.assignment_title, rowData.student_name)} />
                )}
                {rowData.content && rowData.content.startsWith('{') && (
                    <Button label="View Answer" icon="pi pi-list" outlined severity="info" size="small" className="w-full whitespace-nowrap text-sm" onClick={() => {
                        let parsed = null;
                        try {
                            parsed = JSON.parse(rowData.content);
                            if (typeof parsed === 'string') {
                                parsed = JSON.parse(parsed); // Handle double-stringified JSON
                            }
                        } catch (e) {
                            try {
                                // Fallback for python dict strings
                                const fixedContent = rowData.content.replace(/'/g, '"');
                                parsed = JSON.parse(fixedContent);
                            } catch (e2) {
                                console.error("Failed to parse answers", e2);
                            }
                        }

                        if (parsed && typeof parsed === 'object') {
                            setSelectedAnswers(parsed);
                            setSelectedSubmissionId(rowData.id);
                            setSelectedAssignmentTitle(rowData.assignment_title);
                            setAnswersDialogVisible(true);
                        } else {
                            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No parsable Q&A answers found.' });
                        }
                    }} />
                )}
            </div>
        );
    };

    const statusTemplate = (rowData) => {
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${rowData.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {rowData.status ? rowData.status.toUpperCase() : 'SUBMITTED'}
            </span>
        );
    };

    const dateTemplate = (rowData) => {
        return rowData.created_at ? new Date(rowData.created_at).toLocaleString() : 'N/A';
    };

    const filteredSubmissions = submissions.filter(item => {
        if (!globalFilter) return true;
        const query = globalFilter.toLowerCase();
        return (
            item.student_name?.toLowerCase().includes(query) ||
            item.assignment_title?.toLowerCase().includes(query) ||
            item.status?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <Toast ref={toast} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#051220] tracking-tight">Evaluate Assignments</h1>
                    <p className="text-gray-500 mt-1">Review and grade student assignment submissions by location.</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                    <div className="flex items-center gap-3">
                        <label className="font-bold text-gray-700 whitespace-nowrap">Select Location:</label>
                        <Dropdown 
                            options={locations} 
                            optionLabel="city" 
                            optionValue="id" 
                            value={selectedLocation} 
                            onChange={(e) => setSelectedLocation(e.value)} 
                            placeholder="Choose a location" 
                            filter 
                            className="w-full md:w-64"
                        />
                    </div>
                    <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                        <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                        <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search students or assignments..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
                    </span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden lg:block w-full p-4">
                <DataTable value={submissions} loading={loading} paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                    globalFilter={globalFilter} globalFilterFields={['student_name', 'assignment_title', 'status']}
                    className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines emptyMessage={selectedLocation ? "No submissions found for this location." : "Please select a location first."}
                    rowClassName={() => 'bg-white text-black'}>
                    <Column header="S.No" body={(data, options) => options.rowIndex + 1} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                    <Column field="student_name" header="Student" sortable headerClassName="admin-table-header"></Column>
                    <Column field="assignment_title" header="Assignment" sortable headerClassName="admin-table-header"></Column>
                    <Column field="created_at" header="Submitted On" body={dateTemplate} sortable headerClassName="admin-table-header"></Column>
                    <Column field="status" header="Status" body={statusTemplate} sortable align="center" headerClassName="admin-table-header"></Column>
                    <Column header="Evaluate" body={evaluateTemplate} style={{ width: '120px', textAlign: 'center' }} headerClassName="admin-table-header"></Column>
                    <Column header="Action" body={actionTemplate} style={{ width: '180px', textAlign: 'center' }} headerClassName="admin-table-header"></Column>
                </DataTable>
            </div>

            {/* Desktop Paginator */}
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden lg:block">
                <Paginator first={first} rows={rows} totalRecords={filteredSubmissions.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} submissions" />
            </div>

            {/* Mobile View */}
            <div className="block lg:hidden mt-4 space-y-4">
                {!selectedLocation ? (
                    <div className="text-center p-8 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                        Please select a location first.
                    </div>
                ) : filteredSubmissions.length > 0 ? (
                    filteredSubmissions
                        .slice(first, first + rows)
                        .map((item, index) => (
                            <div key={item.id || index} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-base text-gray-800 m-0">{item.student_name}</h4>
                                        <div className="text-xs text-gray-500 font-medium mt-0.5">{item.assignment_title}</div>
                                    </div>
                                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">#{index + 1}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs border-t border-gray-50 pt-3">
                                    <div>
                                        <div className="text-gray-400 font-medium mb-0.5">Submitted On</div>
                                        <div className="text-gray-700 font-bold">{dateTemplate(item)}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 font-medium mb-0.5">Status</div>
                                        <div>{statusTemplate(item)}</div>
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100 gap-2">
                                        <span className="text-xs font-bold text-gray-600">Grade:</span>
                                        <InputText 
                                            type="number" 
                                            placeholder="Grade" 
                                            defaultValue={item.grade || ''} 
                                            onBlur={(e) => {
                                                if (e.target.value !== '' && e.target.value !== String(item.grade)) {
                                                    gradeSubmission(item, e.target.value);
                                                }
                                            }}
                                            className="w-24 bg-white text-black border-gray-300 text-right focus:border-blue-500 shadow-sm rounded-md px-2 py-1"
                                        />
                                    </div>
                                </div>
                                <div className="border-t border-gray-50 pt-3 mt-1 flex flex-col gap-2">
                                    {actionTemplate(item)}
                                </div>
                            </div>
                        ))
                ) : (
                    <div className="text-center p-8 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
                        No submissions found for this location.
                    </div>
                )}
            </div>

            
            {/* Mobile Paginator */}
            {filteredSubmissions.length > 0 && (
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 block lg:hidden">
                    <Paginator 
                        first={first} 
                        rows={rows} 
                        totalRecords={filteredSubmissions.length} 
                        onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="PrevPageLink PageLinks NextPageLink" 
                    />
                </div>
            )}
        
            <Dialog visible={answersDialogVisible} modal breakpoints={{ '960px': '75vw', '641px': '95vw' }} className="p-fluid max-w-2xl w-full" onHide={() => setAnswersDialogVisible(false)} header={`Student Answers: ${selectedAssignmentTitle}`}>
                <div className="p-4 space-y-4">
                    {selectedAnswers && Object.keys(selectedAnswers).length > 0 ? (
                        Object.keys(selectedAnswers).map((qId, index) => (
                            <div key={qId} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-bold text-[#051220] mb-2">Q{index + 1}: {qnaMap[qId] || "Unknown Question"}</h4>
                                <p className="text-gray-700 bg-white p-3 rounded border border-gray-100">{selectedAnswers[qId]}</p>
                            </div>
                        ))
                    ) : (
                        <p>No answers submitted.</p>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

export default EvaluateAssignments;
