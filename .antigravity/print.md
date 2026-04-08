# Agent Specification: Dynamic Print Selection & Filtering System

## 1. Objective
Implement a robust "Print" workflow that allows users to filter data via a search bar, select specific columns from the table, and generate a print-ready view of the selected results.

---

## 2. Core Logic Requirements (JSX)

### A. Data Filtering Logic
* **Conditional Source:** * If the `search` input is empty, the data source must be the full dataset.
    * If a search term exists, the data source must be a filtered subset based on that term.
* **Refining for Print:** The "Print Preview" must only include rows that match the current filtered state of the UI.

### B. Column Selection UI
* **Trigger:** When the "Print" option is clicked, an interface (Modal or Overlay) must appear.
* **Selection:** List all available table columns with checkboxes.
* **State Management:** Use a React state (e.g., `selectedColumns`) to track which keys in the data objects should be rendered.

### C. Dynamic Table Population
* **Render Logic:** Generate a temporary or hidden data table.
* **Mapping:** Iterate through the filtered data, but only render `<td>` elements for the keys present in the `selectedColumns` state.

---

## 3. Technical Execution Steps

| Phase | Agent Task | Description |
| :--- | :--- | :--- |
| **Phase 1** | **Logic Architect** | Create the `getFilteredData()` function and handle the print-trigger logic in the main `.jsx` file. |
| **Phase 2** | **UI/UX Builder** | Develop the `PrintSelectionModal.jsx` component and manage the checkbox toggle states. |
| **Phase 3** | **Styles Specialist** | Implement `@media print` CSS rules to hide headers, footers, and sidebars, leaving only the populated table visible. |

---

## 4. Constraints & Standards
* **Language:** Use **JavaScript (JSX)** only. No TypeScript.
* **Styling:** Ensure the print table has a clean, professional border and readable typography.
* **Optimization:** Use `.map()` to generate both the checkbox list and the table headers to ensure the system is scalable if new columns are added to the schema.

---

## 5. Definition of Done (DoD)
- [ ] User can type "Search Term" and see filtered results.
- [ ] Clicking "Print" opens a column selector.
- [ ] Selecting specific columns (e.g., "ID" and "Status") only populates those columns in the print preview.
- [ ] Browser `window.print()` triggers a clean document containing only the filtered, selected data.