import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Toolbar } from 'primereact/toolbar';
import { FileUpload } from 'primereact/fileupload';
import { AutoComplete } from 'primereact/autocomplete';
import { Paginator } from 'primereact/paginator';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import PrintSelectionModal from '../../components/PrintSelectionModal';
import ExportOptionsModal from '../../components/ExportOptionsModal';
import * as XLSX from 'xlsx';
import { AssessmentService } from '../../services/assessmentService';
import { LocationService } from '../../services/locations';
import TestPreview from '../../components/admin/TestPreview';

const ManageAssessment = () => {
    const [assessments, setAssessments] = useState([]);
    const [selectedAssessments, setSelectedAssessments] = useState(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [testMode, setTestMode] = useState(false);
    const [loading, setLoading] = useState(false);

    // Pagination states
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);

    // Filters for loading data
    const [filterName, setFilterName] = useState('');
    const [filterLocation, setFilterLocation] = useState('');

    // Print & Export State
    const [printModalVisible, setPrintModalVisible] = useState(false);
    const [selectedPrintColumns, setSelectedPrintColumns] = useState([]);
    const [isPrinting, setIsPrinting] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);

    const printColumns = [
        { field: 'question_number', header: 'S.No' },
        { field: 'question_text', header: 'Question' },
        { field: 'seven_tnt', header: '7TNT' },
        { field: 'category', header: 'Category' },
        { field: 'stage', header: 'Stage' },
        { field: 'choice_1', header: 'Choice 1' },
        { field: 'grade_1', header: 'Grade 1' },
        { field: 'choice_2', header: 'Choice 2' },
        { field: 'grade_2', header: 'Grade 2' },
        { field: 'choice_3', header: 'Choice 3' },
        { field: 'grade_3', header: 'Grade 3' }
    ];

    const stripHtml = (html) => {
        if (!html) return '';
        return String(html).replace(/<[^>]*>?/gm, '');
    };

    const handlePrintSelection = (selectedFields) => {
        setSelectedPrintColumns(selectedFields);
        setPrintModalVisible(false);
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 300);
    };

    const openExportModal = () => {
        setExportModalVisible(true);
    };

    const handlePdfExport = (selectedFields) => {
        try {
            setExportModalVisible(false);

            const doc = new jsPDF('landscape', 'pt', 'a4');
            const activeColumns = printColumns.filter(col => selectedFields.includes(col.field));

            const exportColumns = activeColumns.map(col => ({
                header: col.header,
                dataKey: col.field
            }));

            // FilteredAssessments will be defined below in the component sequence
            // but is available at runtime when this button is clicked
            const data = filteredAssessments.map(item => {
                let row = {};
                activeColumns.forEach(col => {
                    const val = item[col.field] || '';
                    if (['question_text', 'choice_1', 'choice_2', 'choice_3'].includes(col.field)) {
                        row[col.field] = stripHtml(val);
                    } else {
                        row[col.field] = val;
                    }
                });
                return row;
            });

            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            const searchSuffix = globalFilter ? `_${globalFilter.replace(/[^a-zA-Z0-9]/g, '')}` : '';
            const filename = `Assessments_${dateStr}${searchSuffix}.pdf`;
            const totalPagesExp = '{total_pages_count_string}';

            const tableOptions = {
                columns: exportColumns,
                body: data,
                margin: { top: 60, bottom: 40 },
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                didDrawPage: function (hookData) {
                    doc.setFontSize(16);
                    doc.setTextColor(40);
                    doc.text('Assessment Management Report', hookData.settings.margin.left, 30);

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

    const exportPdf = () => {
        openExportModal();
    };

    const printTable = () => {
        setPrintModalVisible(true);
    };

    const [assessmentDialog, setAssessmentDialog] = useState(false);
    const [assessment, setAssessment] = useState(getEmptyAssessment());

    const [importDialog, setImportDialog] = useState(false);
    const [importFlowName, setImportFlowName] = useState('');
    const [importLocation, setImportLocation] = useState('');

    const [availableNames, setAvailableNames] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [filteredNames, setFilteredNames] = useState([]);
    const [filteredLocations, setFilteredLocations] = useState([]);

    const toast = useRef(null);

    const fetchOptions = () => {
        AssessmentService.getAssessmentOptions().then(data => {
            setAvailableNames(data.names || []);
        }).catch(err => console.error("Could not load autocomplete options", err));
    };

    useEffect(() => {
        fetchOptions();

        LocationService.getLocations().then(data => {
            const uniqueCities = [...new Set(data.map(l => l.city))].filter(Boolean);
            setAvailableLocations(uniqueCities);
        }).catch(err => console.error("Could not load locations", err));
    }, []);

    useEffect(() => {
        loadData();
    }, [filterName, filterLocation]);

    useEffect(() => {
        let timeoutId;
        if (assessmentDialog && assessment.name && assessment.location_module && !assessment.id) {
            timeoutId = setTimeout(() => {
                AssessmentService.getAssessments(assessment.name, assessment.location_module)
                    .then(data => {
                        const maxQ = data.reduce((max, a) => Math.max(max, parseInt(a.question_number) || 0), 0);
                        setAssessment(prev => ({ ...prev, question_number: String(maxQ + 1) }));
                    });
            }, 500);
        }
        return () => clearTimeout(timeoutId);
    }, [assessment.name, assessment.location_module, assessmentDialog, assessment.id]);

    const loadData = () => {
        setLoading(true);
        AssessmentService.getAssessments(filterName, filterLocation)
            .then(data => setAssessments(data))
            .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to load assessments' }))
            .finally(() => setLoading(false));
    };

    function getEmptyAssessment() {
        return {
            name: filterName || '',
            location_module: filterLocation || '',
            question_number: '',
            question_text: '',
            seven_tnt: '',
            category: '',
            stage: '',
            choice_1: '', grade_1: '',
            choice_2: '', grade_2: '',
            choice_3: '', grade_3: ''
        };
    }

    const searchNames = (event) => {
        setTimeout(() => {
            if (!event.query.trim().length) {
                setFilteredNames([...availableNames]);
            } else {
                setFilteredNames(availableNames.filter((item) => item.toLowerCase().includes(event.query.toLowerCase())));
            }
        }, 150);
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
        setImportFlowName('');
        setImportLocation('');
        setImportDialog(true);
    };

    const hideImportDialog = () => {
        setImportDialog(false);
    };

    const handleExcelImportSubmit = (e) => {
        if (!importFlowName.trim() || !importLocation.trim()) {
            toast.current.show({ severity: 'error', summary: 'Validation Error', detail: 'Flow Name and Location are mandatory fields.' });
            e.options.clear();
            return;
        }

        const file = e.files[0];
        if (!file) {
            toast.current.show({ severity: 'error', summary: 'Validation Error', detail: 'Please select an Excel file.' });
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                const parsedAssessments = data.map(row => ({
                    name: importFlowName.trim(),
                    location_module: importLocation.trim(),
                    question_number: String(row['S.No'] || row['Question Number'] || ''),
                    question_text: row['Question'] || '',
                    seven_tnt: String(row['7TNT'] || ''),
                    category: String(row['Category'] || ''),
                    stage: String(row['Stage'] || ''),
                    choice_1: row['Choice 1'] || '', grade_1: String(row['Grade'] || row['Grade 1'] || ''),
                    choice_2: row['Choice 2'] || '', grade_2: String(row['Grade_1'] || row['Grade 2'] || ''),
                    choice_3: row['Choice 3'] || '', grade_3: String(row['Grade_2'] || row['Grade 3'] || '')
                })).filter(a => a.question_text !== '');

                if (parsedAssessments.length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found to import. Check column names.' });
                    e.options.clear();
                    return;
                }

                setLoading(true);
                AssessmentService.bulkCreateAssessments(parsedAssessments)
                    .then(res => {
                        toast.current.show({ severity: 'success', summary: 'Success', detail: res.message });
                        hideImportDialog();
                        fetchOptions();
                        loadData();
                    })
                    .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to import assessments' }))
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

    const openNew = () => {
        setAssessment(getEmptyAssessment());
        setAssessmentDialog(true);
    };

    const hideDialog = () => {
        setAssessmentDialog(false);
    };

    const saveAssessment = () => {
        if (!assessment.question_text.trim()) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Question text is required' });
            return;
        }

        setLoading(true);
        if (assessment.id) {
            AssessmentService.updateAssessment(assessment.id, assessment)
                .then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Assessment Updated' });
                    setAssessmentDialog(false);
                    fetchOptions();
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Update failed' }))
                .finally(() => setLoading(false));
        } else {
            AssessmentService.createAssessment(assessment)
                .then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Assessment Created' });
                    setAssessmentDialog(false);
                    fetchOptions();
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Creation failed' }))
                .finally(() => setLoading(false));
        }
    };

    const editAssessment = (a) => {
        setAssessment({ ...a });
        setAssessmentDialog(true);
    };

    const confirmDeleteAssessment = (a) => {
        if (window.confirm('Are you sure you want to delete this assessment?')) {
            AssessmentService.deleteAssessment(a.id)
                .then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Assessment Deleted', life: 3000 });
                    fetchOptions();
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Deletion failed' }));
        }
    };

    const deleteSelectedAssessments = () => {
        if (window.confirm('Are you sure you want to delete the selected assessments?')) {
            const ids = selectedAssessments.map(s => s.id);
            AssessmentService.bulkDeleteAssessments(ids)
                .then(() => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Assessments Deleted', life: 3000 });
                    setSelectedAssessments(null);
                    fetchOptions();
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Deletion failed' }));
        }
    };

    const purgeAll = () => {
        if (!filterName || !filterLocation) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Please specify both Name and Location to purge a set.' });
            return;
        }
        if (window.confirm(`Are you sure you want to purge ALL assessments for Name: ${filterName} and Location: ${filterLocation}?`)) {
            AssessmentService.purgeAssessments(filterName, filterLocation)
                .then((res) => {
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: res.message, life: 3000 });
                    fetchOptions();
                    loadData();
                })
                .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Purge failed' }));
        }
    };

    const renderHTMLContent = (content) => {
        if (!content) return '';
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editAssessment(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteAssessment(rowData)} />
            </div>
        );
    };

    const topCardContent = (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between w-full">
                <div className="flex flex-wrap gap-2">
                    <Button label="New Assessment" icon="pi pi-plus" text className="font-bold" style={{ color: '#00B050' }} onClick={openNew} />
                    <Button label="Import Excel" icon="pi pi-upload" text className="font-bold" style={{ color: '#00B050' }} onClick={openImportDialog} />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button label="Print" icon="pi pi-print" text className="font-bold" style={{ color: '#2F5597' }} onClick={printTable} />
                    <Button label="Export" icon="pi pi-file-pdf" text className="font-bold" style={{ color: '#2F5597' }} onClick={exportPdf} />
                </div>
            </div>

            <div className="flex flex-wrap gap-4 w-full items-end mt-2 pt-4 border-t border-gray-100">
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                    <label htmlFor="filterName" className="font-bold text-gray-700 text-sm">Assignment Name (Filter & Import target)</label>
                    <AutoComplete id="filterName" value={filterName} suggestions={filteredNames} completeMethod={searchNames} onChange={(e) => setFilterName(e.value)} dropdown placeholder="e.g. Test 1" className="w-full p-autocomplete-custom" inputClassName="h-[45px] px-3 bg-gray-50 border border-gray-300 text-gray-800 focus:bg-white transition-colors w-full" />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                    <label htmlFor="filterLocation" className="font-bold text-gray-700 text-sm">Location (Filter & Import target)</label>
                    <AutoComplete id="filterLocation" value={filterLocation} suggestions={filteredLocations} completeMethod={searchLocations} onChange={(e) => setFilterLocation(e.value)} dropdown placeholder="e.g. Module A" className="w-full p-autocomplete-custom" inputClassName="h-[45px] px-3 bg-gray-50 border border-gray-300 text-gray-800 focus:bg-white transition-colors w-full" />
                </div>
            </div>
        </div>
    );

    const filteredAssessments = (assessments || []).filter(item => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return Object.values(item).some(val =>
            String(val) && String(val).toLowerCase().includes(search)
        );
    });

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Manage Assessment</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md bg-white" />
            </span>
        </div>
    );

    if (testMode) {
        return (
            <div className="p-4 sm:p-8 w-full bg-white min-h-screen">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 m-0">Assessment Preview</h1>
                        <p className="text-gray-500 mt-1">Simulating user view for: {filterName} / {filterLocation}</p>
                    </div>
                    <Button label="Exit Test Mode" icon="pi pi-arrow-left" severity="secondary" onClick={() => setTestMode(false)} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300" />
                </div>
                <TestPreview assessments={filteredAssessments} filterName={filterName} filterLocation={filterLocation} />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />

            <div className="card border border-gray-100 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-4">
                    {topCardContent}
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hidden md:block w-full p-4">
                    <div className="flex flex-row justify-between w-full mb-4 border-b border-gray-100 pb-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <Button label="Delete selected" icon="pi pi-trash" text className="font-bold" style={{ color: '#FF0000' }} onClick={deleteSelectedAssessments} disabled={!selectedAssessments || !selectedAssessments.length} />
                            <Button label="Delete filtered" icon="pi pi-trash" text className="font-bold" style={{ color: '#FF0000' }} onClick={purgeAll} tooltip="Deletes all entries matching current Name and Location filters" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button label={testMode ? "Exit Test Mode" : "Test Format Mode"} icon="pi pi-eye" text className="font-bold" style={{ color: testMode || filterName ? '#2F5597' : '#9CA3AF' }} disabled={!filterName && !testMode} onClick={() => setTestMode(!testMode)} />
                        </div>
                    </div>
                    <DataTable value={assessments} selection={selectedAssessments} onSelectionChange={(e) => setSelectedAssessments(e.value)}
                        dataKey="id" paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        globalFilter={globalFilter}
                        emptyMessage="No questions found. Try importing an Excel file or adjusting the filters." loading={loading}
                        header={tableHeader} className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'}>
                        <Column selectionMode="multiple" exportable={false} headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                        <Column field="question_number" header="S.No" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ width: '5%', minWidth: '60px' }}></Column>
                        <Column field="question_text" header="Question" sortable style={{ width: '40%', minWidth: '16rem' }} headerStyle={{ backgroundColor: '#FF0000', color: 'white' }} body={(rowData) => renderHTMLContent(rowData.question_text)}></Column>
                        <Column field="seven_tnt" header="7TNT" sortable style={{ width: '10%', minWidth: '100px' }} headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                        <Column field="category" header="Category" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ minWidth: '120px' }}></Column>
                        <Column field="stage" header="Stage" sortable headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ minWidth: '100px' }}></Column>

                        <Column field="choice_1" header="Choice 1" headerStyle={{ backgroundColor: '#00B050', color: 'white' }} style={{ minWidth: '120px' }} body={(rowData) => renderHTMLContent(rowData.choice_1)}></Column>
                        <Column field="grade_1" header="Grade" headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ minWidth: '80px' }}></Column>
                        <Column field="choice_2" header="Choice 2" headerStyle={{ backgroundColor: '#00B050', color: 'white' }} style={{ minWidth: '120px' }} body={(rowData) => renderHTMLContent(rowData.choice_2)}></Column>
                        <Column field="grade_2" header="Grade" headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ minWidth: '80px' }}></Column>
                        <Column field="choice_3" header="Choice 3" headerStyle={{ backgroundColor: '#00B050', color: 'white' }} style={{ minWidth: '120px' }} body={(rowData) => renderHTMLContent(rowData.choice_3)}></Column>
                        <Column field="grade_3" header="Grade" headerStyle={{ backgroundColor: '#2F5597', color: 'white' }} style={{ minWidth: '80px' }}></Column>

                        <Column body={actionBodyTemplate} exportable={false} style={{ width: '8rem' }} headerStyle={{ backgroundColor: '#2F5597', color: 'white' }}></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredAssessments.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} questions" />
                </div>
            </div>

            <Dialog visible={assessmentDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-3xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Assessment Details</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="field">
                                <label htmlFor="assignment_name" className="font-semibold block mb-1 text-sm text-gray-700">Assignment Name</label>
                                <AutoComplete id="assignment_name" value={assessment.name} suggestions={filteredNames} completeMethod={searchNames} onChange={(e) => setAssessment({ ...assessment, name: e.value })} dropdown className="w-full p-autocomplete-custom" inputClassName="w-full px-3 py-2 border rounded border-gray-300 text-gray-800 h-10" />
                            </div>
                            <div className="field">
                                <label htmlFor="location_module" className="font-semibold block mb-1 text-sm text-gray-700">Location</label>
                                <AutoComplete id="location_module" value={assessment.location_module} suggestions={filteredLocations} completeMethod={searchLocations} onChange={(e) => setAssessment({ ...assessment, location_module: e.value })} dropdown className="w-full p-autocomplete-custom" inputClassName="w-full px-3 py-2 border rounded border-gray-300 text-gray-800 h-10" />
                            </div>
                        </div>

                        <div className="field mb-4">
                            <label htmlFor="question_text" className="font-semibold block mb-1 text-sm text-gray-700">Question</label>
                            <InputText id="question_text" value={assessment.question_text} onChange={(e) => setAssessment({ ...assessment, question_text: e.target.value })} required autoFocus />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="field mb-4">
                                <label htmlFor="question_number" className="font-semibold block mb-1 text-sm text-gray-700">Q Number (Auto)</label>
                                <InputText id="question_number" value={assessment.question_number} readOnly disabled className="bg-gray-100" />
                            </div>
                            <div className="field mb-4">
                                <label htmlFor="seven_tnt" className="font-semibold block mb-1 text-sm text-gray-700">7TNT</label>
                                <InputText id="seven_tnt" value={assessment.seven_tnt} onChange={(e) => setAssessment({ ...assessment, seven_tnt: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="field mb-4">
                                <label htmlFor="category" className="font-semibold block mb-1 text-sm text-gray-700">Category</label>
                                <InputText id="category" value={assessment.category} onChange={(e) => setAssessment({ ...assessment, category: e.target.value })} />
                            </div>
                            <div className="field mb-4">
                                <label htmlFor="stage" className="font-semibold block mb-1 text-sm text-gray-700">Stage</label>
                                <InputText id="stage" value={assessment.stage} onChange={(e) => setAssessment({ ...assessment, stage: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                            <div className="field">
                                <label htmlFor="choice_1" className="font-semibold block mb-1 text-sm text-gray-700">Choice 1</label>
                                <InputText id="choice_1" value={assessment.choice_1} onChange={(e) => setAssessment({ ...assessment, choice_1: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor="grade_1" className="font-semibold block mb-1 text-sm text-gray-700">Grade 1</label>
                                <InputText id="grade_1" value={assessment.grade_1} onChange={(e) => setAssessment({ ...assessment, grade_1: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                            <div className="field">
                                <label htmlFor="choice_2" className="font-semibold block mb-1 text-sm text-gray-700">Choice 2</label>
                                <InputText id="choice_2" value={assessment.choice_2} onChange={(e) => setAssessment({ ...assessment, choice_2: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor="grade_2" className="font-semibold block mb-1 text-sm text-gray-700">Grade 2</label>
                                <InputText id="grade_2" value={assessment.grade_2} onChange={(e) => setAssessment({ ...assessment, grade_2: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="field">
                                <label htmlFor="choice_3" className="font-semibold block mb-1 text-sm text-gray-700">Choice 3</label>
                                <InputText id="choice_3" value={assessment.choice_3} onChange={(e) => setAssessment({ ...assessment, choice_3: e.target.value })} />
                            </div>
                            <div className="field">
                                <label htmlFor="grade_3" className="font-semibold block mb-1 text-sm text-gray-700">Grade 3</label>
                                <InputText id="grade_3" value={assessment.grade_3} onChange={(e) => setAssessment({ ...assessment, grade_3: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save" severity="success" onClick={saveAssessment} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>

            <Dialog visible={importDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-2xl w-full" onHide={hideImportDialog} showHeader={false} contentClassName="rounded-3xl bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 6rem)' }}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Import Assessments Excel</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideImportDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="field mb-4">
                            <label className="font-semibold block mb-1 text-sm text-gray-700">Assignment Name <span className="text-red-500">*</span></label>
                            <AutoComplete value={importFlowName} suggestions={filteredNames} completeMethod={searchNames} onChange={(e) => setImportFlowName(e.value)} dropdown placeholder="e.g. Phase 1 Test" className="w-full p-autocomplete-custom" inputClassName="h-[45px] px-3 bg-gray-50 border border-gray-300 w-full" required />
                        </div>

                        <div className="field mb-6">
                            <label className="font-semibold block mb-1 text-sm text-gray-700">Location / Module <span className="text-red-500">*</span></label>
                            <AutoComplete value={importLocation} suggestions={filteredLocations} completeMethod={searchLocations} onChange={(e) => setImportLocation(e.value)} dropdown placeholder="e.g. Mumbai Module A" className="w-full p-autocomplete-custom" inputClassName="h-[45px] px-3 bg-gray-50 border border-gray-300 w-full" required />
                        </div>

                        <div className="field mb-2 border border-gray-200 rounded-xl overflow-hidden custom-import-fileupload">
                            <FileUpload
                                name="excelFile"
                                customUpload
                                uploadHandler={handleExcelImportSubmit}
                                accept=".xlsx,.csv"
                                maxFileSize={5000000}
                                emptyTemplate={<p className="m-0 text-center text-gray-500 p-8">Drag and drop Excel file here to process.</p>}
                                chooseLabel="Browse File"
                                uploadLabel="Process & Upload"
                                cancelLabel="Clear"
                            />
                        </div>
                    </div>
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
                        <h2 className="print-header">Manage Assessments</h2>
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
                                {filteredAssessments.map((item, index) => (
                                    <tr key={item.id || index}>
                                        {printColumns
                                            .filter(col => selectedPrintColumns.includes(col.field))
                                            .map(col => {
                                                const val = item[col.field] || '';
                                                return (
                                                    <td key={col.field}>
                                                        {['question_text', 'choice_1', 'choice_2', 'choice_3'].includes(col.field) ? stripHtml(val) : val}
                                                    </td>
                                                );
                                            })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageAssessment;
