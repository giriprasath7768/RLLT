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
import { Paginator } from 'primereact/paginator';
import * as XLSX from 'xlsx';
import '../../assets/css/AdminManagement.css';
import MobileDataCard from '../../components/common/MobileDataCard';

const BookMaster = () => {
    let emptyBook = {
        id: null,
        name: '',
        short_form: '',
        author: 'Unknown',
        total_chapters: 0,
        total_verses: 0,
        total_art: 0.0,
        ppl: 0.0,
        book_type: ''
    };

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');

    // CRUD state
    const [bookDialog, setBookDialog] = useState(false);
    const [deleteBookDialog, setDeleteBookDialog] = useState(false);
    const [deleteBooksDialog, setDeleteBooksDialog] = useState(false);
    const [selectedBooks, setSelectedBooks] = useState(null);
    const [importDialog, setImportDialog] = useState(false);
    const [book, setBook] = useState(emptyBook);
    const [submitted, setSubmitted] = useState(false);
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(10);
    const dt = useRef(null);
    const toast = useRef(null);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await axios.get('http://' + window.location.hostname + ':8000/api/books', { withCredentials: true });
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
                    const response = await axios.put(`http://${window.location.hostname}:8000/api/books/${book.id}`, _book, { withCredentials: true });
                    const index = findIndexById(book.id);
                    _books[index] = response.data;
                    toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Book Updated', life: 3000 });
                } else {
                    const response = await axios.post('http://' + window.location.hostname + ':8000/api/books/', _book, { withCredentials: true });
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
            await axios.delete(`http://${window.location.hostname}:8000/api/books/${book.id}`, { withCredentials: true });
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

    const confirmDeleteSelected = () => {
        setDeleteBooksDialog(true);
    };

    const deleteSelectedBooks = () => {
        const deletePromises = selectedBooks.map(b => axios.delete(`http://${window.location.hostname}:8000/api/books/${b.id}`, { withCredentials: true }));
        Promise.all(deletePromises)
            .then(() => {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Books Deleted', life: 3000 });
                setDeleteBooksDialog(false);
                setSelectedBooks(null);
                fetchBooks();
            })
            .catch(err => {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Bulk deletion failed', life: 3000 });
            });
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
                        const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                        normalized[cleanKey] = row[k];
                    });

                    return {
                        name: String(normalized['bookname'] || normalized['name'] || '').trim(),
                        short_form: String(normalized['shortform'] || ''),
                        author: String(normalized['author'] || 'Unknown'),
                        total_chapters: parseInt(normalized['chapters'] || normalized['chapter'] || normalized['totalchapters']) || 0,
                        total_verses: parseInt(normalized['verses'] || normalized['totalverses']) || 0,
                        total_art: parseFloat(normalized['totalart'] || normalized['art']) || 0.0,
                        ppl: parseFloat(normalized['ppl']) || 0.0,
                        book_type: String(normalized['booktype'] || normalized['type'] || '')
                    };
                }).filter(b => b.name !== '');

                if (parsedBooks.length === 0) {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Could not map any Book Name columns.' });
                    e.options.clear();
                    return;
                }

                setLoading(true);
                axios.post('http://' + window.location.hostname + ':8000/api/books/bulk', parsedBooks, { withCredentials: true })
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

    const topCardContent = (
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between w-full">
            <div className="flex flex-wrap gap-2">
                <Button label="New Book" icon="pi pi-plus" severity="success" onClick={openNew} className="hidden md:flex" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={confirmDeleteSelected} disabled={!selectedBooks || !selectedBooks.length} className="hidden md:flex" />
                <Button label="Import Excel" icon="pi pi-upload" severity="help" onClick={() => setImportDialog(true)} className="hidden md:flex" />
            </div>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-pencil" rounded outlined severity="info" className="mr-2" onClick={() => editBook(rowData)} />
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => confirmDeleteBook(rowData)} />
            </React.Fragment>
        );
    };

    const authorBodyTemplate = (rowData) => {
        if (!rowData.author || rowData.author === 'Unknown') return '';
        return rowData.author;
    };

    const tableHeader = (
        <div className="flex justify-between items-center w-full">
            <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Book Master Search</h4>
            <span className="p-input-icon-left w-full md:w-auto relative flex items-center search-input-wrapper">
                <i className="pi pi-search absolute left-3 text-gray-400 z-10" />
                <InputText type="search" onInput={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." className="w-full md:w-auto pl-10 text-black py-2 border border-gray-300 rounded-md" />
            </span>
        </div>
    );

    const bookDialogFooter = (
        <React.Fragment>
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" severity="success" onClick={saveBook} />
        </React.Fragment>
    );

    const deleteBookDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={hideDeleteBookDialog} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteBook} />
        </React.Fragment>
    );

    const deleteBooksDialogFooter = (
        <React.Fragment>
            <Button label="No" icon="pi pi-times" outlined onClick={() => setDeleteBooksDialog(false)} />
            <Button label="Yes" icon="pi pi-check" severity="danger" onClick={deleteSelectedBooks} />
        </React.Fragment>
    );

    const filteredBooks = books.filter(book => {
        if (!globalFilter) return true;
        const search = globalFilter.toLowerCase();
        return (
            (book.name && book.name.toLowerCase().includes(search)) ||
            (book.short_form && book.short_form.toLowerCase().includes(search)) ||
            (book.author && book.author.toLowerCase().includes(search))
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
                    <DataTable ref={dt} value={books} dataKey="id" selection={selectedBooks} onSelectionChange={(e) => setSelectedBooks(e.value)}
                        paginator rows={rows} first={first} onPage={(e) => { setFirst(e.first); setRows(e.rows); }}
                        loading={loading} globalFilter={globalFilter} header={tableHeader}
                        className="p-datatable-sm w-full custom-admin-table" responsiveLayout="stack" breakpoint="768px" showGridlines
                        rowClassName={() => 'bg-white text-black'} emptyMessage="No books found.">
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                        <Column header="S.No" body={(data, options) => options.rowIndex + 1} exportable={false} style={{ width: '4rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="name" header="Book Name" sortable filterField="name" style={{ whiteSpace: 'nowrap', minWidth: '12rem' }} headerClassName="admin-table-header"></Column>
                        <Column field="short_form" header="Short Form" sortable style={{ width: '8%', wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column field="author" header="Author" body={authorBodyTemplate} sortable style={{ width: '10%', wordBreak: 'break-word', whiteSpace: 'normal' }} headerClassName="admin-table-header"></Column>
                        <Column field="book_type" header="Book Type" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="total_chapters" header="Chapters" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="total_verses" header="Verses" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="total_art" header="Total ART" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column field="ppl" header="PPL" sortable style={{ width: '8%' }} headerClassName="admin-table-header"></Column>
                        <Column header="Activity" body={actionBodyTemplate} exportable={false} style={{ width: '10%' }} headerClassName="admin-table-header"></Column>
                    </DataTable>
                </div>

                {/* External Paginator Card */}
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-2 mt-4 hidden md:block">
                    <Paginator first={first} rows={rows} totalRecords={filteredBooks.length} rowsPerPageOptions={[5, 10, 25]} onPageChange={(e) => { setFirst(e.first); setRows(e.rows); }}
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} books" />
                </div>

                {/* Mobile View */}
                <div className="block md:hidden mt-4">
                    {filteredBooks.length > 0 ? (
                        filteredBooks.map(book => (
                            <MobileDataCard
                                key={book.id}
                                title={book.name}
                                data={[
                                    { label: 'Short Form', value: book.short_form },
                                    { label: 'Author', value: book.author || 'Unknown' },
                                    { label: 'Chapters', value: book.total_chapters },
                                    { label: 'Verses', value: book.total_verses }
                                ]}
                                onEdit={() => editBook(book)}
                                onDelete={() => confirmDeleteBook(book)}
                            />
                        ))
                    ) : (
                        <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            No books found.
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile FAB */}
            <div className="block md:hidden fixed bottom-6 right-6 z-50">
                <Button icon="pi pi-plus" className="p-button-rounded p-button-success shadow-lg" size="large" onClick={openNew} aria-label="Add New" />
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

                <div className="field mb-4">
                    <label htmlFor="book_type" className="font-bold block mb-2">Book Type</label>
                    <InputText id="book_type" value={book.book_type} onChange={(e) => onInputChange(e, 'book_type')} />
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

            <Dialog visible={deleteBooksDialog} style={{ width: '32rem' }} breakpoints={{ '960px': '75vw', '641px': '90vw' }} header="Confirm Bulk Deletion" modal footer={deleteBooksDialogFooter} onHide={() => setDeleteBooksDialog(false)}>
                <div className="confirmation-content flex items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-4xl text-yellow-500" />
                    {selectedBooks && <span>Are you sure you want to delete the selected books?</span>}
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
