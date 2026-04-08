# Agent Specification: Morning & Evening Derivative Charts

## 1. Objective
Create two new view components, `MorningChart.jsx` and `EveningChart.jsx`, which dynamically derive their data from the `MainChart` dataset found in `Mainchart-30days.pdf`.

---

## 2. Data Derivation Logic (The Split)

### A. Segment S3 Processing
[cite_start]The agents must target the **S3 (Book/Source 3)** column (the wide column containing long ranges, e.g., "JHN 8-21" [cite: 23, 26]).
* **Calculation:** Identify the total number of chapters in the S3 segment for each day.
* **Morning Assignment (Part 1):** Assign the first 50% of the S3 chapters to the **Morning Chart**.
* **Evening Assignment (Part 2):** Assign the remaining 50% of the S3 chapters to the **Evening Chart**.

### B. Example Implementation
If S3 for Day 1 contains "JHN 8-21" (14 chapters):
* [cite_start]**Morning Chart:** "JHN 8-14"[cite: 23].
* [cite_start]**Evening Chart:** "JHN 15-21"[cite: 23].

---

## 3. Visual & Color Specifications

### A. Text Color Coding
To distinguish between the two sessions, the agents must apply specific text colors to the S3 data:
* **Morning Text:** Use **Deep Blue** (#1A73E8) for all chapter references in the Morning Chart.
* **Evening Text:** Use **Deep Orange/Sunset** (#E67E22) for all chapter references in the Evening Chart.

### B. Consistency with Main Chart
* [cite_start]**Layout:** Retain the exact column widths, heights, and font styles (Roboto Condensed, 10px) specified for the Main Chart[cite: 23, 30].
* [cite_start]**Excluded Elements:** Do not include the "GOD'S PROMISES" header or any metadata headers from the PDF[cite: 26, 33]. Focus exclusively on the table grid.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Data Logic Agent** | Create a utility function `splitS3Data(data)` that takes the Main Chart JSON and returns two objects: `morningData` and `eveningData`. |
| **Phase 2** | **UI/UX Agent** | Implement the `MorningChart.jsx` and `EveningChart.jsx` views, applying the blue and orange color themes respectively. |
| **Phase 3** | **Integration Agent** | Ensure both charts are linked in the "Chart Listing" menu for easy user navigation. |

---

## 5. Definition of Done (DoD)
- [ ] Morning and Evening charts are accessible from the main listing.
- [ ] S3 data is accurately divided by 50% across the two charts.
- [ ] Text colors (Blue for Morning, Orange for Evening) are correctly applied to the S3 column.
- [ ] [cite_start]Table dimensions and font sizes perfectly match the Main Chart layout[cite: 23].