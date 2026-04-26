const fs = require('fs');
const file = 'i:\\RLLT\\Webapp\\frontend\\src\\pages\\admin\\CreateContent.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add uploadCount states
c = c.replace(
    'const [pdfFiles, setPdfFiles] = useState([]);',
    `const [pdfFiles, setPdfFiles] = useState([]);
    const [existingVideos, setExistingVideos] = useState([]);
    const [existingPdfs, setExistingPdfs] = useState([]);
    const [uploadingCount, setUploadingCount] = useState(0);`
);

// 2. Add existing media loading in editContent
c = c.replace(
    'setVideoFiles([]);\n        setPdfFiles([]);',
    `setVideoFiles([]);
        setPdfFiles([]);
        
        let vUrls = [];
        if(chapterNode.video_url) {
            try { vUrls = JSON.parse(chapterNode.video_url); if(!Array.isArray(vUrls)) vUrls = [chapterNode.video_url]; }
            catch(err) { vUrls = [chapterNode.video_url]; }
        }
        setExistingVideos(vUrls.filter(Boolean));

        let pUrls = [];
        if(chapterNode.pdf_url) {
            try { pUrls = JSON.parse(chapterNode.pdf_url); if(!Array.isArray(pUrls)) pUrls = [chapterNode.pdf_url]; }
            catch(err) { pUrls = [chapterNode.pdf_url]; }
        }
        setExistingPdfs(pUrls.filter(Boolean));`
);

// 3. Clear them in openNew
c = c.replace(
    'setPdfFiles([]);\n            if (videoUploadRef',
    `setPdfFiles([]);
            setExistingVideos([]);
            setExistingPdfs([]);
            setUploadingCount(0);
            if (videoUploadRef`
);

// 4. Update onSave payload logic
c = c.replace(
    `        audioUploads.forEach(au => {
            if (au.isExisting) {
                retainedExisting.push({ url: au.url, language: au.language });
            } else if (au.file) {
                formData.append('audios', au.file);
                langs.push(au.language || '');
            }
        });

        if (langs.length > 0) {
            formData.append('audio_languages', JSON.stringify(langs));
        }
        formData.append('existing_audios', JSON.stringify(retainedExisting));

        if (videoFiles && videoFiles.length > 0) {
            videoFiles.forEach(file => {
                formData.append('videos', file);
            });
        }
        if (pdfFiles && pdfFiles.length > 0) {
            pdfFiles.forEach(file => {
                formData.append('pdfs', file);
            });
        }`,
    `        audioUploads.forEach(au => {
            if (au.isExisting && au.url) {
                retainedExisting.push({ url: au.url, language: au.language });
            }
        });

        formData.append('existing_audios', JSON.stringify(retainedExisting));

        if (existingVideos.length > 0) {
            formData.append('existing_videos', JSON.stringify(existingVideos));
        }
        if (existingPdfs.length > 0) {
            formData.append('existing_pdfs', JSON.stringify(existingPdfs));
        }
`
);

// 5. Update audio upload UI
c = c.replace(
    `                                                        <FileUpload mode="basic" accept="audio/*" maxFileSize={50000000}
                                                            name={\`audio_upload_\${au.id}\`}
                                                            id={\`audio_upload_\${au.id}\`}
                                                            onSelect={(e) => updateAudioUpload(index, 'file', e.files[0])}
                                                            onClear={() => updateAudioUpload(index, 'file', null)}
                                                            chooseLabel={au.file ? "Change Audio" : "Select Audio"} className="p-button-outlined w-full sm:w-auto" />
                                                        {au.file && (
                                                            <span className="text-sm text-green-600 font-semibold truncate bg-green-50 px-2 py-1 rounded-md border border-green-100 flex items-center gap-1.5" style={{maxWidth: '220px'}}>
                                                                <i className="pi pi-check-circle"></i>{au.file.name}
                                                            </span>
                                                        )}`,
    `                                                        <FileUpload mode="advanced" accept="audio/*" maxFileSize={50000000}
                                                            name="file" url="http://localhost:8000/api/contents/upload" withCredentials={true}
                                                            onBeforeSend={() => setUploadingCount(prev => prev + 1)}
                                                            onUpload={(e) => {
                                                                setUploadingCount(prev => Math.max(0, prev - 1));
                                                                try {
                                                                    const res = JSON.parse(e.xhr.response);
                                                                    if (res.urls && res.urls.length > 0) {
                                                                        updateAudioUpload(index, 'url', res.urls[0]);
                                                                        updateAudioUpload(index, 'isExisting', true);
                                                                    }
                                                                } catch(err) {}
                                                            }}
                                                            onError={() => setUploadingCount(prev => Math.max(0, prev - 1))}
                                                            emptyTemplate={<p className="m-0 text-sm">Drag audio here to upload.</p>} className="w-full" />`
);

// 6. Update Video Upload UI
c = c.replace(
    `                                <FileUpload ref={videoUploadRef} name="videos" multiple accept="video/*" maxFileSize={100000000}
                                    customUpload uploadHandler={(e) => setVideoFiles(e.files)}
                                    onClear={() => setVideoFiles([])}
                                    onRemove={(e) => {
                                        setVideoFiles(videoFiles.filter(f => f.name !== e.file.name));
                                    }}
                                    emptyTemplate={<p className="m-0 text-sm text-gray-500">Drag and drop videos here or click to select.</p>} />`,
    `                                {existingVideos.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {existingVideos.map((v, i) => (
                                            <div key={i} className="bg-blue-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-blue-100 text-sm">
                                                <a href={\`http://localhost:8000\${v}\`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">Video {i+1}</a>
                                                <i className="pi pi-times cursor-pointer text-red-500 hover:text-red-700" onClick={() => setExistingVideos(prev => prev.filter((_, idx) => idx !== i))}></i>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <FileUpload name="file" url="http://localhost:8000/api/contents/upload" withCredentials={true} multiple accept="video/*" maxFileSize={100000000}
                                    onBeforeSend={() => setUploadingCount(prev => prev + 1)}
                                    onUpload={(e) => {
                                        setUploadingCount(prev => Math.max(0, prev - 1));
                                        try {
                                            const res = JSON.parse(e.xhr.response);
                                            if (res.urls) setExistingVideos(prev => [...prev, ...res.urls]);
                                        } catch(err) {}
                                    }}
                                    onError={() => setUploadingCount(prev => Math.max(0, prev - 1))}
                                    emptyTemplate={<p className="m-0 text-sm text-gray-500">Drag and drop videos here or click to select.</p>} />`
);

// 7. Update PDF Upload UI
c = c.replace(
    `                                <FileUpload ref={pdfUploadRef} name="pdfs" multiple accept="application/pdf" maxFileSize={50000000}
                                    customUpload uploadHandler={(e) => setPdfFiles(e.files)}
                                    onClear={() => setPdfFiles([])}
                                    onRemove={(e) => {
                                        setPdfFiles(pdfFiles.filter(f => f.name !== e.file.name));
                                    }}
                                    emptyTemplate={<p className="m-0 text-sm text-gray-500">Drag and drop PDFs here or click to select.</p>} />`,
    `                                {existingPdfs.length > 0 && (
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        {existingPdfs.map((v, i) => (
                                            <div key={i} className="bg-red-50 px-3 py-1.5 rounded-md flex items-center gap-2 border border-red-100 text-sm">
                                                <a href={\`http://localhost:8000\${v}\`} target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-800">Document {i+1}</a>
                                                <i className="pi pi-times cursor-pointer text-red-500 hover:text-red-700" onClick={() => setExistingPdfs(prev => prev.filter((_, idx) => idx !== i))}></i>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <FileUpload name="file" url="http://localhost:8000/api/contents/upload" withCredentials={true} multiple accept="application/pdf" maxFileSize={50000000}
                                    onBeforeSend={() => setUploadingCount(prev => prev + 1)}
                                    onUpload={(e) => {
                                        setUploadingCount(prev => Math.max(0, prev - 1));
                                        try {
                                            const res = JSON.parse(e.xhr.response);
                                            if (res.urls) setExistingPdfs(prev => [...prev, ...res.urls]);
                                        } catch(err) {}
                                    }}
                                    onError={() => setUploadingCount(prev => Math.max(0, prev - 1))}
                                    emptyTemplate={<p className="m-0 text-sm text-gray-500">Drag and drop PDFs here or click to select.</p>} />`
);

// 8. Update Save button to disable while uploadingCount > 0
c = c.replace(
    `<Button label="Save" icon="pi pi-check" onClick={onSave} autoFocus />`,
    `<Button label="Save" icon="pi pi-check" onClick={onSave} disabled={uploadingCount > 0 || loading} autoFocus />`
);

fs.writeFileSync(file, c);
console.log('REFACTOR SUCCESS');
