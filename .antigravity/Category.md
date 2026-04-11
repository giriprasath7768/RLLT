# Agent Specification: Automated Student Age-Classification System

## 1. Objective
Modify the "Manage Student" module to automatically categorize students into Categories (A, B, C) and Stages (1-5) based on their age, calculated from their Date of Birth (DOB).

---

## 2. Age Calculation & Segregation Logic

### A. Core Calculation
* **Trigger:** Upon student creation or DOB update.
* **Logic:** Calculate `Current Age = Current Date - Date of Birth`.

### B. Classification Matrix
The system must assign the **Category** and **Stage** based on the following age brackets:

| Category | Stage 1 | Stage 2 | Stage 3 | Stage 4 | Stage 5 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Category A** | 13 - 17 | 18 - 22 | 23 - 27 | 28 - 32 | 33 - 37 |
| **Category B** | 38 - 42 | 43 - 47 | 48 - 52 | 53 - 57 | 58 - 62 |
| **Category C** | 63 - 67 | 68 - 72 | 73 - 77 | 78 - 82 | 83 - 87 |

---

## 3. Data Table Requirements (Manage Student View)

The "Manage Student" data table must be updated to display the following columns in order:
1.  **Serial Number** (S.No)
2.  **Category** (A, B, or C)
3.  **Stage** (1, 2, 3, 4, or 5)
4.  **Name**
5.  **Email ID**
6.  **Mobile Number**
7.  **Status** (e.g., Active/Inactive)
8.  **Activity** (Actions: Edit/Delete/View)

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Logic Agent** | Create a utility function `calculateStudentLevel(dob)` that returns the Category and Stage string based on the Matrix. |
| **Phase 2** | **Database Agent** | Ensure the `Students` table has persisted fields for `Category` and `Stage` so they are searchable/filterable. |
| **Phase 3** | **UI/UX Agent** | Update the `StudentTable.jsx` to include the new columns and ensure the DOB input field triggers the calculation immediately. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Validation:** If a student's age falls outside the defined brackets (e.g., under 13 or over 87), flag them as "Uncategorized" or "Out of Range."
* **Real-time Update:** If an admin edits a student's DOB, the Category and Stage columns in the table must update instantly.

---

## 6. Definition of Done (DoD)
- [ ] New students are automatically assigned a Category and Stage upon registration.
- [ ] The Manage Student table correctly displays all 8 requested columns.
- [ ] The age-bracketing logic perfectly matches the provided specifications.
- [ ] Admins can sort or filter the table by Category or Stage.