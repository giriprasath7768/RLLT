import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Dialog } from 'primereact/dialog';
import { Paginator } from 'primereact/paginator';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import * as xlsx from 'xlsx';

const languageOptions = [
    { label: 'English', value: 'English' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'Tamil', value: 'Tamil' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Telugu', value: 'Telugu' },
    { label: 'Malayalam', value: 'Malayalam' }
];

const CreateContent = () => {
    const toast = useRef(null);
    const audioUploadRef = useRef(null);
    const videoUploadRef = useRef(null);
    const pdfUploadRef = useRef(null);

    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [refLinks, setRefLinks] = useState(['']);

    // Media and metadata
    const [audioFile, setAudioFile] = useState(null);
    const [audioLanguage, setAudioLanguage] = useState('');
    const [videoFiles, setVideoFiles] = useState([]);
    const [pdfFiles, setPdfFiles] = useState([]);

    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [contentDialog, setContentDialog] = useState(false);

    // Pagination & Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(6); // 6 books per page

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
        setAudioLanguage('');
        setVideoFiles([]);
        setPdfFiles([]);
        if (audioUploadRef.current) audioUploadRef.current.clear();
        if (videoUploadRef.current) videoUploadRef.current.clear();
        if (pdfUploadRef.current) pdfUploadRef.current.clear();
        setContentDialog(true);
    };

    const editContent = (chapterNode) => {
        const foundBook = books.find(b => b.name === chapterNode.book_name);
        setSelectedBook(foundBook || null);

        if (foundBook) {
            setChapters(foundBook.chapters || []);
            const foundChapter = (foundBook.chapters || []).find(c => parseInt(c.chapter_number) === parseInt(chapterNode.chapter_number));
            setSelectedChapter(foundChapter || null);
        } else {
            setChapters([]);
            setSelectedChapter(null);
        }

        setAudioLanguage(chapterNode.audio_language || '');
        setAudioFile(null);
        setVideoFiles([]);
        setPdfFiles([]);
        if (audioUploadRef.current) audioUploadRef.current.clear();
        if (videoUploadRef.current) videoUploadRef.current.clear();
        if (pdfUploadRef.current) pdfUploadRef.current.clear();

        let parsedLinks = [''];
        if (chapterNode.ref_link) {
            try {
                const arr = JSON.parse(chapterNode.ref_link);
                if (Array.isArray(arr) && arr.length > 0) {
                    parsedLinks = arr;
                }
            } catch (e) {
                parsedLinks = [chapterNode.ref_link];
            }
        }
        setRefLinks(parsedLinks);

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

        if (audioLanguage) {
            formData.append('audio_language', audioLanguage);
        }

        if (audioFile) {
            formData.append('audio', audioFile);
        }

        if (videoFiles && videoFiles.length > 0) {
            videoFiles.forEach(file => {
                formData.append('videos', file);
            });
        }
        if (pdfFiles && pdfFiles.length > 0) {
            pdfFiles.forEach(file => {
                formData.append('pdfs', file);
            });
        }

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

                    let parsedVideoUrl = null;
                    const rawVideo = row['Video_URL/Path'];
                    if (rawVideo) {
                        // Keep legacy single video backwards compat, try wrapping in array
                        parsedVideoUrl = JSON.stringify([rawVideo]);
                    }

                    return {
                        book_name: row['Book Name'] || row['Book_Name'] || '',
                        chapter_number: parseInt(row['Chapter Number'] || row['Chapter_Number']) || 0,
                        audio_url: row['Audio_URL/Path'] || null,
                        audio_language: row['Audio Language'] || row['Audio_Language'] || null,
                        video_url: parsedVideoUrl,
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

    // Group contents by book name for Library View
    const groupedContents = contents.reduce((acc, curr) => {
        if (!acc[curr.book_name]) {
            acc[curr.book_name] = [];
        }
        acc[curr.book_name].push(curr);
        return acc;
    }, {});

    // Filter books by search query
    const filteredBooks = Object.keys(groupedContents).filter(bookName =>
        bookName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Paginate books
    const paginatedBooks = filteredBooks.slice(first, first + rows);

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    return (
        <div className="p-4 sm:p-8 bg-[#f8f9fa] min-h-screen">
            <Toast ref={toast} />
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white border border-gray-200 shadow-sm rounded-xl p-5 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 border-none m-0">Library Operations</h1>
                    <p className="text-gray-500 mt-1 mb-0 text-sm">Manage Audio, Video, and Reference Links for Books and Chapters.</p>
                </div>

                <div className="flex gap-3">
                    <div className="flex bg-white shadow-sm rounded-md border border-gray-200 p-0.5 relative" style={{ width: '130px', height: '40px' }}>
                        <FileUpload mode="basic" accept=".xlsx" maxFileSize={10000000} chooseLabel="Import Excel"
                            onSelect={importExcel} auto className="p-button-outlined p-button-secondary border-none w-full h-full text-xs" />
                    </div>
                    <Button label="Add Content" icon="pi pi-plus" severity="success" onClick={openNew} className="h-[40px]" />
                </div>
            </div>

            {/* Library Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedBooks.map(bookName => (
                    <div key={bookName} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-[500px]">
                        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white flex justify-between items-center shrink-0">
                            <h3 className="m-0 text-xl font-bold truncate flex items-center gap-2">
                                <i className="pi pi-book text-xl"></i>
                                {bookName}
                            </h3>
                            <span className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                {groupedContents[bookName].length} Chapters
                            </span>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
                            {groupedContents[bookName].map((chapter) => (
                                <div key={chapter.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3 last:mb-0 shadow-sm relative group">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                                {chapter.chapter_number}
                                            </div>
                                            <span className="font-bold text-gray-800">Chapter {chapter.chapter_number}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button icon="pi pi-pencil" rounded text severity="info" aria-label="Edit" onClick={() => editContent(chapter)}
                                                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 hover:bg-blue-100 mr-1" title="Edit Content" />
                                            <Button icon="pi pi-trash" rounded text severity="danger" aria-label="Delete" onClick={() => handleDelete(chapter.id)}
                                                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100" title="Delete Content Mapping" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Audio Section */}
                                        <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <i className="pi pi-headphones"></i> Audio
                                            </span>
                                            {chapter.audio_url ? (
                                                <div className="flex items-center gap-2">
                                                    <a href={`http://localhost:8000${chapter.audio_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
                                                        <i className="pi pi-play-circle"></i> Play Audio
                                                    </a>
                                                    {chapter.audio_language && (
                                                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                            {chapter.audio_language}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : <span className="text-gray-400 text-sm">Not uploaded</span>}
                                        </div>

                                        {/* Reference Videos */}
                                        <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <i className="pi pi-video"></i> Videos
                                            </span>
                                            {(() => {
                                                if (!chapter.video_url) return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                                try {
                                                    const vids = JSON.parse(chapter.video_url);
                                                    if (Array.isArray(vids) && vids.length > 0) {
                                                        return (
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                {vids.map((v, i) => (
                                                                    <a key={i} href={`http://localhost:8000${v}`} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition-colors text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 border border-blue-100">
                                                                        <i className="pi pi-play" style={{ fontSize: '10px' }}></i> View {i + 1}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )
                                                    }
                                                    if (typeof vids === 'string') {
                                                        return <a href={`http://localhost:8000${vids}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Watch</a>;
                                                    }
                                                } catch (e) {
                                                    return <a href={`http://localhost:8000${chapter.video_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Watch</a>;
                                                }
                                                return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                            })()}
                                        </div>

                                        {/* PDFs */}
                                        <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <i className="pi pi-file-pdf text-red-600"></i> PDF Documents
                                            </span>
                                            {(() => {
                                                if (!chapter.pdf_url) return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                                try {
                                                    const pdfs = JSON.parse(chapter.pdf_url);
                                                    if (Array.isArray(pdfs) && pdfs.length > 0) {
                                                        return (
                                                            <div className="flex flex-col gap-1.5 mt-1">
                                                                {pdfs.map((p, i) => (
                                                                    <a key={i} href={`http://localhost:8000${p}`} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-red-600 text-[13px] hover:underline flex items-center gap-1.5 w-full">
                                                                        <i className="pi pi-file-pdf text-red-400 text-[12px] shrink-0"></i>
                                                                        <span>Document {i + 1}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )
                                                    }
                                                    if (typeof pdfs === 'string') {
                                                        return <a href={`http://localhost:8000${pdfs}`} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-800 text-sm font-medium">View PDF</a>;
                                                    }
                                                } catch (e) {
                                                    return <a href={`http://localhost:8000${chapter.pdf_url}`} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-800 text-sm font-medium">View PDF</a>;
                                                }
                                                return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                            })()}
                                        </div>

                                        {/* Reference Links */}
                                        <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <i className="pi pi-link"></i> Reference Links
                                            </span>
                                            {(() => {
                                                if (!chapter.ref_link) return <span className="text-gray-400 text-sm">None</span>;
                                                let links = [];
                                                try {
                                                    links = JSON.parse(chapter.ref_link);
                                                } catch (e) {
                                                    links = [chapter.ref_link];
                                                }

                                                if (!Array.isArray(links) || links.length === 0) return <span className="text-gray-400 text-sm">None</span>;

                                                return (
                                                    <div className="flex flex-col gap-1.5 mt-1">
                                                        {links.map((l, i) => (
                                                            <a key={i} href={l} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-blue-600 text-[13px] hover:underline flex items-center gap-1.5 w-full">
                                                                <i className="pi pi-external-link text-gray-400 text-[10px] shrink-0"></i>
                                                                <span className="truncate w-full block">{l}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedContents).length === 0 && (
                    <div className="col-span-1 md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <i className="pi pi-inbox text-2xl text-gray-400"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Library Content Found</h3>
                        <p className="text-gray-500 text-center max-w-md">Get started by importing an Excel sheet or adding content manually through the Add Content button.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {filteredBooks.length > 0 && (
                <div className="mt-6 flex justify-center bg-white rounded-xl shadow-sm border border-gray-200 p-2">
                    <Paginator
                        first={first}
                        rows={rows}
                        totalRecords={filteredBooks.length}
                        rowsPerPageOptions={[6, 12, 24, 60]}
                        onPageChange={onPageChange}
                        className="bg-transparent border-none"
                    />
                </div>
            )}

            <Dialog visible={contentDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-4xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl overflow-hidden bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Library - Add New Content</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Audio Segment */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-headphones text-blue-600"></i> Audio Details</h3>
                                <div className="flex flex-col gap-2">
                                    <label className="font-semibold text-gray-600 text-sm">Audio Upload (.mp3, .wav)</label>
                                    <FileUpload ref={audioUploadRef} mode="basic" accept="audio/*" maxFileSize={50000000}
                                        onSelect={(e) => setAudioFile(e.files[0])} onClear={() => setAudioFile(null)}
                                        chooseLabel="Select Audio" className="p-button-outlined" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="font-semibold text-gray-600 text-sm">Audio Language</label>
                                    <Dropdown value={audioLanguage} options={languageOptions} onChange={(e) => setAudioLanguage(e.value)}
                                        placeholder="Select Language Type" className="w-full" editable />
                                </div>
                            </div>

                            {/* Video Segment */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-video text-red-500"></i> Reference Videos</h3>
                                <p className="text-xs text-gray-500 m-0">You can select and upload multiple videos for this book/chapter.</p>
                                <div className="flex flex-col gap-2 relative z-10 w-full overflow-hidden">
                                    <FileUpload ref={videoUploadRef}
                                        accept="video/mp4,video/quicktime,video/webm" maxFileSize={150000000}
                                        customUpload
                                        uploadHandler={(e) => { }}
                                        onSelect={(e) => setVideoFiles([...videoFiles, ...e.files])}
                                        onRemove={(e) => setVideoFiles(videoFiles.filter(f => f.name !== e.file.name))}
                                        onClear={() => setVideoFiles([])}
                                        multiple chooseLabel="Add Video(s)" showUploadButton={false} showCancelButton={true} className="w-full CustomVideoFileUpload" />
                                    <style>{`
                                            .CustomVideoFileUpload .p-fileupload-buttonbar { padding: 0.5rem; background: transparent; border: none; border-bottom: 1px solid #e5e7eb;}
                                            .CustomVideoFileUpload .p-fileupload-content { padding: 0.5rem; background: transparent; border: none;}
                                            .CustomVideoFileUpload .p-fileupload-row { margin-bottom: 0.25rem; font-size: 0.75rem;}
                                            .CustomVideoFileUpload .p-fileupload-row > div { padding: 0.2rem; }
                                            .CustomVideoFileUpload .p-fileupload-row img { display: none; }
                                            .CustomVideoFileUpload .p-badge { display: none !important; }
                                            .CustomVideoFileUpload .p-progressbar { display: none !important; }
                                        `}</style>
                                </div>
                            </div>

                            {/* PDF Segment */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-file-pdf text-red-600"></i> PDF Documents</h3>
                                <p className="text-xs text-gray-500 m-0">You can upload multiple PDF documents for this chapter.</p>
                                <div className="flex flex-col gap-2 relative z-10 w-full overflow-hidden">
                                    <FileUpload ref={pdfUploadRef}
                                        accept="application/pdf" maxFileSize={150000000}
                                        customUpload
                                        uploadHandler={(e) => { }}
                                        onSelect={(e) => setPdfFiles([...pdfFiles, ...e.files])}
                                        onRemove={(e) => setPdfFiles(pdfFiles.filter(f => f.name !== e.file.name))}
                                        onClear={() => setPdfFiles([])}
                                        multiple chooseLabel="Add PDF(s)" showUploadButton={false} showCancelButton={true} className="w-full CustomVideoFileUpload" />
                                </div>
                            </div>

                            {/* Reference Links Segment */}
                            <div className="flex flex-col gap-3 md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-link text-green-600"></i> Reference Links</h3>
                                    <Button icon="pi pi-plus" label="Add Link" className="p-button-outlined p-button-sm p-button-secondary bg-white" onClick={addRefLink} />
                                </div>
                                {refLinks.map((link, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <InputText
                                            value={link}
                                            onChange={(e) => updateRefLink(index, e.target.value)}
                                            placeholder="https://youtube.com/..."
                                            className="w-full"
                                        />
                                        {refLinks.length > 1 && (
                                            <Button icon="pi pi-trash" className="p-button-danger p-button-text hover:bg-red-50" onClick={() => removeRefLink(index)} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save Content" severity="success" onClick={onSave} loading={loading} className="bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default CreateContent;
