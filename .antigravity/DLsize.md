# Agent Specification: DLL Size Chart Development

## 1. Objective
Create a new view component, `DLSizeChart.jsx`, and integrate it into the "Chart Listing" menu. This chart serves as a compact, high-density visualization of the daily reading goals derived from the Morning and Evening datasets.

---

## 2. Data Integration & Source
* **Data Dependency:** The `DLSizeChart` must not pull data directly from the Main Chart. Instead, it must fetch its data from the `MorningChart` and `EveningChart` datasets.
* **Synchronization:** Ensure that any updates made to the Morning/Evening split (e.g., a change in chapter range) are reflected in the DLL Size Chart in real-time.

---

## 3. Visual Design & Layout (Ref: Screenshot Analysis)

### A. High-Density Grid Structure
Following the provided design patterns for "DL Logs":
* **Compact Cells:** Reduce the row height and column padding compared to the Main Chart to allow for a "Size-Optimized" view.
* **Header Alignment:** Replicate the 11-column structure but focus on a "Miniaturized" aesthetic.

### B. Segmented Row Logic
* **Morning/Evening Grouping:** Each "DAY" row must be visually subdivided or color-coded to show the Morning segment (Blue) and the Evening segment (Orange) within the same row.
* **S3 Column Detail:** The S3 column in this chart should specifically list both the Morning split and Evening split clearly, maintaining the color distinction (#1A73E8 for Morning, #E67E22 for Evening).

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Integration Agent** | Register the `DLSizeChart` route and add a navigation link in the "Chart Listing" sidebar. |
| **Phase 2** | **Data Pipeline Agent** | Create a hook `useDLData()` that aggregates the morning and evening JSON objects into a single "Daily Life Log" format. |
| **Phase 3** | **UI/UX Specialist** | Implement the compact CSS grid and apply the specific color-coded text for the split chapter ranges. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Date Consistency:** The dates and Day IDs must perfectly align with those in the Morning and Evening charts.
* **Layout:** Do not include any top-level headers (GOD'S PROMISES); maintain the focus strictly on the data table grid.

---

## 6. Definition of Done (DoD)
- [ ] The DLL Size Chart is successfully linked in the Chart Listing.
- [ ] Data is correctly populated using the Morning and Evening split logic.
- [ ] The visual design matches the compact, "Size Chart" aesthetic of the provided screenshot.
- [ ] Text colors (Blue/Orange) correctly identify the session segments within the table.