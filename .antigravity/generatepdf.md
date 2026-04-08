# Agent Specification: Dynamic PDF Export & Filtering System

## 1. Objective
Implement a "Export to PDF" workflow that allows users to filter data via a search bar, select specific columns from the table, and generate a downloadable PDF containing only the filtered results and chosen fields.

---

## 2. Core Logic Requirements (JSX)

### A. Data Filtering Logic
* **State Sensitivity:** * If the `Search Bar` is empty, the PDF must include the entire dataset.
    * If a search term is present, the PDF must dynamically filter to include *only* the matching rows.
* **Data Mapping:** The export function must map through the filtered array to extract the values for the PDF table.

### B. Column Selection UI
* **Trigger:** Clicking the "Export PDF" button must open a selection interface (Modal/Dropdown).
* **Dynamic Checkboxes:** Display a list of all table headers. Users toggle checkboxes to include/exclude specific columns from the final PDF.
* **Validation:** Prevent export if zero columns are selected.

### C. PDF Generation Engine
* **Library Integration:** Use a standard JS library (e.g., `jsPDF` with `jspdf-autotable`) to construct the document.
* **Layout Construction:** * **Header:** Include the project/company name and export date.
    * **Body:** A structured table containing only the `selectedColumns`.
    * **Footer:** Page numbering (e.g., "Page 1 of 5").

---

## 3. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Description |
| :--- | :--- | :--- |
| **Phase 1** | **Logic Architect** | Develop the `generatePdfData()` function to filter the JSON data based on the current search state and column selection. |
| **Phase 2** | **UI/UX Builder** | Build the `ExportOptionsModal.jsx` component to handle column toggles and the "Download" trigger. |
| **Phase 3** | **PDF Specialist** | Configure the PDF styling (font sizes, cell padding, and landscape/portrait orientation) to ensure professional output. |

---

## 4. Constraints & Standards
* **Language:** **JavaScript (JSX)** only. Ensure no TypeScript syntax is used.
* **Performance:** For large datasets, ensure the filtering logic doesn't freeze the UI thread before the download starts.
* **File Naming:** The exported file should follow the format: `Report_[Date]_[SearchTerm].pdf`.

---

## 5. Definition of Done (DoD)
- [ ] Search filtering correctly limits the rows exported to the PDF.
- [ ] Column selection correctly limits the width/fields of the PDF table.
- [ ] PDF renders with a clean, professional table layout.
- [ ] Clicking "Export" triggers an immediate file download in the browser.