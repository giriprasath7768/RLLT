import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';

const PageNodeView = ({ editor, node, getPos, deleteNode }) => {
    // Determine if this is the first page node in the document
    const isFirstPage = getPos() === 0;

    // Check if the page is essentially blank (no text and no interactive/image elements)
    let hasContent = false;
    if (node && node.content) {
        if (node.textContent.trim().length > 0) hasContent = true;
        node.content.descendants((child) => {
            if (['image', 'resizableImage', 'shape', 'textbox'].includes(child.type.name)) {
                hasContent = true;
            }
        });
    }

    return (
        <NodeViewWrapper className={`a4-page-node relative group ${!hasContent ? 'print:hidden' : ''}`} style={{ margin: '0 auto 40px auto', width: '100%' }}>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-[200] print:hidden">
                {!isFirstPage && (
                    <button
                        contentEditable={false}
                        onClick={() => deleteNode()}
                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-transform hover:scale-110"
                        title="Delete Page"
                    >
                        <i className="pi pi-trash text-sm"></i>
                    </button>
                )}
            </div>
            
            <div 
                className="pdf-page-container bg-white shadow-lg border border-gray-300 relative overflow-hidden print:border-none print:shadow-none"
                style={{ 
                    height: 'var(--page-min-height, 297mm)', // Force exact height like Canva
                    maxHeight: 'var(--page-min-height, 297mm)',
                    padding: 'var(--page-padding, 20mm)', // default
                }}
            >
                <div 
                    className="absolute inset-0 pointer-events-none z-[1]" 
                    style={{
                        backgroundImage: 'var(--global-watermark, none)',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        opacity: 0.35,
                    }}
                />
                <NodeViewContent className="relative z-10 min-h-full outline-none" />
            </div>
        </NodeViewWrapper>
    );
};

export default PageNodeView;
