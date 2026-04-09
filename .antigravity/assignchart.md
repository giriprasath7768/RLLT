# Agent Specification Addendum: Automated Training Schedule Logic

## 1. Objective
Develop a new module, `AssignChart.jsx`, that allows the Super Admin to assign existing charts to specific user groups filtered by location. This module must include a dynamic selection workflow and a management table for tracking assignments. include an automated "Training Period" calculation. The system must dynamically determine the **End Date** based on a user-selected **Start Date** and the intrinsic duration of the chosen chart (30 vs. 40 days).

---

## 2. Functional Requirements (JSX Logic)

### A. Date Input & Selection
* **Training Start Date:** Add a standard date picker component to the assignment form.
* **Selection Trigger:** Whenever the **Start Date** is changed OR a **Chart Type** is selected/swapped, the system must trigger the `calculateEndDate()` function.

### B. Calculation Logic (The Date Math)
The agent must implement the following conditional logic:
* **If 30-Day Chart is selected:**
    * `End Date = Start Date + 29 Days`.
* **If 40-Day Chart is selected:**
    * `End Date = Start Date + 39 Days`.
* **Display:** The calculated End Date should be displayed in a read-only field or as a text label to inform the Super Admin before they click "Assign".

---

## 3. Data Integration & Persistence
* **Storage:** Both the `start_date` and the `calculated_end_date` must be saved in the `Assignments` table.
* **Table View:** Update the "Assigned Charts" data table to include two new columns: **Start Date** and **End Date** for easy reference.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Logic Agent** | Implement the `calculateEndDate` utility using a library like `date-fns` or native JavaScript `Date` objects. |
| **Phase 2** | **UI/UX Agent** | Add the Date Picker and the read-only End Date display to the `AssignChart` form. |
| **Phase 3** | **Database Agent** | Update the `Assignments` schema to include `start_date` and `end_date` fields. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Validation:** Prevent the Super Admin from selecting a Start Date in the past (optional, but recommended for UX).
* **Format:** Use a consistent date format (e.g., DD/MM/YYYY) across the entire application to match existing charts.

---

## 6. Definition of Done (DoD)
- [ ] Selecting a Start Date automatically populates the End Date field.
- [ ] The calculation correctly identifies the difference between 30-day and 40-day chart durations.
- [ ] The Start and End dates are visible in the assignment list table below the form.
- [ ] Both dates are successfully persisted in the database upon assignment.