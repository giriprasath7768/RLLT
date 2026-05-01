import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';

const ClassroomAssignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [locations, setLocations] = useState([]);
    const [groups, setGroups] = useState([]);
    const [students, setStudents] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [submissionsDialogVisible, setSubmissionsDialogVisible] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    
    // Admin style table states
    const [globalFilter, setGlobalFilter] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    
    const [answersDialogVisible, setAnswersDialogVisible] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState(null);
    const [qnaMap, setQnaMap] = useState({});
    
    const toast = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: null,
        location_id: null,
        targetType: 'all',
        group_id: null,
        student_id: null
    });

    useEffect(() => {
        fetchLocations();
        fetchAssignments();
    }, []);

    useEffect(() => {
        if (formData.location_id) {
            fetchGroupsAndStudents(formData.location_id);
        }
    }, [formData.location_id]);

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/locations`, { withCredentials: true });
            setLocations(res.data);
        } catch (error) {
            console.error("Failed to fetch locations", error);
        }
    };

    const fetchGroupsAndStudents = async (locId) => {
        try {
            const grpRes = await axios.get(`http://${window.location.hostname}:8000/api/students/grouping`, { withCredentials: true });
            setGroups(grpRes.data.filter(g => g.location_id === locId));
            
            const stuRes = await axios.get(`http://${window.location.hostname}:8000/api/students`, { withCredentials: true });
            setStudents(stuRes.data.filter(s => s.location_name === locations.find(l => l.id === locId)?.city));
        } catch (error) {
            console.error("Failed to fetch dependencies", error);
        }
    };

    const fetchAssignments = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/assignments`, { withCredentials: true });
            setAssignments(res.data);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setFormData({
            title: '',
            description: '',
            due_date: null,
            location_id: null,
            targetType: 'all',
            group_id: null,
            student_id: null
        });
        setDialogVisible(true);
    };

    const saveAssignment = async () => {
        if (!formData.title || !formData.location_id) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Title and Location are required.' });
            return;
        }

        const payload = {
            title: formData.title,
            description: formData.description,
            due_date: formData.due_date,
            location_id: formData.location_id,
            group_id: formData.targetType === 'group' ? formData.group_id : null,
            student_id: formData.targetType === 'individual' ? formData.student_id : null
        };

        try {
            await axios.post(`http://${window.location.hostname}:8000/api/classroom/assignments`, payload, { withCredentials: true });
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Assignment Created' });
            setDialogVisible(false);
            fetchAssignments();
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to create assignment' });
        }
    };

    const viewSubmissions = async (assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionsDialogVisible(true);
        setSubmissionsLoading(true);
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/submissions?assignment_id=${assignment.id}`, { withCredentials: true });
            setSubmissions(res.data);
            
            // Also fetch Q&A for this assignment's topic to map question IDs to text
            const qnaRes = await axios.get(`http://${window.location.hostname}:8000/api/classroom/qna`, { withCredentials: true });
            const relevant = qnaRes.data.filter(q => q.topic.toLowerCase() === assignment.title.toLowerCase());
            const map = {};
            relevant.forEach(q => { map[q.id] = q.question_text });
            setQnaMap(map);
            
        } catch (error) {
            console.error("Failed to fetch submissions", error);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const gradeSubmission = async (sub, newGrade) => {
        try {
            await axios.put(`http://${window.location.hostname}:8000/api/classroom/submissions/${sub.id}`, { grade: parseFloat(newGrade), status: 'graded' }, { withCredentials: true });
            toast.current.show({ severity: 'success', summary: 'Success', detail: 'Grade updated' });
            viewSubmissions(selectedAssignment);
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update grade' });
        }
    };

    const actionTemplate = (rowData) => {
        return (
            <Button icon="pi pi-eye" rounded outlined onClick={() => viewSubmissions(rowData)} tooltip="View Submissions" />
        );
    };

    const locationTemplate = (rowData) => {
        const loc = locations.find(l => l.id === rowData.location_id);
        return loc ? loc.city : 'Unknown';
    };
    
    const targetTemplate = (rowData) => {
        if (rowData.student_id) return <span className="text-blue-500 font-bold">Individual</span>;
        if (rowData.group_id) return <span className="text-orange-500 font-bold">Group</span>;
        return <span className="text-green-500 font-bold">All Location</span>;
    };

    const submissionActionTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <InputText 
                    type="number" 
                    placeholder="Grade" 
                    defaultValue={rowData.grade || ''} 
                    onBlur={(e) => {
                        if (e.target.value !== '' && e.target.value !== String(rowData.grade)) {
                            gradeSubmission(rowData, e.target.value);
                        }
                    }}
                    className="w-20"
                />
                {rowData.file_url && (
                    <Button icon="pi pi-download" rounded outlined severity="success" tooltip="Download File" onClick={() => window.open(`http://${window.location.hostname}:8000` + rowData.file_url, "_blank")} />
                )}
                {rowData.content && rowData.content.startsWith('{') && (
                    <Button icon="pi pi-list" rounded outlined severity="info" tooltip="View Answers" onClick={() => {
                        try {
                            setSelectedAnswers(JSON.parse(rowData.content));
                            setAnswersDialogVisible(true);
                        } catch (e) {
                            console.error("Failed to parse answers");
                        }
                    }} />
                )}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <Toast ref={toast} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#051220] tracking-tight">Assign Assignments</h1>
                    <p className="text-gray-500 mt-1">Manage and evaluate classroom assignments.</p>
                </div>
                <Button label="New Assignment" icon="pi pi-plus" className="bg-[#cca673] hover:bg-[#b59263] border-none text-white rounded-xl shadow-sm font-bold" onClick={openNew} />
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center w-full">
                    <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Assignments</h4>
                    <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                        <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                        <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
                    </span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                <DataTable value={assignments} loading={loading} paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                    globalFilter={globalFilter}
                    className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines emptyMessage="No assignments found."
                    rowClassName={() => 'bg-white text-black'}>
                    <Column header="S.No" body={(data, options) => options.rowIndex + 1} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                    <Column field="title" header="Title" sortable headerClassName="admin-table-header"></Column>
                    <Column field="due_date" header="Due Date" sortable body={(r) => r.due_date ? new Date(r.due_date).toLocaleDateString() : 'No Due Date'} headerClassName="admin-table-header"></Column>
                    <Column header="Location" body={locationTemplate} sortable headerClassName="admin-table-header"></Column>
                    <Column header="Target" body={targetTemplate} sortable headerClassName="admin-table-header"></Column>
                    <Column header="Activity" body={actionTemplate} style={{ width: '100px', textAlign: 'center' }} headerClassName="admin-table-header"></Column>
                </DataTable>
            </div>

            <Dialog visible={dialogVisible} modal className="p-fluid max-w-2xl w-full" onHide={() => setDialogVisible(false)} header="Create Assignment">
                <div className="grid grid-cols-1 gap-4 p-4">
                    <div className="field">
                        <label className="font-bold block mb-2">Title *</label>
                        <InputText value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required autoFocus />
                    </div>
                    <div className="field">
                        <label className="font-bold block mb-2">Description</label>
                        <InputTextarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="field">
                        <label className="font-bold block mb-2">Due Date</label>
                        <Calendar value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.value})} showIcon />
                    </div>
                    
                    <div className="field">
                        <label className="font-bold block mb-2">Location *</label>
                        <Dropdown options={locations} optionLabel="city" optionValue="id" value={formData.location_id} onChange={(e) => setFormData({...formData, location_id: e.value})} placeholder="Select Location" />
                    </div>

                    {formData.location_id && (
                        <div className="field">
                            <label className="font-bold block mb-2">Assign To Target</label>
                            <Dropdown 
                                options={[{label: 'All in Location', value: 'all'}, {label: 'Specific Group', value: 'group'}, {label: 'Individual Student', value: 'individual'}]}
                                value={formData.targetType}
                                onChange={(e) => setFormData({...formData, targetType: e.value})}
                            />
                        </div>
                    )}

                    {formData.targetType === 'group' && (
                        <div className="field">
                            <label className="font-bold block mb-2">Select Group</label>
                            <Dropdown options={groups} optionLabel="name" optionValue="id" value={formData.group_id} onChange={(e) => setFormData({...formData, group_id: e.value})} placeholder="Select Group" />
                        </div>
                    )}

                    {formData.targetType === 'individual' && (
                        <div className="field">
                            <label className="font-bold block mb-2">Select Student</label>
                            <Dropdown options={students} optionLabel="name" optionValue="id" value={formData.student_id} onChange={(e) => setFormData({...formData, student_id: e.value})} placeholder="Select Student" filter />
                        </div>
                    )}

                    <div className="flex justify-end mt-4">
                        <Button label="Save Assignment" onClick={saveAssignment} className="bg-blue-600 hover:bg-blue-700 text-white w-auto px-6 font-bold" />
                    </div>
                </div>
            </Dialog>

            <Dialog visible={submissionsDialogVisible} modal className="p-fluid max-w-4xl w-full" onHide={() => setSubmissionsDialogVisible(false)} header={`Submissions for: ${selectedAssignment?.title}`}>
                <div className="p-4">
                    <DataTable value={submissions} loading={submissionsLoading} paginator rows={5} showGridlines emptyMessage="No submissions yet.">
                        <Column field="student_id" header="Student ID" style={{ width: '25%' }}></Column>
                        <Column field="status" header="Status"></Column>
                        <Column header="Evaluate / File" body={submissionActionTemplate} style={{ width: '200px' }}></Column>
                    </DataTable>
                </div>
            </Dialog>

            <Dialog visible={answersDialogVisible} modal className="p-fluid max-w-2xl w-full" onHide={() => setAnswersDialogVisible(false)} header="Student Q&A Answers">
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

export default ClassroomAssignments;
