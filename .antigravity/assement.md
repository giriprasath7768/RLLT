# Agent Specification: Advanced Assessment Management System


## Context
Referencing the rules in `@rules.md` and the architecture in `@ARCHITECTURE.md`. 
We are strictly using **JavaScript (.js)** and **React JSX (.jsx)**. No TypeScript.

## 1. Objective
Build a comprehensive Assessment Management module that supports Excel uploads, CRUD operations (Create, Read, Update, Delete), and a specialized "Test Mode" preview for quality assurance.

---

## 2. Data Schema & Import Logic

### A. Excel Column Mapping
The agent must parse an uploaded `.xlsx` or `.csv` file with the following mandatory columns:
1. **Question Number**
2. **Question** (String)
3. **7TNT** (Specific Identifier)
4. **Category** & **Stage**
5. **Choice 1** + **Grade 1**
6. **Choice 2** + **Grade 2**
7. **Choice 3** + **Grade 3**

### B. Database Storage
* **Auto-ID:** Generate a unique UUID for every imported question.
* **Metadata:** Every batch must be saved with a user-defined **Name** and **Location** (Module/Category).
* **Persistence:** Ensure all grades and choices are linked correctly to the parent question ID.

---

## 3. Core Functional Requirements (JSX)

### A. Management Interface (CRUD)
* **View/Edit:** Create a table view filtered by **Name** and **Location**. Allow inline editing of any question or choice.
* **Add:** A "Manual Add" button to append a single question to an existing set.
* **Delete Options:**
    * **Single Delete:** Remove one specific row.
    * **Bulk Delete:** Select multiple rows to remove.
    * **Purge All:** A "Delete Entire Set" option for the specified Name/Location.

### B. "Test Format" View (The Student Preview)
* **Logic:** Render a specialized view that strips away the **Grade** and **ID** columns.
* **Layout:** Display the **Question** followed by **Choice 1, 2, and 3** as radio buttons or a list.
* **Purpose:** This mode is for the Admin to see exactly what the student will see during an active training session.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Data Agent** | Implement `ExcelJS` or `SheetJS` logic to parse the file and map it to the database schema. |
| **Phase 2** | **Logic Agent** | Build the filtering logic (Search by Name/Location) and the Delete/Update API calls. |
| **Phase 3** | **UI Agent** | Create the `AssessmentTable.jsx` for management and the `TestPreview.jsx` for the "Grade-free" view. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Validation:** Flag any rows in the Excel sheet that are missing a Question or have mismatched Grades/Choices.
* **UI Style:** Use the "App Creators" design system for consistent buttons and modals.

---

## 6. Definition of Done (DoD)
- [ ] Excel sheet successfully populates the database with Auto-IDs.
- [ ] Users can filter questions by Name/Location.
- [ ] Edit/Add/Delete (Single & Bulk) functions are fully operational.
- [ ] "Test Format" view correctly hides grades and displays a clean quiz layout.