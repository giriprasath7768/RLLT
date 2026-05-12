const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'frontend/src/pages/admin/BookIndex.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Remove react-pdf imports
content = content.replace(/import \{ Document, Page, pdfjs \} from 'react-pdf';\nimport 'react-pdf\/dist\/Page\/AnnotationLayer\.css';\nimport 'react-pdf\/dist\/Page\/TextLayer\.css';\n\npdfjs\.GlobalWorkerOptions\.workerSrc = `https:\/\/unpkg\.com\/pdfjs-dist@\$\{pdfjs\.version\}\/build\/pdf\.worker\.min\.mjs`;\n\nconst pdfOptions = \{[\s\S]*?\};\n/g, '');

// 2. Replace CSS class names
content = content.replace(/\.react-pdf__Page__textContent/g, '.pdf-page-content');

// 3. Rewrite PDFPageRender
const pdfPageRenderRegex = /const PDFPageRender = React\.forwardRef\(\(props, ref\) => \{[\s\S]*?className="absolute bottom-0 right-0 w-\[15%\] h-\[15%\] cursor-pointer z-\[60\]" \/>\n            <\/div>\n        <\/div>\n    \);\n\}\);/g;
const newPDFPageRender = `const PDFPageRender = React.forwardRef((props, ref) => {
    const isRightPage = props.pageNumber % 2 !== 0;

    const rightSpineObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.2) 3%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0) 25%)' };
    const leftSpineObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.2) 3%, rgba(0,0,0,0.05) 8%, rgba(0,0,0,0) 25%)' };
    const rightEdgeObj = { background: 'linear-gradient(to left, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 5%)' };
    const leftEdgeObj = { background: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 5%)' };
    const lightingObj = { background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.06) 100%)' };

    return (
        <div className={\`page \${props.isCover ? 'bg-[#1e2433]' : 'bg-[#e5e7eb]'} shadow-2xl\`} ref={ref} data-density={props.isCover ? "hard" : "soft"}>
            <div className={\`page-content w-full h-full \${props.isCover ? 'bg-[#2a3045] border-[3px] border-[#151a26] p-[8px]' : 'bg-[#ffffff]'} flex flex-col justify-center items-center relative overflow-hidden\`}>
                <div className="pdf-page-content absolute inset-0 p-[8%] pt-[10%] flex flex-col gap-2 z-50 text-left" data-page-number={props.pageNumber}>
                    {props.pageData && props.pageData.paragraphs.map((para, i) => (
                        <span key={i} className="pdf-selectable-paragraph text-[12px] leading-relaxed font-serif text-[#1a1a1a]" id={\`para-\${props.pageNumber}-\${i}\`}>
                            {para}
                        </span>
                    ))}
                </div>

                {/* Render Highlight Overlays */}
                {props.pageHighlights && props.pageHighlights.map(h => (
                    <React.Fragment key={h.id}>
                        {h.rects.map((rect, i) => (
                            <div
                                key={\`\${h.id}_\${i}\`}
                                style={{
                                    position: 'absolute',
                                    top: \`\${rect.top}%\`,
                                    left: \`\${rect.left}%\`,
                                    width: \`\${rect.width}%\`,
                                    height: \`\${rect.height}%\`,
                                    backgroundColor: h.isSquare ? 'transparent' : h.color,
                                    border: h.isSquare ? \`3px solid \${h.color}\` : 'none',
                                    borderRadius: h.isSquare ? '4px' : '0px',
                                    opacity: h.isSquare ? 1 : 0.35,
                                    mixBlendMode: h.isSquare ? 'normal' : 'multiply',
                                    pointerEvents: 'none',
                                    zIndex: 45
                                }}
                            />
                        ))}
                    </React.Fragment>
                ))}
                
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-10" style={lightingObj} />
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-20" style={isRightPage ? rightSpineObj : leftSpineObj} />
                <div className="absolute inset-y-0 inset-x-0 pointer-events-none z-30" style={isRightPage ? rightEdgeObj : leftEdgeObj} />
            </div>
        </div>
    );
});`;
content = content.replace(pdfPageRenderRegex, newPDFPageRender);

// 4. In handleTextSelectionComplete, fix pageNode reference
content = content.replace(/const pageNode = textContentNode\.closest\('\.react-pdf__Page'\);/g, "const pageNode = textContentNode;");

// 5. Replace PDF loading with JSON loading
const activePdfUrlRegex = /const activePdfUrl = React\.useMemo\([\s\S]*?setAspectReady\(false\);\n    \}, \[activePdfUrl\]\);\n\n    const onDocumentLoadSuccess = \(pdf\) => \{[\s\S]*?    \};/g;

const jsonLoadingCode = `    const activePdfUrl = React.useMemo(() => {
        if (!selectedBook || !selectedChapter) return null;
        const content = contentDB.find(c =>
            c.book_id === selectedBook.id && c.chapter_id === selectedChapter.id
        );
        if (content && content.pdf_url) {
            try {
                const pdfs = JSON.parse(content.pdf_url);
                if (Array.isArray(pdfs) && pdfs.length > 0) return \`http://\${window.location.hostname}:8000\${pdfs[0]}\`;
                if (typeof pdfs === 'string') return \`http://\${window.location.hostname}:8000\${pdfs}\`;
            } catch (e) {
                return \`http://\${window.location.hostname}:8000\${content.pdf_url}\`;
            }
        }
        return null;
    }, [selectedBook, selectedChapter, contentDB]);

    const activeJsonUrl = React.useMemo(() => {
        if (!activePdfUrl) return null;
        return activePdfUrl.replace('.pdf', '.json');
    }, [activePdfUrl]);

    const [bookData, setBookData] = useState(null);

    useEffect(() => {
        if (activeJsonUrl) {
            setAspectReady(false);
            axios.get(activeJsonUrl, { withCredentials: true })
                .then(res => {
                    setBookData(res.data);
                    setNumPages(res.data.pages.length);
                    setAspectRatio(1.4142);
                    setAspectReady(true);
                })
                .catch(err => {
                    console.error("Failed to load JSON scroll:", err);
                    setBookData(null);
                    setNumPages(null);
                });
        } else {
            setBookData(null);
            setNumPages(null);
        }
    }, [activeJsonUrl]);`;

content = content.replace(activePdfUrlRegex, jsonLoadingCode);

// 6. Replace <Document> wrapping <HTMLFlipBook> with just <HTMLFlipBook>
// This is the trickiest part. We will just use string replacement for the Document tags.
content = content.replace(/<Document\s+file=\{activePdfUrl\}[\s\S]*?error=\{[\s\S]*?\}[\s\S]*?>/g, '');
content = content.replace(/<\/Document>/g, '');

// 7. Pass pageData to PDFPageRender
content = content.replace(/<PDFPageRender\n(\s+)key=\{index\}\n(\s+)pageNumber=\{index \+ 1\}\n(\s+)width=\{baseWidth\}\n(\s+)isCover=\{isHardCover\}\n(\s+)pageHighlights=\{highlights\.filter\(h => h\.pageNumber === index \+ 1\)\}\n(\s+)\/>/g, 
`<PDFPageRender
$1key={index}
$2pageNumber={index + 1}
$3width={baseWidth}
$4isCover={isHardCover}
$5pageHighlights={highlights.filter(h => h.pageNumber === index + 1)}
$6pageData={bookData ? bookData.pages[index] : null}
$6/>`);

fs.writeFileSync(targetFile, content);
console.log("Successfully refactored BookIndex.jsx for native HTML rendering!");
