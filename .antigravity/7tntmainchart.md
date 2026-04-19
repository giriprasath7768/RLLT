# Agent Specification: '7TNT Main Chart' Development

## 1. Objective
Create a new sub-menu item, "7TNT Main Chart," located under the "Chart Creation" parent menu. This module must replicate the professional header of the Main Chart while implementing a unique 11-column table layout based on the provided screenshot.

---

## 2. UI & Functional Requirements

### A. Navigation & Placement
* **Menu Hierarchy:** Chart Creation > 7TNT Main Chart.
* **Header Architecture:** Replicate the exact font, sizing, and metadata layout (e.g., God's Promises, Title, Breadcrumbs) from the **Main Chart** header.

### B. Table Structure (11-Column Grid)
Following the structural patterns identified in the project's chart ecosystem:
1.Vertical Group 1 (Left Sidebar): "TEAM-1" label using writing-mode: vertical-rl and rowspan={5}.

2.DAY: (5%) Numeric day identifier (1-5 shown).

3.BOOK/CONTENT (Center): (60%) Wide, blank editable area for book or content titles.

4.PAGES: (10%) Range input (e.g., "1-10", "11-17").

5.CHAP: (8%) Chapter count (e.g., "1").

6.ART: (12%) Average Reading Time or Duration (e.g., "22", "17").

7.YES: (5%) Completion status checkbox column.

8.Vertical Group 2 (Right Sidebar): "WEEK 1" label using writing-mode: vertical-rl and rowspan={5}.

---

## 3. Visual Styling & Interaction

### A. Sidebar Labels (Vertical Text)
* **Design Pattern:** Implement vertical sidebars for "TEAM" and "MODULE/FACET" categories.
* **Logic:** Use `rowspan` to span these labels across 5-day or 10-day blocks as seen in the PDF references.

### B. Editability
* **Smart Cells:** Every cell in the S1, S2, and S3 columns must open a selection modal (or "Smart-Cell Grid") to allow the user to select books and chapter ranges.
* **Calculation:** The "VERSE" and "ART" columns must auto-calculate based on the selected book/chapter data.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **UI/UX Agent** | Copy the `MainChartHeader.jsx` component and build the 11-column CSS Grid layout for the 7TNT table. |
| **Phase 2** | **Logic Agent** | Implement the data-binding between the table cells and the `BookMaster` database for real-time calculations. |
| **Phase 3** | **Integration Agent** | Register the route `/chart-creation/7tnt-main-chart` and add the link to the sidebar menu. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Persistence:** All data entered in the 7TNT Main Chart must be saved to a dedicated `SevenTNT_Charts` table.
* **Typography:** Use **Roboto Condensed** (10px) for table body content to maintain high data density.

---

## 6. Definition of Done (DoD)
- [ ] 7TNT Main Chart is accessible via the "Chart Creation" menu.
- [ ] The header perfectly matches the original Main Chart aesthetic.
- [ ] The table layout accurately represents all 11 columns with correct widths and styles.
- [ ] Vertical "TEAM" labels and footer totals are correctly implemented.