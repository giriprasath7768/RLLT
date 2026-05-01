import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { AutoComplete } from 'primereact/autocomplete';
import { Paginator } from 'primereact/paginator';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ClassroomQnA = () => {
    const [qnas, setQnas] = useState([]);
    const [selectedQnas, setSelectedQnas] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Pagination states
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    
    // Filters
    const [filterTopic, setFilterTopic] = useState('');
    const [filterLocation, setFilterLocation] = useState(null);
    const [locations, setLocations] = useState([]);

    const [importDialog, setImportDialog] = useState(false);
    const [importTopic, setImportTopic] = useState('');
    const [importLocation, setImportLocation] = useState('');
    const [filteredLocations, setFilteredLocations] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);

    const [qnaDialog, setQnaDialog] = useState(false);
    const [qna, setQna] = useState({ topic: '', location_id: null, question_number: '', question_text: '', answer_text: '' });

    const toast = useRef(null);

    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        // Fetch current user
        axios.get(`http://${window.location.hostname}:8000/api/me`, { withCredentials: true })
            .then(res => setUserRole(res.data.role))
            .catch(err => console.error(err));

        // Fetch locations for admin
        axios.get(`http://${window.location.hostname}:8000/api/locations`, { withCredentials: true })
            .then(res => {
                setLocations(res.data);
                const cities = [...new Set(res.data.map(l => l.city))].filter(Boolean);
                setAvailableLocations(cities);
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        loadData();
    }, [filterTopic, filterLocation]);

    const loadData = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterTopic) params.append('topic', filterTopic);
        if (filterLocation) params.append('location_id', filterLocation.id);

        axios.get(`http://${window.location.hostname}:8000/api/classroom/qna?${params.toString()}`, { withCredentials: true })
            .then(res => setQnas(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const searchLocations = (event) => {
        setTimeout(() => {
            if (!event.query.trim().length) {
                setFilteredLocations([...availableLocations]);
            } else {
                setFilteredLocations(availableLocations.filter((item) => item.toLowerCase().includes(event.query.toLowerCase())));
            }
        }, 150);
    };

    const openImportDialog = () => {
        setImportTopic('');
        setImportLocation('');
        setImportDialog(true);
    };

    const hideImportDialog = () => {
        setImportDialog(false);
    };

    const openNew = () => {
        setQna({ topic: '', location_id: null, question_number: '', question_text: '', answer_text: '' });
        setQnaDialog(true);
    };

    const hideDialog = () => {
        setQnaDialog(false);
    };

    const saveQna = () => {
        if (!qna.topic.trim() || !qna.question_text.trim()) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Topic and Question are required' });
            return;
        }

        setLoading(true);
        const payload = {
            ...qna,
            location_id: qna.location_id ? qna.location_id.id : null
        };

        if (qna.id) {
            // Update
            axios.put(`http://${window.location.hostname}:8000/api/classroom/qna/${qna.id}`, payload, { withCredentials: true })
                .then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Q&A Updated' });
                    setQnaDialog(false);
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Update failed' }))
                .finally(() => setLoading(false));
        } else {
            // Create single
            axios.post(`http://${window.location.hostname}:8000/api/classroom/qna`, payload, { withCredentials: true })
                .then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Q&A Created' });
                    setQnaDialog(false);
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Creation failed' }))
                .finally(() => setLoading(false));
        }
    };

    const editQna = (q) => {
        const loc = locations.find(l => l.id === q.location_id) || null;
        setQna({ ...q, location_id: loc });
        setQnaDialog(true);
    };

    const handleExcelImportSubmit = (e) => {
        if (!importTopic.trim()) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Topic is required.' });
            e.options.clear();
            return;
        }

        const file = e.files[0];
        if (!file) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select an Excel file.' });
            return;
        }

        // Match typed location to ID
        let locId = null;
        if (importLocation.trim() !== '' && importLocation.toLowerCase() !== 'all') {
            const matchedLoc = locations.find(l => l.city.toLowerCase() === importLocation.toLowerCase());
            if (matchedLoc) {
                locId = matchedLoc.id;
            } else {
                toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Location not found. Assuming All Locations.' });
            }
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                if (rows.length < 2) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Empty Excel file.' });
                    e.options.clear();
                    return;
                }
                const headers = rows[0].map(h => String(h || '').trim());
                
                const snoIdx = headers.indexOf('S.No');
                const questionIdx = headers.indexOf('Question');
                const tntIdx = headers.indexOf('7TNT');
                const categoryIdx = headers.indexOf('Category');
                const stageIdx = headers.indexOf('Stage');
                
                // Find all choices and grades
                const choiceIndices = [];
                const gradeIndices = [];
                headers.forEach((h, idx) => {
                    if (h.startsWith('Choice')) choiceIndices.push(idx);
                    if (h.startsWith('Grade')) gradeIndices.push(idx);
                });

                const parsedQnas = rows.slice(1).map(row => {
                    const choices = [];
                    choiceIndices.forEach((cIdx, i) => {
                        const gIdx = gradeIndices[i];
                        if (row[cIdx]) {
                            choices.push({
                                choice: String(row[cIdx]),
                                grade: gIdx && row[gIdx] ? Number(row[gIdx]) : 0
                            });
                        }
                    });

                    return {
                        topic: importTopic.trim(),
                        location_id: locId,
                        question_number: snoIdx !== -1 && row[snoIdx] ? String(row[snoIdx]) : '',
                        question_text: questionIdx !== -1 && row[questionIdx] ? String(row[questionIdx]) : '',
                        seven_tnt: tntIdx !== -1 && row[tntIdx] ? String(row[tntIdx]) : '',
                        category: categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]) : '',
                        stage: stageIdx !== -1 && row[stageIdx] ? String(row[stageIdx]) : '',
                        choices: choices,
                        answer_text: null
                    };
                }).filter(q => q.question_text !== '');

                if (parsedQnas.length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found. Please ensure your Excel has a "Question" column.' });
                    e.options.clear();
                    return;
                }

                setLoading(true);
                axios.post(`http://${window.location.hostname}:8000/api/classroom/qna/bulk`, parsedQnas, { withCredentials: true })
                    .then(res => {
                        toast.current.show({ severity: 'success', summary: 'Success', detail: res.data.message });
                        hideImportDialog();
                        loadData();
                    })
                    .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to import Q&A' }))
                    .finally(() => {
                        setLoading(false);
                        e.options.clear();
                    });

            } catch (err) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not parse file.' });
                e.options.clear();
            }
        };
        reader.readAsBinaryString(file);
    };

    const confirmDeleteQna = (q) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            axios.delete(`http://${window.location.hostname}:8000/api/classroom/qna/${q.id}`, { withCredentials: true })
                .then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Deleted', life: 3000 });
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Deletion failed' }));
        }
    };

    const renderHTMLContent = (content) => {
        if (!content) return '';
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    };

    const renderAnswer = (rowData) => {
        if (rowData.choices && rowData.choices.length > 0) {
            return (
                <ul className="list-disc pl-4 m-0">
                    {rowData.choices.map((c, i) => (
                        <li key={i}>{c.choice} <span className="text-gray-400 text-xs">(Grade: {c.grade})</span></li>
                    ))}
                </ul>
            );
        }
        return renderHTMLContent(rowData.answer_text);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editQna(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteQna(rowData)} />
            </div>
        );
    };

    const filteredQnas = qnas.filter(item => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return Object.values(item).some(val =>
            String(val) && String(val).toLowerCase().includes(search)
        );
    });

    const topCardContent = (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between w-full">
                <div className="flex flex-wrap gap-2">
                    {userRole !== 'student' && (
                        <>
                            <Button label="New Q&A" icon="pi pi-plus" text className="font-bold" style={{ color: '#00B050' }} onClick={openNew} />
                            <Button label="Import Excel" icon="pi pi-upload" text className="font-bold" style={{ color: '#00B050' }} onClick={openImportDialog} />
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-4 w-full items-end mt-2 pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                    <label htmlFor="filterTopic" className="font-bold text-gray-700 text-sm">Filter by Topic</label>
                    <InputText id="filterTopic" value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} placeholder="e.g. Chapter 1" className="h-[45px] px-3 bg-gray-50 border border-gray-300 text-gray-800 w-full" />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                    <label htmlFor="filterLocation" className="font-bold text-gray-700 text-sm">Filter by Location</label>
                    <select 
                        id="filterLocation"
                        className="h-[45px] px-3 bg-gray-50 border border-gray-300 text-gray-800 w-full"
                        value={filterLocation?.id || ''}
                        onChange={(e) => {
                            if (e.target.value === '') setFilterLocation(null);
                            else setFilterLocation(locations.find(l => l.id === e.target.value));
                        }}
                    >
                        <option value="">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.city}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Classroom Q&A</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md bg-white" />
            </span>
        </div>
    );

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />

            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                    {topCardContent}
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                    <DataTable value={filteredQnas} selection={selectedQnas} onSelectionChange={(e) => setSelectedQnas(e.value)}
                        dataKey="id" paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        globalFilter={globalFilter}
                        emptyMessage="No Q&A found." loading={loading}
                        header={tableHeader} className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'}>
                        
                        <Column field="question_number" header="S.No" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ width: '5%', minWidth: '60px' }}></Column>
                        <Column field="topic" header="Topic" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ width: '15%', minWidth: '120px' }}></Column>
                        <Column field="question_text" header="Question" sortable headerStyle={{ backgroundColor: '#FF0000', color: 'white' }} style={{ width: '40%', minWidth: '16rem' }} body={(rowData) => renderHTMLContent(rowData.question_text)}></Column>
                        <Column field="answer_text" header="Answer / Choices" sortable headerStyle={{ backgroundColor: '#00B050', color: 'white' }} style={{ width: '35%', minWidth: '16rem' }} body={renderAnswer}></Column>
                        
                        {userRole !== 'student' && <Column body={actionBodyTemplate} exportable={false} style={{ width: '8rem' }} headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>}
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredQnas.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Q&A" />
                </div>
            </div>

            <Dialog visible={qnaDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-3xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Q&A Details</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="field">
                                <label className="font-semibold block mb-1 text-sm text-gray-700">Topic</label>
                                <InputText value={qna.topic} onChange={(e) => setQna({ ...qna, topic: e.target.value })} required autoFocus className="w-full px-3 py-2 border rounded border-gray-300 text-gray-800 h-10" />
                            </div>
                            <div className="field">
                                <label className="font-semibold block mb-1 text-sm text-gray-700">Location</label>
                                <select 
                                    className="w-full px-3 py-2 border rounded border-gray-300 text-gray-800 h-10 bg-white"
                                    value={qna.location_id?.id || ''}
                                    onChange={(e) => {
                                        if (e.target.value === '') setQna({ ...qna, location_id: null });
                                        else setQna({ ...qna, location_id: locations.find(l => l.id === e.target.value) });
                                    }}
                                >
                                    <option value="">All Locations</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="field">
                                <label className="font-semibold block mb-1 text-sm text-gray-700">Q Number (Optional)</label>
                                <InputText value={qna.question_number} onChange={(e) => setQna({ ...qna, question_number: e.target.value })} className="w-full px-3 py-2 border rounded border-gray-300 text-gray-800 h-10" />
                            </div>
                        </div>

                        <div className="field mb-4">
                            <label className="font-semibold block mb-1 text-sm text-gray-700">Question</label>
                            <InputText value={qna.question_text} onChange={(e) => setQna({ ...qna, question_text: e.target.value })} required className="w-full px-3 py-2 border rounded border-gray-300 text-gray-800 h-10" />
                        </div>

                        <div className="field mb-4">
                            <label className="font-semibold block mb-1 text-sm text-gray-700">Answer Text (Legacy)</label>
                            <InputText value={qna.answer_text || ''} onChange={(e) => setQna({ ...qna, answer_text: e.target.value })} className="w-full px-3 py-2 border rounded border-gray-300 text-gray-800 h-10" />
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save" severity="success" onClick={saveQna} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog visible={importDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-2xl w-full" onHide={hideImportDialog} showHeader={false} contentClassName="rounded-3xl bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Import Q&A Excel</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideImportDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="field mb-4">
                            <label className="font-semibold block mb-1 text-sm text-gray-700">Topic / Category <span className="text-red-500">*</span></label>
                            <InputText value={importTopic} onChange={(e) => setImportTopic(e.target.value)} placeholder="e.g. History Questions" className="w-full h-[45px] px-3 bg-gray-50 border border-gray-300 rounded" required />
                        </div>

                        <div className="field mb-6">
                            <label className="font-semibold block mb-1 text-sm text-gray-700">Location (Optional, leave empty for All Locations)</label>
                            <AutoComplete value={importLocation} suggestions={filteredLocations} completeMethod={searchLocations} onChange={(e) => setImportLocation(e.value)} dropdown placeholder="e.g. Mumbai" className="w-full p-autocomplete-custom" inputClassName="h-[45px] px-3 bg-gray-50 border border-gray-300 w-full rounded" />
                        </div>

                        <div className="field mb-2 border border-gray-200 rounded-xl overflow-hidden custom-import-fileupload">
                            <FileUpload
                                name="excelFile"
                                customUpload
                                uploadHandler={handleExcelImportSubmit}
                                accept=".xlsx,.csv"
                                maxFileSize={5000000}
                                emptyTemplate={<p className="m-0 text-center text-gray-500 p-8">Drag and drop Excel file here with 'Question' and 'Answer' columns.</p>}
                                chooseLabel="Browse File"
                                uploadLabel="Process & Upload"
                                cancelLabel="Clear"
                            />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default ClassroomQnA;
