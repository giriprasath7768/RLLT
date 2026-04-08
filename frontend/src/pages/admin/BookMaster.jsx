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
import { FileUpload } from 'primereact/fileupload';
import * as XLSX from 'xlsx';

const BookMaster = () => {
    let emptyBook = {
        id: null,
        name: '',
        short_form: '',
        author: 'Unknown',
        total_chapters: 0,
        total_verses: 0,
        total_art: 0.0,
        ppl: 0.0
    };

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    
    // CRUD state
    const [bookDialog, setBookDialog] = useState(false);
    const [deleteBookDialog, setDeleteBookDialog] = useState(false);
    const [importDialog, setImportDialog] = useState(false);
    const [book, setBook] = useState(emptyBook);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/books', { withCredentials: true });
            setBooks(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching books:', error);
            setLoading(false);
        }
    };

    const openNew = () => {
        setBook(emptyBook);
        setSubmitted(false);
        setBookDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setBookDialog(false);
    };

    const hideDeleteBookDialog = () => {
        setDeleteBookDialog(false);
    };

    const saveBook = async () => {
        setSubmitted(true);
        if (book.name.trim()) {
            let _books = [...books];
            let _book = { ...book };

            try {
                if (book.id) {
                    const response = await axios.put(`http://localhost:8000/api/books/${book.id}`, _book, { withCredentials: true });
                    const index = findIndexById(book.id);
                    _books[index] = response.data;
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Book Updated', life: 3000 });
                } else {
                    const response = await axios.post('http://localhost:8000/api/books/', _book, { withCredentials: true });
                    _books.push(response.data);
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Book Created', life: 3000 });
                }
                setBooks(_books);
                setBookDialog(false);
                setBook(emptyBook);
            } catch (error) {
                console.error("Save error: ", error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to save book', life: 3000 });
            }
        }
    };

    const editBook = (book) => {
        setBook({ ...book });
        setBookDialog(true);
    };

    const confirmDeleteBook = (book) => {
        setBook(book);
        setDeleteBookDialog(true);
    };

    const deleteBook = async () => {
        try {
            await axios.delete(`http://localhost:8000/api/books/${book.id}`, { withCredentials: true });
            let _books = books.filter((val) => val.id !== book.id);
            setBooks(_books);
            setDeleteBookDialog(false);
            setBook(emptyBook);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Book Deleted', life: 3000 });
        } catch (error) {
            console.error("Delete error: ", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete book', life: 3000 });
        }
    };

    const findIndexById = (id) => {
        let index = -1;
        for (let i = 0; i < books.length; i++) {
            if (books[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _book = { ...book };
        _book[`${name}`] = val;
        setBook(_book);
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _book = { ...book };
        _book[`${name}`] = val;
        setBook(_book);
    };

    const handleExcelImportSubmit = (e) => {
        const file = e.files[0];
        if (!file) return;

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

                // Map UI Table Headers -> Database Columns
                const parsedBooks = data.map(row => {
                    const normalized = {};
                    Object.keys(row).forEach(k => {
                        const cleanKey = k.toLowerCase().replace(/\s+/g, '');
                        normalized[cleanKey] = row[k];
                    });

                    return {
                        name: String(normalized['bookname'] || normalized['name'] || '').trim(),
                        short_form: String(normalized['shortform'] || ''),
                        author: String(normalized['author'] || 'Unknown'),
                        total_chapters: parseInt(normalized['chapters'] || normalized['chapter'] || normalized['totalchapters']) || 0,
                        total_verses: parseInt(normalized['verses'] || normalized['totalverses']) || 0,
                        total_art: parseFloat(normalized['totalart'] || normalized['art']) || 0.0,
                        ppl: parseFloat(normalized['ppl']) || 0.0
                    };
                }).filter(b => b.name !== '');

                if (parsedBooks.length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Could not map any Book Name columns.' });
                    e.options.clear();
                    return;
                }

                setLoading(true);
                axios.post('http://localhost:8000/api/books/bulk', parsedBooks, { withCredentials: true })
                    .then(res => {
                        toast.current.show({ severity: 'success', summary: 'Success', detail: res.data.message || 'Imported Books successfully' });
                        setImportDialog(false);
                        fetchBooks();
                    })
                    .catch(err => toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to import bulk Books' }))
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
                <Button label="New Book" icon="pi pi-plus" severity="success" onClick={openNew} />
                <Button label="Import Excel" icon="pi pi-upload" className="p-button-help" onClick={() => setImportDialog(true)} />
            </div>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded outlined className="mr-2" onClick={() => editBook(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteBook(rowData)} />
            </div>
        );
    };

    const authorBodyTemplate = (rowData) => {
        if (!rowData.author || rowData.author === 'Unknown') return '';
        return rowData.author;
    };

    const header = (
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Book Master Search</h2>
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

    const bookDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" onClick={saveBook} />
        </React.Fragment>
    );

    const deleteBookDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteBookDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteBook} />
        </React.Fragment>
    );

    return (
        <div className="p-10">
            <Toast ref={toast} />
            <div className="card bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <Toolbar className="mb-4 bg-transparent border-none p-0" left={leftToolbarTemplate}></Toolbar>
                <DataTable
                    value={books}
                    paginator
                    rows={10}
                    dataKey="id"
                    loading={loading}
                    globalFilter={globalFilter}
                    header={header}
                    emptyMessage="No books found."
                    className="p-datatable-sm"
                    stripedRows
                >
                    <Column field="name" header="Book Name" sortable filterField="name" />
                    <Column field="short_form" header="Short Form" sortable />
                    <Column field="author" header="Author" body={authorBodyTemplate} sortable />
                    <Column field="total_chapters" header="Chapters" sortable />
                    <Column field="total_verses" header="Verses" sortable />
                    <Column field="total_art" header="Total ART" sortable />
                    <Column field="ppl" header="PPL" sortable />
                    <Column body={actionBodyTemplate} exportable={false} style={{ minWidth: '12rem' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={bookDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Book Details" modal className="p-fluid" footer={bookDialogFooter} onHide={hideDialog}>
                <div className="field mb-4">
                    <label htmlFor="name" className="font-bold block mb-2">Book Name <span className="text-red-500">*</span></label>
                    <InputText id="name" value={book.name} onChange={(e) => onInputChange(e, 'name')} required autoFocus className={classNames({ 'p-invalid': submitted && !book.name })} />
                    {submitted && !book.name && <small className="p-error text-red-500">Book Name is required.</small>}
                </div>

                <div className="field mb-4">
                    <label htmlFor="short_form" className="font-bold block mb-2">Short Form</label>
                    <InputText id="short_form" value={book.short_form} onChange={(e) => onInputChange(e, 'short_form')} />
                </div>

                <div className="field mb-4">
                    <label htmlFor="author" className="font-bold block mb-2">Author</label>
                    <InputText id="author" value={book.author} onChange={(e) => onInputChange(e, 'author')} />
                </div>

                <div className="formgrid grid grid-cols-2 gap-4">
                    <div className="field col-6">
                        <label htmlFor="total_chapters" className="font-bold block mb-2">Total Chapters</label>
                        <InputNumber id="total_chapters" value={book.total_chapters} onValueChange={(e) => onInputNumberChange(e, 'total_chapters')} useGrouping={false} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="total_verses" className="font-bold block mb-2">Total Verses</label>
                        <InputNumber id="total_verses" value={book.total_verses} onValueChange={(e) => onInputNumberChange(e, 'total_verses')} useGrouping={false} />
                    </div>
                </div>

                <div className="formgrid grid grid-cols-2 gap-4 mt-4">
                    <div className="field col-6">
                        <label htmlFor="total_art" className="font-bold block mb-2">Total ART</label>
                        <InputNumber id="total_art" value={book.total_art} onValueChange={(e) => onInputNumberChange(e, 'total_art')} mode="decimal" minFractionDigits={2} maxFractionDigits={2} />
                    </div>
                    <div className="field col-6">
                        <label htmlFor="ppl" className="font-bold block mb-2">PPL</label>
                        <InputNumber id="ppl" value={book.ppl} onValueChange={(e) => onInputNumberChange(e, 'ppl')} mode="decimal" minFractionDigits={2} maxFractionDigits={2} />
                    </div>
                </div>
            </Dialog>

            <Dialog visible={deleteBookDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm" modal footer={deleteBookDialogFooter} onHide={hideDeleteBookDialog}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-yellow-500" />
                    {book && (
                        <span>
                            Are you sure you want to delete <b>{book.name}</b>?
                        </span>
                    )}
                </div>
            </Dialog>

            <Dialog visible={importDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Import Excel" modal onHide={() => setImportDialog(false)}>
                <div className="field mb-2 border border-gray-200 rounded-xl overflow-hidden p-2">
                    <FileUpload
                        name="excelFile"
                        customUpload
                        uploadHandler={handleExcelImportSubmit}
                        accept=".xlsx,.csv"
                        maxFileSize={5000000}
                        emptyTemplate={<p className="text-center text-gray-500 my-4">Drag and drop Book Master Excel file</p>}
                        chooseLabel="Browse"
                        uploadLabel="Upload & Import"
                    />
                </div>
            </Dialog>
        </div>
    );
};

export default BookMaster;
