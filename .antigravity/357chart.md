# Agent Specification: '3-5-7' Dynamic Cycle Chart

## 1. Objective
Develop a new submenu item under "Chart Creations" labeled **3-5-7 Chart**. This module allows users to generate a customized reading schedule based on specific day-cycles (3, 5, or 7 days) and a variable number of book tracks.

---

## 2. Functional Requirements (The Generator)

### A. Cycle & Duration Logic
* **Cycle Selection:** The user must choose between a **3-day**, **5-day**, or **7-day** cycle.
* **Day Listing (The 365 Rule):** * The chart must calculate how many full cycles fit into 365 days.
    * The "Day" column should display the end-of-cycle markers. 
    * *Example (7-day cycle):* The table rows will list days 7, 14, 21, 28... up to the nearest divisible of 7 before 365.
    * *Example (3-day cycle):* The rows will list days 3, 6, 9... up to 363.

### B. Dynamic Column Scaling (The Book Track)
Unlike the fixed 11-column Main Chart, this chart expands based on the number of books selected:
* **Book Track Component:** For each book added by the user, the agent must generate a "Track Group" consisting of:
    1. **Book Name** (Dropdown/Select).
    2. **Time** (Minutes input).
    3. **Chapter Range** (e.g., 1-5).
* **Summary Columns:** Every row must conclude with the standard calculated fields:
    * **Total Chapters**.
    * **Total Verses**.
    * **Total ART (Average Reading Time)**.

---

## 3. UI & Visual Layout

### A. Configuration Header
Before the table is generated, provide a configuration panel:
1. **Dropdown:** Select Cycle (3, 5, 7).
2. **Numeric Input:** Number of Books (determines how many "Track Groups" appear in the table).
3. **Button:** "Generate 3-5-7 Chart."

### B. Table Styling
* **Header:** Replicate the branding and styling of the **Main Chart Header**.
* **Sticky Headers:** Ensure the Book Names stay visible at the top while scrolling through the 365-day rows.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Logic Agent** | Create the array-generation utility that calculates the divisible days of 365 based on the user's cycle choice. |
| **Phase 2** | **UI/UX Agent** | Build the dynamic grid system that adds/removes Book Track columns using React state mapping. |
| **Phase 3** | **Data Agent** | Map the `BookMaster` verse counts to the dynamic columns to ensure the "Total Verses" and "ART" update in real-time. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Math Accuracy:** Ensure the final row handles the remainder of the 365 days if the cycle is not perfectly divisible.
* **Performance:** Use virtualization (like `react-window`) if the 365-day row count causes lag in the editor.

---

## 6. Definition of Done (DoD)
- [ ] Submenu "3-5-7 Chart" is functional under "Chart Creations".
- [ ] Selecting a cycle (e.g., 7) correctly lists all divisible days up to 365.
- [ ] Columns dynamically expand or contract based on the number of books requested.
- [ ] Total Verses and ART are accurately calculated for each row.