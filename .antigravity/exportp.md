PROJECT: Fix Tiptap PDF Export Image Rendering Issue

TECH STACK:

* React.js
* Tiptap Editor
* jsPDF
* html2canvas/html2pdf
* Custom Online Word Editor

CURRENT ISSUE:
When exporting the online Word editor content into PDF, text content is exporting correctly, but inserted images are either:

* missing,
* faded,
* partially rendered,
* or not appearing in the generated PDF.

REFERENCE:
The attached sample PDF shows the issue where the editor layout appears, but embedded images are not properly exported.

ROOT CAUSE ANALYSIS:
The current PDF generation flow likely uses:

* html2canvas,
* html2pdf.js,
* or jsPDF directly.

These libraries fail when:

* images are loaded asynchronously,
* image URLs are blob/object URLs,
* images are cross-origin,
* images use lazy loading,
* CSS background images are used,
* or Tiptap renders images dynamically.

IMPLEMENTATION REQUIREMENTS:

1. Replace Existing HTML Capture Logic
   Current html2canvas/html2pdf implementation must be replaced or enhanced using:

* html-to-image
  OR
* dom-to-image-more

2. Add Proper Image Loading Handling
   Before generating the PDF:

* wait for all images to finish loading,
* wait for document fonts to load,
* prevent export until all assets are ready.

Implementation Requirements:

* use Promise.all() for all image load events,
* use:
  await document.fonts.ready

3. Convert All Images to Base64 Before Export
   All <img> tags inside the editor must be converted into base64 format before PDF rendering.

Reason:

* blob URLs fail during rendering,
* cross-origin images fail in canvas rendering,
* base64 ensures embedding consistency.

Implementation Details:

* fetch image source,
* convert to blob,
* convert blob to base64 using FileReader,
* replace image src dynamically before export.

4. Enable Cross-Origin Rendering
   All image rendering must support:

* useCORS: true
* cacheBust: true

All external image tags must include:
crossorigin="anonymous"

5. Avoid CSS Background Images
   Replace any:
   background-image: url(...)

with: <img src="..." />

Reason:
canvas-based PDF rendering skips many CSS background images.

6. Disable Lazy Loading During Export
   Ensure:
   loading="eager"

instead of:
loading="lazy"

7. High-Resolution PDF Rendering
   PDF export must support:

* pixelRatio: 2 or higher
* high-quality image rendering
* A4 page size
* proper scaling

8. Multi-Page Support
   The export logic must:

* automatically paginate large editor content,
* prevent image clipping,
* preserve layout structure.

9. Future Enterprise Upgrade (Important)
   Prepare architecture for future migration to:

* Node.js + Puppeteer PDF rendering.

Reason:
Puppeteer provides:

* Chrome-level rendering,
* exact Tiptap rendering,
* accurate image rendering,
* professional print output,
* Google Docs/Notion-style export quality.

EXPECTED FINAL BEHAVIOR:

* all inserted images must appear in exported PDF,
* image quality must remain high,
* editor layout must match screen rendering,
* PDF must support multi-page documents,
* no faded or missing image blocks,
* export must work for:

  * uploaded images,
  * pasted images,
  * CDN images,
  * base64 images.

DELIVERABLES REQUIRED:

1. Updated React export component
2. Updated PDF export utility
3. Image base64 conversion utility
4. Multi-page PDF support
5. Proper async image loading handling
6. Production-ready export architecture
7. Clean reusable implementation
