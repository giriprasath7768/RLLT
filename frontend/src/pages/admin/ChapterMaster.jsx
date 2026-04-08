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
import * as XLSX from 'xlsx';

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

    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="New Chapter" icon="pi pi-plus" severity="success" onClick={openNew} />
                <Button label="Import Excel" icon="pi pi-upload" className="p-button-help" onClick={() => setImportDialog(true)} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editChapter(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteChapter(rowData)} />
            </div>
        );
    };

    const header = (
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Chapter Master Search</h2>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    type="search"
                    onInput={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Global Search"
                    className="p-2 border rounded"
                />
            </span>
        </div>
    );

    const chapterDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" onClick={saveChapter} />
        </React.Fragment>
    );

    const deleteChapterDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteChapterDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteChapter} />
        </React.Fragment>
    );

    return (
        <div className="p-10">
            <Toast ref={toast} />
            <div className="card bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <Toolbar className="mb-4 bg-transparent border-none p-0" left={leftToolbarTemplate}></Toolbar>
                <DataTable
                    value={chapters}
                    paginator
                    rows={15}
                    dataKey="id"
                    loading={loading}
                    globalFilter={globalFilter}
                    header={header}
                    emptyMessage="No chapters found."
                    className="p-datatable-sm"
                    stripedRows
                >
                    <Column field="book_name" header="Book Name" sortable filterField="book_name" />
                    <Column field="chapter_number" header="Chapter No." sortable />
                    <Column field="verse_count" header="Verses" sortable />
                    <Column field="art" header="ART" sortable />
                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                </DataTable>
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
