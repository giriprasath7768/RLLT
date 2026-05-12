import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Dialog } from 'primereact/dialog';
import { Paginator } from 'primereact/paginator';

const SevenTNTContentManagement = () => {
    const toast = useRef(null);

    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [verses, setVerses] = useState('');
    const [refLinks, setRefLinks] = useState(['']);
    
    // Media
    const [audioUploads, setAudioUploads] = useState([{ id: Date.now(), file: null }]);
    const [videoFiles, setVideoFiles] = useState([]);
    const [existingVideos, setExistingVideos] = useState([]);
    
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [contentDialog, setContentDialog] = useState(false);
    const [editId, setEditId] = useState(null);

    // Pagination & Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [first, setFirst] = useState(0);
    const [rows, setRows] = useState(6); 

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
            const res = await axios.get(`http://${window.location.hostname}:8000/api/seven-tnt-contents/list`, { withCredentials: true });
            setContents(res.data);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Could not fetch contents' });
        }
    };

    const addRefLink = () => setRefLinks([...refLinks, '']);
    const removeRefLink = (index) => {
        const updated = refLinks.filter((_, i) => i !== index);
        setRefLinks(updated.length ? updated : ['']);
    };
    const updateRefLink = (index, value) => {
        const updated = [...refLinks];
        updated[index] = value;
        setRefLinks(updated);
    };

    const updateAudioUpload = (index, field, value) => {
        setAudioUploads(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const openNew = () => {
        setEditId(null);
        setSelectedBook(null);
        setVerses('');
        setRefLinks(['']);
        setAudioUploads([{ id: Date.now(), file: null, isExisting: false }]);
        setVideoFiles([]);
        setExistingVideos([]);
        setContentDialog(true);
    };

    const editContent = (content) => {
        setEditId(content.id);
        const matchedBook = books.find(b => b.id === content.book_id) || { id: content.book_id, name: content.book_name };
        setSelectedBook(matchedBook);
        setVerses(content.verses || '');
        setRefLinks([content.ref_link || '']);

        let parsedAudios = [];
        try {
            parsedAudios = JSON.parse(content.audio_url);
            if (!Array.isArray(parsedAudios)) {
                if (content.audio_url) parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
            }
        } catch (e) {
            if (content.audio_url) parsedAudios = [{ url: content.audio_url, language: content.audio_language || '' }];
        }

        if (parsedAudios.length > 0) {
            setAudioUploads(parsedAudios.map((a, i) => ({ id: Date.now() + i, file: null, url: a.url, language: a.language, isExisting: true })));
        } else {
            setAudioUploads([{ id: Date.now(), file: null, isExisting: false }]);
        }

        let parsedVideos = [];
        try {
            parsedVideos = JSON.parse(content.video_url);
            if (!Array.isArray(parsedVideos)) {
                if (content.video_url) parsedVideos = [content.video_url];
            }
        } catch (e) {
            if (content.video_url) parsedVideos = [content.video_url];
        }
        setExistingVideos(parsedVideos);
        setVideoFiles([]);

        setContentDialog(true);
    };

    const hideDialog = () => setContentDialog(false);

    const onSave = async () => {
        if (!selectedBook || !verses) {
            toast.current?.show({ severity: 'error', summary: 'Validation Error', detail: 'Book and Verses are required' });
            return;
        }

        setLoading(true);
        const formData = new FormData();
        if (editId) formData.append('content_id', editId);
        formData.append('book_id', selectedBook.id);
        formData.append('verses', verses);
        formData.append('ref_link', refLinks[0] || '');

        const existingAudioList = [];
        audioUploads.forEach((au) => {
            if (au.isExisting) {
                existingAudioList.push({ url: au.url, language: au.language || '' });
            } else if (au.file) {
                formData.append('audios', au.file);
            }
        });
        formData.append('existing_audios', JSON.stringify(existingAudioList));

        videoFiles.forEach((vf) => {
            if (vf) formData.append('videos', vf);
        });
        formData.append('existing_videos', JSON.stringify(existingVideos));

        try {
            await axios.post(`http://${window.location.hostname}:8000/api/seven-tnt-contents/sync`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Content saved successfully' });
            setContentDialog(false);
            fetchContents();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to save content' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this content?')) return;
        try {
            await axios.delete(`http://${window.location.hostname}:8000/api/seven-tnt-contents/${id}`, { withCredentials: true });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Content deleted' });
            fetchContents();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to delete content' });
        }
    };

    const groupedContents = contents.reduce((acc, curr) => {
        if (!acc[curr.book_name]) acc[curr.book_name] = [];
        acc[curr.book_name].push(curr);
        return acc;
    }, {});

    const filteredBooks = Object.keys(groupedContents).filter(bookName =>
        bookName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const paginatedBooks = filteredBooks.slice(first, first + rows);

    return (
        <div className="p-4 sm:p-8 bg-[#f8f9fa] min-h-screen">
            <Toast ref={toast} />
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center bg-white border border-gray-200 shadow-sm rounded-xl p-5 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 border-none m-0">7 TNT Content Management</h1>
                    <p className="text-gray-500 mt-1 mb-0 text-sm">Manage Audio, Video, Verses and Text for 7 TNT Contents.</p>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                    <Button label="Add Content" icon="pi pi-plus" severity="success" onClick={openNew} className="h-[40px]" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedBooks.map(bookName => (
                    <div key={bookName} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-[500px]">
                        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white flex justify-between items-center shrink-0">
                            <h3 className="m-0 text-xl font-bold truncate flex items-center gap-2">
                                <i className="pi pi-server text-xl"></i>
                                {bookName}
                            </h3>
                            <span className="bg-white/20 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                {groupedContents[bookName].length} Items
                            </span>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
                            {groupedContents[bookName].map((content) => (
                                <div key={content.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3 last:mb-0 shadow-sm relative group">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-800">Verses: {content.verses}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button icon="pi pi-pencil" rounded text severity="info" aria-label="Edit" onClick={() => editContent(content)}
                                                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 hover:bg-blue-100 mr-1" title="Edit Content" />
                                            <Button icon="pi pi-trash" rounded text severity="danger" aria-label="Delete" onClick={() => handleDelete(content.id)}
                                                className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100" title="Delete Content" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <i className="pi pi-headphones"></i> Audio
                                            </span>
                                            {(() => {
                                                if (!content.audio_url) return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                                let audios = [];
                                                try {
                                                    audios = JSON.parse(content.audio_url);
                                                    if (!Array.isArray(audios)) audios = [{ url: content.audio_url }];
                                                } catch (e) {
                                                    audios = [{ url: content.audio_url }];
                                                }
                                                return (
                                                    <div className="flex flex-col gap-1.5 mt-1">
                                                        {audios.map((a, i) => (
                                                            <a key={i} href={`http://${window.location.hostname}:8000${a.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
                                                                <i className="pi pi-external-link text-xs"></i> Play Audio {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        
                                        <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                <i className="pi pi-video"></i> Video
                                            </span>
                                            {(() => {
                                                if (!content.video_url) return <span className="text-gray-400 text-sm">Not uploaded</span>;
                                                let videos = [];
                                                try {
                                                    videos = JSON.parse(content.video_url);
                                                    if (!Array.isArray(videos)) videos = [content.video_url];
                                                } catch (e) {
                                                    videos = [content.video_url];
                                                }
                                                return (
                                                    <div className="flex flex-col gap-1.5 mt-1">
                                                        {videos.map((v, i) => (
                                                            <a key={i} href={`http://${window.location.hostname}:8000${v}`} target="_blank" rel="noreferrer" className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center gap-1">
                                                                <i className="pi pi-external-link text-xs"></i> Watch Video {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        
                                        {content.ref_link && (
                                            <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                                                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                                                    <i className="pi pi-link"></i> Reference
                                                </span>
                                                <a href={content.ref_link} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center gap-1 truncate" title={content.ref_link}>
                                                    <i className="pi pi-external-link text-xs"></i> Open Link
                                                </a>
                                            </div>
                                        )}
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
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">No 7 TNT Content Found</h3>
                        <p className="text-gray-500 text-center max-w-md">Get started by adding content manually through the Add Content button.</p>
                    </div>
                )}
            </div>

            <Dialog visible={contentDialog} breakpoints={{ '960px': '75vw', '641px': '95vw' }} modal className="p-fluid custom-admin-dialog max-w-4xl w-full" onHide={hideDialog} showHeader={false} contentClassName="rounded-3xl overflow-hidden bg-[#060238] p-0">
                <div className="p-4 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold text-gray-800 m-0">7 TNT - Add New Content</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={hideDialog} className="w-8 h-8 p-0" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700">Book Name *</label>
                                <Dropdown value={selectedBook} options={books} onChange={(e) => setSelectedBook(e.value)} optionLabel="name"
                                    placeholder="Select a Book" className="w-full" filter />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-semibold text-gray-700">Verses *</label>
                                <InputText value={verses} onChange={(e) => setVerses(e.target.value)} placeholder="e.g. Genesis 1:1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2">
                                        <i className="pi pi-headphones text-blue-600"></i> Audio Details
                                    </h3>
                                </div>
                                {audioUploads.map((au, index) => (
                                    <div key={au.id} className="flex flex-col gap-3 p-3 border border-gray-200 rounded-lg bg-white relative">
                                        <label className="font-semibold text-gray-600 text-sm">Audio Upload (.mp3, .wav)</label>
                                        {au.isExisting && au.url ? (
                                            <div className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                                                <a href={`http://${window.location.hostname}:8000${au.url}`} target="_blank" rel="noreferrer" className="text-blue-600 truncate text-sm">
                                                    Existing Audio
                                                </a>
                                                <Button icon="pi pi-times" className="p-button-rounded p-button-text p-button-danger w-6 h-6 p-0" onClick={() => removeAudioUpload(index)} />
                                            </div>
                                        ) : (
                                            <FileUpload mode="advanced" accept="audio/*" maxFileSize={50000000} customUpload uploadHandler={(e) => { if (document.activeElement) document.activeElement.blur(); setTimeout(() => { e.options.clear(); updateAudioUpload(index, 'file', e.files[0]); }, 50); }} emptyTemplate={<p className="m-0 text-sm">Drag audio here.</p>} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                                <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-video text-red-500"></i> Reference Videos</h3>
                                {existingVideos.length > 0 && (
                                    <div className="flex flex-col gap-2">
                                        {existingVideos.map((ev, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                                                <a href={`http://${window.location.hostname}:8000${ev}`} target="_blank" rel="noreferrer" className="text-red-500 truncate text-sm">
                                                    Existing Video {i + 1}
                                                </a>
                                                <Button icon="pi pi-times" className="p-button-rounded p-button-text p-button-danger w-6 h-6 p-0" onClick={() => setExistingVideos(existingVideos.filter((_, idx) => idx !== i))} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <FileUpload name="file" multiple accept="video/mp4,video/quicktime,video/webm" maxFileSize={150000000} customUpload uploadHandler={(e) => { if (document.activeElement) document.activeElement.blur(); setTimeout(() => { e.options.clear(); setVideoFiles(e.files); }, 50); }} emptyTemplate={<p className="m-0 text-sm text-gray-500">Drag and drop new videos here.</p>} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-gray-800 m-0 text-sm uppercase tracking-wide flex items-center gap-2"><i className="pi pi-link text-green-600"></i> Reference Links</h3>
                                <Button icon="pi pi-plus" label="Add Link" className="p-button-outlined p-button-sm p-button-secondary bg-white" onClick={addRefLink} />
                            </div>
                            {refLinks.map((link, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <InputText value={link} onChange={(e) => updateRefLink(index, e.target.value)} placeholder="https://youtube.com/..." className="w-full" />
                                    {refLinks.length > 1 && (
                                        <Button icon="pi pi-trash" className="p-button-danger p-button-text hover:bg-red-50" onClick={() => removeRefLink(index)} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={hideDialog} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save Content" severity="success" onClick={onSave} loading={loading} className="bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default SevenTNTContentManagement;
