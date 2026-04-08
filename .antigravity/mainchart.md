# Agent Specification: Dynamic Interactive Data Table

## 1. Objective
Recreate the "66 Books 30 Days Main Chart" from the provided PDF as an interactive React (JSX) dashboard. The table must support dynamic "Content Injection" where static data can be replaced by interactive UI components.

---

## 2. Table Architecture & Layout
The table should follow the structure found in the PDF (Sources 1-6):
* **Primary Columns:** DAY, TIME (Module 1), TIME (Module 2), TIME (Module 3), CHAP (Chapter Count), VERSE (Verse Count), and ART (Average Reading Time).
* **Metadata Headers:** Support for "GOD'S PROMISES" text areas at the top of specific sections.
* **Footer Row:** Must calculate and display "TOTAL AVERAGE READING TIME" (e.g., 70 Hr 11 Mins).

---

## 3. Dynamic UI Requirements (Interactive Elements)
The agent must implement a "Component Placeholder" system. Based on instructions, replace cell data with:
1. **Text Boxes:** For manual entry of "TIME" or "VERSE" counts.
2. **Drop-downs:** For selecting "Book Names" or "Phases" (e.g., Phase-1/1).
3. **Status Toggles:** For the "YES" (Completion) column.
4. **Read-Only Labels:** For auto-calculated fields like total "VERSE" and "CHAP" per day.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **UI/UX Builder** | Construct the responsive table grid using CSS Grid/Flexbox to match the PDF layout precisely. |
| **Phase 2** | **Logic Architect** | Create a `renderCell` function that determines if a cell should display a `<Text>`, `<Input>`, or `<Select>` based on a configuration object. |
| **Phase 3** | **Data Specialist** | Map the provided PDF raw data (Sources 1-6) into a JSON state to pre-populate the table. |

---

## 5. Specific Logic to Implement
* **Search Integration:** Ensure the "TEAM" and "DAY" rows stay aligned during filtering.
* [cite_start]**Time Calculation:** Implement a utility to sum strings formatted as `2h.11m` into the `TOTAL AVERAGE READING TIME` footer[cite: 1, 2].
* [cite_start]**Conditional Styling:** Highlight rows that contain specific Phase/Facet markers (e.g., "MODULE 2:FACET1:PHASE-1/1")[cite: 8].

---

## 6. Definition of Done (DoD)
- [ ] Table layout matches the PDF grid structure.
- [ ] Interactive components (Inputs/Drop-downs) are functional within the cells.
- [ ] [cite_start]The table is populated with the initial data from the PDF (e.g., Genesis 1-32, PSA 1-9)[cite: 6].
- [ ] [cite_start]Totaling logic correctly sums the "VERSE" (31102) and "TIME" (70H 11m) columns[cite: 1].