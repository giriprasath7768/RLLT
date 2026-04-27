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
    const [audioUploads, setAudioUploads] = useState([{ id: Date.now(), file: null, language: '' }]);

    const addAudioUpload = () => {
        setAudioUploads([...audioUploads, { id: Date.now(), file: null, language: '' }]);
    };

    const removeAudioUpload = (index) => {
        const updated = audioUploads.filter((_, i) => i !== index);
        setAudioUploads(updated.length ? updated : [{ id: Date.now(), file: null, language: '' }]);
    };

    const updateAudioUpload = (index, field, value) => {
        setAudioUploads(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const [videoFiles, setVideoFiles] = useState([]);
    const [pdfFiles, setPdfFiles] = useState([]);
    const [existingVideos, setExistingVideos] = useState([]);
    const [existingPdfs, setExistingPdfs] = useState([]);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [pendingVideosCount, setPendingVideosCount] = useState(0);
    const [pendingPdfsCount, setPendingPdfsCount] = useState(0);

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
            const res = await axios.get('http://' + window.location.hostname + ':8000/api/books/', { withCredentials: true });
            setBooks(res.data);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch books' });
        }
    };

    const fetchContents = async () => {
        try {
            const res = await axios.get('http://' + window.location.hostname + ':8000/api/contents/list', { withCredentials: true });
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
        setAudioUploads([{ id: Date.now(), file: null, language: '', isExisting: false }]);
        setVideoFiles([]);
        setPdfFiles([]);
        setExistingVideos([]);
        setExistingPdfs([]);
        setUploadingCount(0);
        setPendingVideosCount(0);
        setPendingPdfsCount(0);
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

        let existingAudios = [];
        if (chapterNode.audio_url) {
            try {
                const parsed = JSON.parse(chapterNode.audio_url);
                if (Array.isArray(parsed)) {
                    existingAudios = parsed.map(a => ({ id: Date.now() + Math.random(), isExisting: true, url: a.url, language: a.language || '' }));
                } else {
                    existingAudios = [{ id: Date.now(), isExisting: true, url: chapterNode.audio_url, language: chapterNode.audio_language || '' }];
                }
            } catch (e) {
                existingAudios = [{ id: Date.now(), isExisting: true, url: chapterNode.audio_url, language: chapterNode.audio_language || '' }];
            }
        }

        if (existingAudios.length > 0) {
            setAudioUploads(existingAudios);
        } else {
            setAudioUploads([{ id: Date.now(), file: null, language: '', isExisting: false }]);
        }

        setVideoFiles([]);
        setPdfFiles([]);

        let vUrls = [];
        if (chapterNode.video_url) {
            try { vUrls = JSON.parse(chapterNode.video_url); if (!Array.isArray(vUrls)) vUrls = [chapterNode.video_url]; }
            catch (err) { vUrls = [chapterNode.video_url]; }
        }
        setExistingVideos(vUrls.filter(Boolean));

        let pUrls = [];
        if (chapterNode.pdf_url) {
            try { pUrls = JSON.parse(chapterNode.pdf_url); if (!Array.isArray(pUrls)) pUrls = [chapterNode.pdf_url]; }
            catch (err) { pUrls = [chapterNode.pdf_url]; }
        }
        setExistingPdfs(pUrls.filter(Boolean));
        setPendingVideosCount(0);
        setPendingPdfsCount(0);

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

        const retainedExisting = [];
        const newAudioLanguages = [];
        audioUploads.forEach(au => {
            if (au.isExisting && au.url) {
                retainedExisting.push({ url: au.url, language: au.language });
            }
            if (au.file && !au.isExisting) {
                formData.append('audios', au.file);
                newAudioLanguages.push(au.language || '');
            }
        });

        formData.append('existing_audios', JSON.stringify(retainedExisting));
        formData.append('audio_languages', JSON.stringify(newAudioLanguages));

        if (videoUploadRef?.current?.getFiles()) {
            videoUploadRef.current.getFiles().forEach(v => formData.append('videos', v));
        }
        if (existingVideos.length > 0) {
            formData.append('existing_videos', JSON.stringify(existingVideos));
        }

        if (pdfUploadRef?.current?.getFiles()) {
            pdfUploadRef.current.getFiles().forEach(p => formData.append('pdfs', p));
        }
        if (existingPdfs.length > 0) {
            formData.append('existing_pdfs', JSON.stringify(existingPdfs));
        }


        try {
            setLoading(true);
            await axios.post('http://' + window.location.hostname + ':8000/api/contents/sync', formData, {
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
                        parsedVideoUrl = JSON.stringify([rawVideo]);
                    }

                    let parsedAudioUrl = null;
                    const rawAudio = row['Audio_URL/Path'];
                    const rawAudioLang = row['Audio Language'] || row['Audio_Language'] || '';
                    if (rawAudio) {
                        parsedAudioUrl = JSON.stringify([{ url: rawAudio, language: rawAudioLang }]);
                    }

                    return {
                        book_name: row['Book Name'] || row['Book_Name'] || '',
                        chapter_number: parseInt(row['Chapter Number'] || row['Chapter_Number']) || 0,
                        audio_url: parsedAudioUrl,
                        audio_language: rawAudioLang,
                        video_url: parsedVideoUrl,
                        ref_link: parsedLink
                    };
                }).filter(i => i.book_name && i.chapter_number);

                if (items.length === 0) {
                    toast.current?.show({ severity: 'warn', summary: 'Warning', detail: 'No valid rows found in Excel' });
                    setLoading(false);
                    return;
                }

                const res = await axios.post('http://' + window.location.hostname + ':8000/api/contents/bulk', { items }, { withCredentials: true });
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
            await axios.delete(`http://${window.location.hostname}:8000/api/contents/${id}`, { withCredentials: true });
            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Content removed' });
            fetchContents();
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete' });
        }
    };

    const downloadExcelFormat = () => {
        const wsData = [
            ["Book Name", "Chapter Number", "Audio_URL/Path", "Audio Language", "Video_URL/Path", "Ref_Link"],
            ["GENESIS", 1, "https://example.com/audio.mp3", "English", "https://example.com/video.mp4", "https://example.com/ref.pdf"]
        ];
        const ws = xlsx.utils.aoa_to_sheet(wsData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Template");
        xlsx.writeFile(wb, "Library_Import_Template.xlsx");
    };

    const groupedContents = contents.reduce((acc, curr) => {
        if (!acc[curr.book_name]) {
            acc[curr.book_name] = [];
        }
        acc[curr.book_name].push(curr);
        return acc;
    }, {});

    const filteredBooks = Object.keys(groupedContents).filter(bookName =>
        bookName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedBooks = filteredBooks.slice(first, first + rows);

    const onPageChange = (event) => {
        setFirst(event.first);
        setRows(event.rows);
    };

    const isSaveDisabled = loading;

    return (
        <div className="p-4 sm:p-8 bg-[#f8f9fa] min-h-screen">
            <Toast ref={toast} />
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white border border-gray-200 shadow-sm rounded-xl p-5 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 border-none m-0">Library Operations</h1>
                    <p className="text-gray-500 mt-1 mb-0 text-sm">Manage Audio, Video, and Reference Links for Books and Chapters.</p>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                    <Button
                        label="Download Format"
                        icon="pi pi-download"
                        severity="secondary"
                        outlined
                        onClick={downloadExcelFormat}
                        className="h-[40px] text-xs px-3"
                        title="Download Excel Import Template"
                    />
                    <div className="flex bg-white shadow-sm rounded-md border border-gray-200 p-0.5 relative" style={{ width: '130px', height: '40px' }}>
                        <FileUpload mode="basic" accept=".xlsx" maxFileSize={10000000} chooseLabel="Import Excel"
                            onSelect={importExcel} auto className="p-button-outlined p-button-secondary border-none w-full h-full text-xs" />
                    </div>
                    <Button label="Add Content" icon="pi pi-plus" severity="success" onClick={openNew} className="h-[40px]" />
                </div>
            </div>

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
                                        <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <i className="pi pi-headphones"></i> Audio
                                            </span>
                                            {(() => {
                                                if (!chapter.audio_url) return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                                let audios = [];
                                                try {
                                                    audios = JSON.parse(chapter.audio_url);
                                                    if (!Array.isArray(audios)) {
                                                        audios = [{ url: chapter.audio_url, language: chapter.audio_language }];
                                                    }
                                                } catch (e) {
                                                    audios = [{ url: chapter.audio_url, language: chapter.audio_language }];
                                                }
                                                if (audios.length === 0) return <span className="text-gray-400 text-sm">Not uploaded</span>;

                                                return (
                                                    <div className="flex flex-col gap-1.5 mt-1">
                                                        {audios.map((a, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <a href={`http://${window.location.hostname}:8000${a.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
                                                                    <i className="pi pi-play-circle"></i> Play Audio {i + 1}
                                                                </a>
                                                                {a.language && (
                                                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                                        {a.language}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>

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
                                                                    <a key={i} href={`http://${window.location.hostname}:8000${v}`} target="_blank" rel="noreferrer" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition-colors text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1 border border-blue-100">
                                                                        <i className="pi pi-play" style={{ fontSize: '10px' }}></i> View {i + 1}
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )
                                                    }
                                                    if (typeof vids === 'string') {
                                                        return <a href={`http://${window.location.hostname}:8000${vids}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Watch</a>;
                                                    }
                                                } catch (e) {
                                                    return <a href={`http://${window.location.hostname}:8000${chapter.video_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Watch</a>;
                                                }
                                                return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                            })()}
                                        </div>

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
                                                                    <a key={i} href={`http://${window.location.hostname}:8000${p}`} target="_blank" rel="noreferrer" className="text-gray-700 hover:text-red-600 text-[13px] hover:underline flex items-center gap-1.5 w-full">
                                                                        <i className="pi pi-file-pdf text-red-400 text-[12px] shrink-0"></i>
                                                                        <span>Document {i + 1}</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )
                                                    }
                                                    if (typeof pdfs === 'string') {
                                                        return <a href={`http://${window.location.hostname}:8000${pdfs}`} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-800 text-sm font-medium">View PDF</a>;
                                                    }
                                                } catch (e) {
                                                    return <a href={`http://${window.location.hostname}:8000${chapter.pdf_url}`} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-800 text-sm font-medium">View PDF</a>;
                                                }
                                                return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                            })()}
                                        </div>

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
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2">
                                        <i className="pi pi-headphones text-blue-600"></i> Audio Details
                                    </h3>
                                    <Button icon="pi pi-plus" label="Add Audio" className="p-button-outlined p-button-sm p-button-secondary bg-white" onClick={addAudioUpload} />
                                </div>

                                {audioUploads.map((au, index) => (
                                    <div key={au.id} className="flex flex-col gap-3 p-3 border border-gray-200 rounded-lg bg-white relative">
                                        {audioUploads.length > 1 && (
                                            <Button icon="pi pi-times" rounded text severity="danger"
                                                className="absolute top-1 right-1 w-6 h-6 p-0"
                                                onClick={() => removeAudioUpload(index)} />
                                        )}
                                        <div className="flex flex-col gap-2">
                                            {au.isExisting ? (
                                                <div className="flex flex-col gap-1">
                                                    <label className="font-semibold text-gray-600 text-sm">Existing Audio</label>
                                                    <a href={`http://${window.location.hostname}:8000${au.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm truncate bg-blue-50 px-3 py-2 rounded-md border border-blue-100 flex items-center gap-2">
                                                        <i className="pi pi-headphones"></i> View Current Audio File
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <label className="font-semibold text-gray-600 text-sm">Audio Upload (.mp3, .wav)</label>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <FileUpload mode="advanced" accept="audio/*" maxFileSize={50000000}
                                                            name="file" url="http://" + window.location.hostname + ":8000/api/contents/upload" withCredentials={true}
                                                            onSelect={(e) => updateAudioUpload(index, 'file', e.files[0])}
                                                            onClear={() => updateAudioUpload(index, 'file', null)}
                                                            onRemove={() => updateAudioUpload(index, 'file', null)}
                                                            onBeforeSend={() => setUploadingCount(prev => prev + 1)}
                                                            onUpload={(e) => {
                                                                setUploadingCount(prev => Math.max(0, prev - 1));
                                                                try {
                                                                    const res = JSON.parse(e.xhr.response);
                                                                    if (res.urls && res.urls.length > 0) {
                                                                        setAudioUploads(prev => {
                                                                            const arr = [...prev];
                                                                            arr[index] = { ...arr[index], url: res.urls[0], isExisting: true, file: null };
                                                                            return arr;
                                                                        });
                                                                    }
                                                                } catch (err) { }
                                                            }}
                                                            onError={() => setUploadingCount(prev => Math.max(0, prev - 1))}
                                                            emptyTemplate={<p className="m-0 text-sm">Drag audio here to upload.</p>} className="w-full" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-gray-600 text-sm">Audio Language</label>
                                            <Dropdown value={au.language} options={languageOptions}
                                                onChange={(e) => updateAudioUpload(index, 'language', e.value)}
                                                placeholder="Select Language Type" className="w-full" editable />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Video Segment */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-video text-red-500"></i> Reference Videos</h3>
                                <p className="text-xs text-gray-500 m-0">You can select and upload multiple videos for this book/chapter.</p>
                                <div className="flex flex-col gap-2 relative z-10 w-full overflow-hidden">
                                    {existingVideos.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {existingVideos.map((v, i) => (
                                                <div key={i} className="bg-blue-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-blue-100 text-sm">
                                                    <a href={`http://${window.location.hostname}:8000${v}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">Video {i + 1}</a>
                                                    <i className="pi pi-times cursor-pointer text-red-500 hover:text-red-700" onClick={() => setExistingVideos(prev => prev.filter((_, idx) => idx !== i))}></i>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <FileUpload name="file" url="http://" + window.location.hostname + ":8000/api/contents/upload" withCredentials={true}
                                        multiple accept="video/mp4,video/quicktime,video/webm" maxFileSize={150000000}
                                        onSelect={(e) => setPendingVideosCount(e.files.length)}
                                        onClear={() => setPendingVideosCount(0)}
                                        onRemove={(e) => setPendingVideosCount(prev => Math.max(0, prev - 1))}
                                        onBeforeSend={() => setUploadingCount(prev => prev + 1)}
                                        onUpload={(e) => {
                                            setUploadingCount(prev => Math.max(0, prev - 1));
                                            setPendingVideosCount(0);
                                            try {
                                                const res = JSON.parse(e.xhr.response);
                                                if (res.urls) setExistingVideos(prev => [...prev, ...res.urls]);
                                            } catch (err) { }
                                        }}
                                        onError={() => setUploadingCount(prev => Math.max(0, prev - 1))}
                                        emptyTemplate={<p className="m-0 text-sm text-gray-500">Drag and drop videos here or click to select.</p>} className="w-full" />
                                </div>
                            </div>

                            {/* PDF Segment */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-file-pdf text-red-600"></i> PDF Documents</h3>
                                <p className="text-xs text-gray-500 m-0">You can upload multiple PDF documents for this chapter.</p>
                                <div className="flex flex-col gap-2 relative z-10 w-full overflow-hidden">
                                    {existingPdfs.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {existingPdfs.map((v, i) => (
                                                <div key={i} className="bg-red-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-red-100 text-sm">
                                                    <a href={`http://${window.location.hostname}:8000${v}`} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-800">Document {i + 1}</a>
                                                    <i className="pi pi-times cursor-pointer text-red-500 hover:text-red-700" onClick={() => setExistingPdfs(prev => prev.filter((_, idx) => idx !== i))}></i>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <FileUpload name="file" url="http://" + window.location.hostname + ":8000/api/contents/upload" withCredentials={true}
                                        multiple accept="application/pdf" maxFileSize={50000000}
                                        onSelect={(e) => setPendingPdfsCount(e.files.length)}
                                        onClear={() => setPendingPdfsCount(0)}
                                        onRemove={(e) => setPendingPdfsCount(prev => Math.max(0, prev - 1))}
                                        onBeforeSend={() => setUploadingCount(prev => prev + 1)}
                                        onUpload={(e) => {
                                            setUploadingCount(prev => Math.max(0, prev - 1));
                                            setPendingPdfsCount(0);
                                            try {
                                                const res = JSON.parse(e.xhr.response);
                                                if (res.urls) setExistingPdfs(prev => [...prev, ...res.urls]);
                                            } catch (err) { }
                                        }}
                                        onError={() => setUploadingCount(prev => Math.max(0, prev - 1))}
                                        emptyTemplate={<p className="m-0 text-sm text-gray-500">Drag and drop PDFs here or click to select.</p>} className="w-full" />
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
                            <Button label="Save Content" severity="success" onClick={onSave} disabled={isSaveDisabled} loading={loading} className="bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default CreateContent;
