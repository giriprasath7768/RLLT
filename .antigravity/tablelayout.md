# Agent Specification: High-Fidelity Table Replication (Revised with Source Columns)

## 1. Objective
Replicate the exact visual and structural layout of the `Mainchart-30days.pdf` into `MainChart.jsx` and `MainChartView.jsx`. This revision explicitly includes the three "Source/Book" columns previously identified as blank spaces.

---

## 2. Table Architecture & Column Mapping

### A. Column Definitions (Left to Right)
[cite_start]The table must contain the following 11 columns to accommodate all data points found in the PDF[cite: 23, 26, 28]:
1.  [cite_start]**DAY**: 3% (Numeric identifier)[cite: 23, 28].
2.  [cite_start]**S1 (Book/Source 1)**: 12% (e.g., "PRO 26", "PRO 1")[cite: 23, 28].
3.  [cite_start]**TIME (M1)**: 8% (Reading time for S1)[cite: 23, 28].
4.  [cite_start]**S2 (Book/Source 2)**: 12% (e.g., "PSA 131-135", "PSA 1-9")[cite: 23, 28].
5.  [cite_start]**TIME (M2)**: 8% (Reading time for S2)[cite: 23, 28].
6.  [cite_start]**S3 (Book/Source 3)**: 25% (Wide column for ranges: e.g., "JHN 8-21, ACT 1-13")[cite: 23, 28].
7.  [cite_start]**TIME (M3)**: 8% (Reading time for S3)[cite: 23, 28].
8.  [cite_start]**CHAP**: 6% (Total chapters for the day)[cite: 23, 28].
9.  [cite_start]**VERSE**: 8% (Total verses for the day)[cite: 23, 28].
10. [cite_start]**ART**: 7% (Average Reading Time)[cite: 23, 28].
11. [cite_start]**YES**: 3% (Checkmark/Completion status)[cite: 23, 28].

### B. Structural Merges & Layout
* [cite_start]**Vertical Labels (PHASE/TEAM)**: Implement vertical text containers on the far left or right of the table that span exactly 5 rows (one "TEAM" block)[cite: 24, 25, 27].
* [cite_start]**Horizontal Footer**: The "TOTAL AVERAGE READING TIME" row must span columns 1 through 7[cite: 23].

---

## 3. Visual & Typographic Standards

### A. Font Analysis
* [cite_start]**Font Family**: Condensed Sans-Serif (Standard: 'Roboto Condensed')[cite: 30, 43].
* **Font Size**: 
    * [cite_start]Primary Data: 10px[cite: 23, 28].
    * [cite_start]Footer Totals: 11px Bold[cite: 23].
* [cite_start]**Style**: All uppercase for headers and Book abbreviations (e.g., "PRO", "PSA", "JHN")[cite: 23, 26].

### B. Cell Presentation
* [cite_start]**Alignment**: Center-align all columns EXCEPT **S3 (Book/Source 3)**, which must be left-aligned to accommodate long strings of text[cite: 23].
* [cite_start]**Borders**: 1px solid black grid lines[cite: 23, 25].
* [cite_start]**Vertical Text**: Use `writing-mode: vertical-rl` for the "TEAM" and "MODULE" side-labels[cite: 30, 43].

---

## 4. Technical Implementation Logic (JSX)

| Phase | Agent Assignment | Task |
| :--- | :--- | :--- |
| **Phase 1** | **CSS Specialist** | Set up the 11-column grid system with fixed widths and vertical text utility classes. |
| **Phase 2** | **JSX Architect** | Map the `S1`, `S2`, and `S3` props into the table. Ensure `S3` handles text-wrapping for multiple book references. |
| **Phase 3** | **Data Specialist** | [cite_start]Seed the table with specific PDF data: "31102" (Verse Total) and "70 Hr 11 Mins" (Time Total)[cite: 23]. |

---

## 5. Definition of Done (DoD)
- [ ] The table layout includes 11 distinct columns as specified.
- [ ] No "blank spaces" exist where Book/Chapter data (S1, S2, S3) should be.
- [ ] [cite_start]The vertical "TEAM" labels span 5 rows perfectly[cite: 25, 27, 28].
- [ ] [cite_start]The "TOTAL AVERAGE READING TIME" footer correctly sums and displays the final row[cite: 23].