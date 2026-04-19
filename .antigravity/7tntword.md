# Agent Specification: '7TNT Word' Advanced Document Editor

## 1. Objective
Develop a new top-level menu item, "7TNT Word." This module must provide a Microsoft Word-like text editing experience but with specialized toolsets for "App Creators" branding, global localization, and media conversion.

---

## 2. UI & Functional Requirements (The Interface)

### A. Custom Specialized Toolbar (Top Section)
Replace the standard Word ribbon with a custom toolbar featuring these specific controls:
* **Typography:**
    - **Fancy Font Selector:** A curated dropdown of high-end/craftsmanship fonts.
    - **Size Adjustment:** Precise font-size scaling controls.
    - **Color Adjustments:** Advanced palette for text, highlight, and background colors.
* **Document Assets:**
    - **Watermark Image:** Tool to upload and position a background watermark for branding.
    - **Descriptions:** A metadata panel to add SEO or context descriptions to the document.
    - **Adding Images:** Drag-and-drop or file-picker integration for inline images.
* **Advanced Actions:**
    - **Convert to PPT:** Export the current document structure as a PowerPoint file.
    - **Share & Print:** Integrated social/email sharing and native browser print triggers.
    - **Multi-language Options:** Toggle for real-time translation or multi-language character support.

### B. Global Context Bar (Below Toolbar)
A dedicated row situated between the toolbar and the editing area:
* **Country Flags:** A scrollable horizontal list of all national flags.
* **Country Map Viewer:** An interactive button or hover-state that launches a geographical map for the selected country.
* **Category Options:** A tagging system to categorize the document (e.g., Training, Legal, Marketing).

### C. Primary Editing Area
* **WYSIWYG Editor:** A full-page, white-space canvas that mimics a physical document page.

---

## 3. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Editor Architect** | Integrate a rich-text engine (e.g., `Quill.js` or `Slate.js`) and customize the toolbar to match the spec. |
| **Phase 2** | **Logic Agent** | Implement the "Convert to PPT" logic using a library like `PptxGenJS` and the flag/map API integration. |
| **Phase 3** | **UI/UX Agent** | Build the global context bar with SVG flags and a modal-based map viewer. |

---

## 4. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Real-time Persistence:** The document should auto-save to the database during editing.
* **Branding:** Ensure the "7TNT Word" UI follows the software entrepreneur aesthetic previously established for App Creators.

---

## 5. Definition of Done (DoD)
- [ ] "7TNT Word" appears in the main navigation.
- [ ] Users can edit text using fancy fonts, adjust colors, and upload watermarks.
- [ ] The Flag and Map components correctly display global data.
- [ ] The "Convert to PPT" and Print functions generate accurate files.
- [ ] Multiple languages are supported within the editor.