import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Dialog } from 'primereact/dialog';
import * as xlsx from 'xlsx';

const CreateContent = () => {
    const toast = useRef(null);
    const audioUploadRef = useRef(null);
    const videoUploadRef = useRef(null);
    
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [refLinks, setRefLinks] = useState(['']);
    const [audioFile, setAudioFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [contentDialog, setContentDialog] = useState(false);

    useEffect(() => {
        fetchBooks();
        fetchContents();
    }, []);

    const fetchBooks = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/books/', { withCredentials: true });
            setBooks(res.data);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch books' });
        }
    };

    const fetchContents = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/contents/list', { withCredentials: true });
            setContents(res.data);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch contents' });
        }
    };

    const onBookChange = (e) => {
        const book = e.value;
        setSelectedBook(book);
        if (book) {
            setChapters(book.chapters || []);
        } else {
            setChapters([]);
        }
        setSelectedChapter(null);
    };

    const addRefLink = () => {
        setRefLinks([...refLinks, '']);
    };

    const removeRefLink = (index) => {
        const updated = refLinks.filter((_, i) => i !== index);
        setRefLinks(updated.length ? updated : ['']);
    };

    const updateRefLink = (index, value) => {
        const updated = [...refLinks];
        updated[index] = value;
        setRefLinks(updated);
    };

    const openNew = () => {
        setSelectedBook(null);
        setSelectedChapter(null);
        setChapters([]);
        setRefLinks(['']);
        setAudioFile(null);
        setVideoFile(null);
        setContentDialog(true);
    };

    const hideDialog = () => {
        setContentDialog(false);
    };

    const onSave = async () => {
        if (!selectedBook || !selectedChapter) {
            toast.current?.show({ severity: 'warn', summary: 'Validation Error', detail: 'Please select a Book and Chapter.' });
            return;
        }

        const validLinks = refLinks.map(l => l.trim()).filter(l => l !== '');
        
        const formData = new FormData();
        formData.append('book_id', selectedBook.id);
        formData.append('chapter_id', selectedChapter.id);
        formData.append('ref_link', JSON.stringify(validLinks));
        
        if (audioFile) formData.append('audio', audioFile);
        if (videoFile) formData.append('video', videoFile);

        try {
            setLoading(true);
            await axios.post('http://localhost:8000/api/contents/sync', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Content Saved' });
            setContentDialog(false);
            
            fetchContents();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.response?.data?.detail || 'Failed to save content' });
        } finally {
            setLoading(false);
        }
    };

    const importExcel = (e) => {
        const file = e.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                setLoading(true);
                const bstr = evt.target.result;
                const wb = xlsx.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = xlsx.utils.sheet_to_json(ws);
                
                const items = data.map(row => {
                    const rawLink = row['Ref_Link'];
                    let parsedLink = null;
                    if (rawLink) {
                        parsedLink = JSON.stringify([rawLink]);
                    }
                    return {
                        book_name: row['Book Name'] || row['Book_Name'] || '',
                        chapter_number: parseInt(row['Chapter Number'] || row['Chapter_Number']) || 0,
                        audio_url: row['Audio_URL/Path'] || null,
                        video_url: row['Video_URL/Path'] || null,
                        ref_link: parsedLink
                    };
                }).filter(i => i.book_name && i.chapter_number);

                if (items.length === 0) {
                    toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found in Excel' });
                    setLoading(false);
                    return;
                }

                const res = await axios.post('http://localhost:8000/api/contents/bulk', { items }, { withCredentials: true });
                toast.current?.show({ severity: 'success', summary: 'Import Success', detail: `Imported ${res.data.processed} records.` });
                fetchContents();
            } catch (error) {
                 toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to process bulk upload.' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/contents/${id}`, { withCredentials: true });
            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Content removed' });
            fetchContents();
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => handleDelete(rowData.id)} />
            </div>
        );
    };

    const refLinkBodyTemplate = (rowData) => {
        if (!rowData.ref_link) return 'None';
        let links = [];
        try {
            links = JSON.parse(rowData.ref_link);
            if (!Array.isArray(links)) links = [rowData.ref_link];
        } catch (e) {
            links = [rowData.ref_link];
        }
        
        if (links.length === 0) return 'None';

        return (
            <div className="flex flex-col gap-1">
                {links.map((link, idx) => (
                    <a key={idx} href={link} target="_blank" rel="noreferrer" className="text-blue-500 underline text-sm truncate max-w-[200px] block">Link {idx + 1}</a>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 bg-white min-h-screen">
            <Toast ref={toast} />
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white border border-gray-200 shadow-sm rounded-xl p-4 gap-4">
                <h1 className="text-xl font-bold text-black border-none m-0">Manage Training Content</h1>
                
                <div className="flex gap-2">
                    <div className="flex bg-white shadow-sm rounded-md p-1 border border-gray-200">
                        <FileUpload mode="basic" accept=".xlsx" maxFileSize={10000000} chooseLabel="Import Excel" 
                            onSelect={importExcel} auto className="p-button-outlined p-button-secondary" />
                    </div>
                    <Button label="Add Content" icon="pi pi-plus" severity="success" onClick={openNew} />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full p-4 mb-8">
                <div className="flex justify-between items-center w-full mb-4">
                    <h4 className="m-0 text-lg sm:text-xl font-bold text-black border-none">Content Listing</h4>
                </div>
                <DataTable value={contents} paginator rows={10} dataKey="id" emptyMessage="No content mappings found." className="p-datatable-sm w-full custom-admin-table" responsiveLayout="scroll" showGridlines rowClassName={() => 'bg-white text-black'}>
                    <Column field="book_name" header="Book Name" sortable filter filterPlaceholder="Search by book"></Column>
                    <Column field="chapter_number" header="Chapter No." sortable></Column>
                    <Column header="Audio" body={(r) => r.audio_url ? <a href={`http://localhost:8000${r.audio_url}`} target="_blank" rel="noreferrer" className="text-blue-500 underline">File</a> : 'None'}></Column>
                    <Column header="Video" body={(r) => r.video_url ? <a href={`http://localhost:8000${r.video_url}`} target="_blank" rel="noreferrer" className="text-blue-500 underline">File</a> : 'None'}></Column>
                    <Column field="ref_link" header="Reference Links" body={refLinkBodyTemplate}></Column>
                    <Column header="Activity" body={actionBodyTemplate} exportable={false} style={{ width: '10%' }}></Column>
                </DataTable>
            </div>

            <Dialog visible={contentDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-3xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl overflow-hidden bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Add Content</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700">Book *</label>
                                <Dropdown value={selectedBook} options={books} onChange={onBookChange} optionLabel="name" 
                                    placeholder="Select a Book" className="w-full" filter />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700">Chapter *</label>
                                <Dropdown value={selectedChapter} options={chapters} onChange={(e) => setSelectedChapter(e.value)} 
                                    optionLabel="chapter_number" placeholder="Select a Chapter" className="w-full" disabled={!selectedBook} />
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700">Audio Upload (.mp3, .wav)</label>
                                <FileUpload ref={audioUploadRef} mode="basic" accept="audio/*" maxFileSize={50000000} 
                                    onSelect={(e) => setAudioFile(e.files[0])} onClear={() => setAudioFile(null)} 
                                    chooseLabel="Select Audio" />
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700">Video Upload (.mp4)</label>
                                <FileUpload ref={videoUploadRef} mode="basic" accept="video/mp4,video/quicktime" maxFileSize={150000000} 
                                    onSelect={(e) => setVideoFile(e.files[0])} onClear={() => setVideoFile(null)} 
                                    chooseLabel="Select Video" />
                            </div>

                            <div className="flex flex-col gap-2 md:col-span-2">
                                <div className="flex justify-between items-center">
                                    <label className="font-semibold text-gray-700">Reference Links</label>
                                    <Button icon="pi pi-plus" className="p-button-rounded p-button-success p-button-text p-button-sm" onClick={addRefLink} aria-label="Add Link" tooltip="Add another link" tooltipOptions={{ position: 'top' }} />
                                </div>
                                {refLinks.map((link, index) => (
                                    <div key={index} className="flex gap-2 mb-2 items-center">
                                        <InputText 
                                            value={link} 
                                            onChange={(e) => updateRefLink(index, e.target.value)} 
                                            placeholder="e.g. https://youtube.com/..." 
                                            className="w-full"
                                        />
                                        {refLinks.length > 1 && (
                                            <Button icon="pi pi-trash" className="p-button-danger p-button-text" onClick={() => removeRefLink(index)} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save" severity="success" onClick={onSave} loading={loading} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default CreateContent;
