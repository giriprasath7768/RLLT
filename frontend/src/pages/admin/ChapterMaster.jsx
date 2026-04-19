import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Paginator } from 'primereact/paginator';
import * as XLSX from 'xlsx';
import '../../assets/css/AdminManagement.css';
import MobileDataCard from '../../components/common/MobileDataCard';

const ChapterMaster = () => {
    let emptyChapter = {
        id: null,
        book_id: null,
        chapter_number: 0,
        verse_count: 0,
        art: 0.0
    };

    const [chapters, setChapters] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');

    // CRUD state
    const [chapterDialog, setChapterDialog] = useState(false);
    const [deleteChapterDialog, setDeleteChapterDialog] = useState(false);
    const [importDialog, setImportDialog] = useState(false);
    const [chapter, setChapter] = useState(emptyChapter);
    const [submitted, setSubmitted] = useState(false);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(15);
    const dt = useRef(null);
    const toast = useRef(null);

    useEffect(() => {
        fetchChapters();
        fetchBooks();
    }, []);

    const fetchChapters = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/chapters', { withCredentials: true });
            setChapters(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching chapters:', error);
            setLoading(false);
        }
    };

    const fetchBooks = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/books', { withCredentials: true });
            setBooks(response.data);
        } catch (error) {
            console.error('Error fetching books for dropdown:', error);
        }
    };

    const openNew = () => {
        setChapter(emptyChapter);
        setSubmitted(false);
        setChapterDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setChapterDialog(false);
    };

    const hideDeleteChapterDialog = () => {
        setDeleteChapterDialog(false);
    };

    const saveChapter = async () => {
        setSubmitted(true);
        if (chapter.book_id && chapter.chapter_number > 0) {
            let _chapters = [...chapters];
            let _chapter = { ...chapter };

            try {
                if (chapter.id) {
                    const response = await axios.put(`http://localhost:8000/api/chapters/${chapter.id}`, _chapter, { withCredentials: true });
                    const index = findIndexById(chapter.id);
                    // Fast update book_name locally instead of full refresh
                    const selectedBook = books.find(b => b.id === _chapter.book_id);
                    _chapters[index] = { ...response.data, book_name: selectedBook ? selectedBook.name : 'Unknown' };
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Chapter Updated', life: 3000 });
                } else {
                    const response = await axios.post('http://localhost:8000/api/chapters/', _chapter, { withCredentials: true });
                    const selectedBook = books.find(b => b.id === _chapter.book_id);
                    _chapters.push({ ...response.data, book_name: selectedBook ? selectedBook.name : 'Unknown' });
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Chapter Created', life: 3000 });
                }
                setChapters(_chapters);
                setChapterDialog(false);
                setChapter(emptyChapter);
            } catch (error) {
                console.error("Save error: ", error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to save chapter', life: 3000 });
            }
        }
    };

    const editChapter = (chap) => {
        setChapter({ ...chap });
        setChapterDialog(true);
    };

    const confirmDeleteChapter = (chap) => {
        setChapter(chap);
        setDeleteChapterDialog(true);
    };

    const deleteChapter = async () => {
        try {
            await axios.delete(`http://localhost:8000/api/chapters/${chapter.id}`, { withCredentials: true });
            let _chapters = chapters.filter((val) => val.id !== chapter.id);
            setChapters(_chapters);
            setDeleteChapterDialog(false);
            setChapter(emptyChapter);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Chapter Deleted', life: 3000 });
        } catch (error) {
            console.error("Delete error: ", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete chapter', life: 3000 });
        }
    };

    const findIndexById = (id) => {
        let index = -1;
        for (let i = 0; i < chapters.length; i++) {
            if (chapters[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    };

    const onDropdownChange = (e, name) => {
        let _chapter = { ...chapter };
        _chapter[`${name}`] = e.value;
        setChapter(_chapter);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _chapter = { ...chapter };
        _chapter[`${name}`] = val;
        setChapter(_chapter);
    };

    const handleExcelImportSubmit = (e) => {
        const file = e.files[0];
        if (!file) return;

        if (books.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Books must be loaded first to map IDs.' });
            e.options.clear();
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

                if (data.length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found to import.' });
                    e.options.clear();
                    return;
                }

                let missingBooks = 0;
                const parsedChapters = data.map(row => {
                    const normalized = {};
                    Object.keys(row).forEach(k => {
                        const cleanKey = k.toLowerCase().replace(/\s+/g, '');
                        normalized[cleanKey] = row[k];
                    });

                    const rawNameStr = String(normalized['bookname'] || normalized['book'] || normalized['name'] || '').trim();
                    const bookStr = rawNameStr.toLowerCase();
                    const matchBook = books.find(b =>
                        b.name.toLowerCase() === bookStr ||
                        (b.short_form && b.short_form.toLowerCase() === bookStr)
                    );

                    if (!matchBook) {
                        missingBooks++;
                        return null;
                    }

                    return {
                        book_id: matchBook.id,
                        chapter_number: parseInt(normalized['chapterno.'] || normalized['chapterno'] || normalized['chapternumber'] || normalized['chapter'] || normalized['chapters']) || 0,
                        verse_count: parseInt(normalized['verses'] || normalized['versecount']) || 0,
                        art: parseFloat(normalized['totalart'] || normalized['art']) || 0.0
                    };
                }).filter(c => c !== null);

                if (parsedChapters.length === 0) {
                    toast.current.show({ severity: 'error', summary: 'Mapping Failed', detail: 'Could not match any Book Names from the Excel file to the database.' });
                    e.options.clear();
                    return;
                }

                setLoading(true);
                axios.post('http://localhost:8000/api/chapters/bulk', parsedChapters, { withCredentials: true })
                    .then(res => {
                        let msg = res.data.message || 'Imported Chapters successfully';
                        if (missingBooks > 0) msg += ` (Skipped ${missingBooks} rows due to unmapped books)`;
                        toast.current.show({ severity: 'success', summary: 'Success', detail: msg, life: 5000 });
                        setImportDialog(false);
                        fetchChapters();
                    })
                    .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to import bulk Chapters' }))
                    .finally(() => {
                        setLoading(false);
                        e.options.clear();
                    });

            } catch (err) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Could not parse Excel file.' });
                e.options.clear();
            }
        };
        reader.readAsBinaryString(file);
    };

    const topCardContent = (
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between w-full">
            <div className="flex flex-wrap gap-2">
                <Button label="New Chapter" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
                <Button label="Import Excel" icon="pi pi-upload" severity="help" onClick={() => setImportDialog(true)} className="hidden md:flex" />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined severity="info" className="mr-2" onClick={() => editChapter(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteChapter(rowData)} />
            </React.Fragment>
        );
    };

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Chapter Master Search</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const chapterDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" severity="success" onClick={saveChapter} />
        </React.Fragment>
    );

    const deleteChapterDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteChapterDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteChapter} />
        </React.Fragment>
    );

    const filteredChapters = chapters.filter(chap => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (chap.book_name && chap.book_name.toLowerCase().includes(search)) ||
            (chap.chapter_number && chap.chapter_number.toString().includes(search))
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
                    <DataTable ref={dt} value={chapters} dataKey="id"
                        paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        loading={loading} globalFilter={globalFilter} header={tableHeader}
                        className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'} emptyMessage="No chapters found.">
                        <Column header="S.No" body={(data, options) => options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="book_name" header="Book Name" sortable filterField="book_name" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column field="chapter_number" header="Chapter No." sortable style={{ width: '15%' }} headerClassName="admin-table-header"></Column>
                        <Column field="verse_count" header="Verses" sortable style={{ width: '15%' }} headerClassName="admin-table-header"></Column>
                        <Column field="art" header="ART" sortable style={{ width: '15%' }} headerClassName="admin-table-header"></Column>
                        <Column header="Activity" body={actionBodyTemplate} exportable={false} style={{ width: '12%' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredChapters.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} chapters" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    {filteredChapters.length > 0 ? (
                        filteredChapters.map(chap => (
                            <MobileDataCard
                                key={chap.id}
                                title={chap.book_name}
                                data={[
                                    { label: 'Chapter No.', value: chap.chapter_number },
                                    { label: 'Verses', value: chap.verse_count },
                                    { label: 'ART', value: chap.art }
                                ]}
                                onEdit={() => editChapter(chap)}
                                onDelete={() => confirmDeleteChapter(chap)}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No chapters found.
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="block md:hidden fixed bottom-6 right-6 z-50">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success shadow-lg" size="large" onClick={openNew} aria-label="Add New" />
            </div>

            <Dialog visible={chapterDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Chapter Details" modal className="p-fluid" footer={chapterDialogFooter} onHide={hideDialog}>

                <div className="field mb-4">
                    <label htmlFor="book_id" className="font-bold block mb-2">Book <span className="text-red-500">*</span></label>
                    <Dropdown
                        id="book_id"
                        value={chapter.book_id}
                        onChange={(e) => onDropdownChange(e, 'book_id')}
                        options={books}
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Select a Book"
                        filter
                        className={classNames('w-full', { 'p-invalid': submitted && !chapter.book_id })}
                    />
                    {submitted && !chapter.book_id && <small className="p-error text-red-500 block mt-1">Book selection is required.</small>}
                </div>

                <div className="field mb-4">
                    <label htmlFor="chapter_number" className="font-bold block mb-2">Chapter Number <span className="text-red-500">*</span></label>
                    <InputNumber
                        id="chapter_number"
                        value={chapter.chapter_number}
                        onValueChange={(e) => onInputNumberChange(e, 'chapter_number')}
                        useGrouping={false}
                        className={classNames({ 'p-invalid': submitted && chapter.chapter_number <= 0 })}
                    />
                    {submitted && chapter.chapter_number <= 0 && <small className="p-error text-red-500 block mt-1">Valid Chapter Number is required.</small>}
                </div>

                <div className="formgrid grid grid-cols-2 gap-4 mt-4">
                    <div className="field col-6">
                        <label htmlFor="verse_count" className="font-bold block mb-2">Total Verses</label>
                        <InputNumber id="verse_count" value={chapter.verse_count} onValueChange={(e) => onInputNumberChange(e, 'verse_count')} useGrouping={false} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="art" className="font-bold block mb-2">ART</label>
                        <InputNumber id="art" value={chapter.art} onValueChange={(e) => onInputNumberChange(e, 'art')} mode="decimal" minFractionDigits={2} maxFractionDigits={2} />
                    </div>
                </div>

            </Dialog>

            <Dialog visible={deleteChapterDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteChapterDialogFooter} onHide={hideDeleteChapterDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-yellow-500" />
                    {chapter && (
                        <span>
                            Are you sure you want to delete Chapter <b>{chapter.chapter_number}</b>?
                        </span>
                    )}
                </div>
            </Dialog>

            <Dialog visible={importDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Import Chapters Excel" modal onHide={() => setImportDialog(false)}>
                <div className="field mb-2 border border-gray-200 rounded-xl overflow-hidden p-2">
                    <FileUpload
                        name="excelFile"
                        customUpload
                        uploadHandler={handleExcelImportSubmit}
                        accept=".xlsx,.csv"
                        maxFileSize={5000000}
                        emptyTemplate={<p className="text-center text-gray-500 my-4">Drag and drop Chapter Master Excel file</p>}
                        chooseLabel="Browse"
                        uploadLabel="Upload & Import"
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default ChapterMaster;
