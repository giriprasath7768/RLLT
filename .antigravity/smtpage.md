In the digital menu item, create a sub-menu as the SMT page.And this should be similar like the SMT player dot JSX and only the different thing is the displaying the document content as per this architecture.Build an enterprise-grade Interactive Paginated HTML Document System that replaces traditional PDF viewing with a structured HTML-based document engine optimized for A4 virtual pages, advanced highlighting, and professional document interaction.

Core Requirements:

1. Document Architecture

* Use structured HTML rendering instead of native PDF rendering.
* Each document page must behave as a virtual A4 sheet.
* Support both portrait and landscape A4 layouts.
* Render documents using scalable DOM-based architecture.
* Avoid canvas-only rendering for text interaction.
* Support dynamic pagination and responsive scaling.

2. Virtual A4 Pagination System

* Create true A4 virtual pages using CSS-based pagination.
* Each page should visually resemble a real paper document.
* Support:

  * Page-by-page navigation
  * Smooth scrolling mode
  * Snap-to-page behavior
  * Optional book/flip mode
* Pages must maintain consistent layout during zooming and resizing.
* Prevent content overflow between pages.

3. Enterprise-Grade Highlighting Engine

* Implement DOM-based highlighting using Range API.
* Do NOT rely on native PDF text selection.
* Highlighting must:

  * Precisely detect text boundaries
  * Avoid selecting adjacent lines unintentionally
  * Ignore trailing whitespace issues
  * Support multi-line highlights
  * Support overlapping annotations
  * Maintain highlights during zoom and resize
* Store highlights structurally using IDs and metadata.

4. Annotation & Interaction Layer

* Add support for:

  * Text highlights
  * Comments
  * Sticky notes
  * Inline annotations
  * Selection tooltips
  * Hover interactions
* Annotation layer must remain synchronized with pagination.

5. Page Flip System

* Implement optional realistic page flip animations.
* Use optimized GPU-accelerated transitions.
* Support:

  * Mouse drag
  * Touch gestures
  * Keyboard navigation
  * Next/Previous page controls
* Page flipping must not affect highlighting accuracy.

6. Zoom & Navigation

* Add enterprise-level zoom controls:

  * Fit width
  * Fit page
  * Custom zoom %
  * Smooth zoom rendering
* Include:

  * Thumbnail navigation panel
  * Page index
  * Search navigation
  * Bookmark system

7. Performance Optimization

* Implement virtualized rendering for large documents.
* Use lazy loading for pages.
* Optimize DOM updates.
* Prevent re-rendering of unchanged pages.
* Ensure smooth interaction for 40+ page documents.

8. Export System

* Support exporting the HTML-rendered document back into:

  * High-quality PDF
  * Print-ready A4
* Use Puppeteer-based rendering for export quality.
* Preserve:

  * Layout
  * Pagination
  * Highlights
  * Annotations
  * Typography

9. Recommended Tech Stack
   Frontend:

* React
* Lexical or ProseMirror
* CSS Grid + CSS Paged Media

Interaction:

* DOM Range API
* Structured annotation engine

Rendering:

* HTML/CSS-based document layout
* Virtual A4 pages

Optional:

* react-pageflip for flip animations

PDF Export:

* Puppeteer

10. UX Requirements
    The experience must feel:

* Enterprise-grade
* Smooth and responsive
* Similar to Google Docs + Canva + modern document systems
* Professional for document review workflows
* Highly readable and visually clean

11. Important Constraints

* Do NOT use native PDF text selection as the primary interaction layer.
* Do NOT depend entirely on canvas-based rendering.
* Avoid html2canvas-based export workflows.
* Keep rendering, pagination, and interaction systems modular and decoupled.

Goal:
Create a highly interactive, scalable, annotation-friendly document experience that provides superior usability compared to traditional PDF viewers while maintaining accurate A4 print and export capabilities.
