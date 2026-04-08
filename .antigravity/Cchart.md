# Agent Specification: C-Chart (Full Chapter Index) Development

## 1. Objective
Create a new view component, `CChart.jsx`, and integrate it into the "Chart Listing" menu. This chart must provide a comprehensive list of all assigned readings, using full book names instead of abbreviations, synchronized across both 30-day and 40-day cycles.

---

## 2. Data Mapping & Integration
* **Data Source:** Pull all data directly from the `MainChart` dataset.
* **Conversion Logic:** * Replace all short-form abbreviations (e.g., "GEN", "PRO") with their **Full Names** (e.g., "Genesis", "Proverbs") using the master book database.
    * Identify the **Day Number** and the specific **Chapter/Range** assigned for that day in the main chart.
* **Scope:** Generate entries for the entire **30-day** and **40-day** reading periods.

---

## 3. Visual Design & Layout (Ref: Screenshot Analysis)

### A. Table Structure
Following the provided design patterns in the screenshot:
* **Day Column:** Clearly labeled "Day 1", "Day 2", etc.
* **Full Book Name Column:** Displays the complete title of the book.
* **Chapter/Range Column:** Displays the assigned chapters (e.g., "Chapters 1 - 32").
* **Cycle Toggle:** Include a switch or tab system to toggle between the **30-Day View** and the **40-Day View**.

### B. Typography & Aesthetics
* **Font:** Maintain the "App Creators" design standard (Roboto or similar Sans-Serif).
* **Clarity:** Ensure high contrast and sufficient padding so the full book names are easily readable.
* **Header:** Title the page "C-CHART: FULL CHAPTER INDEX".

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Data Architect** | Create a mapping utility `getFullBookName(shortForm)` to translate abbreviations for the UI. |
| **Phase 2** | **Logic Agent** | Implement the filter to toggle between 30-day and 40-day datasets while maintaining correct Day/Chapter alignment. |
| **Phase 3** | **UI/UX Specialist** | Build the `CChart.jsx` table layout based on the attached screenshot's column widths and styling. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Accuracy:** The chapters listed must exactly match the selections made in the Main Chart.
* **Performance:** Ensure the list scrolls smoothly, especially when viewing the full 40-day dataset.

---

## 6. Definition of Done (DoD)
- [ ] The C-Chart is successfully linked in the Chart Listing.
- [ ] All book names appear in their full, non-abbreviated format.
- [ ] The data correctly reflects the Day and Chapters assigned in the Main Chart.
- [ ] Both 30-day and 40-day cycles are fully populated and selectable.