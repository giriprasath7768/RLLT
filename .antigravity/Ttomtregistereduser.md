# Agent Specification: 'TTOM Registered Users' Management System

## 1. Objective
Develop a new top-level menu item, "TTOM Registered Users." This module must replicate the architecture of the "Manage Admin" page, providing a full CRUD suite for user registration and maintenance with a specific 4-digit password constraint.

---

## 2. UI & Functional Requirements (The Interface)

### A. Data Table Listing (Read)
Replicate the "Manage Admin" data table layout to display registered users:
* **Columns:** S.No, Name, Mobile Number, Address, Created Date, Status, and Activity (Edit/Delete).
* **Features:** Search bar, entries per page filter, and pagination.

### B. User Creation (Create)
Implement a "Register New User" modal or form containing the following fields:
1. **Name**: Text input.
2. **Address**: Textarea/Multi-line input.
3. **Mobile Number**: Numerical input.
4. **Password**: 4-digit numerical input.
5. **Confirm Password**: 4-digit numerical input.

### C. Password Logic & Validation
* **Constraint:** The password MUST be exactly a **four-digit number**.
* **Regex/Validation:** `^[0-9]{4}$`.
* **Matching:** "Confirm Password" must match "Password" before the Save button becomes active.
* **Error Handling:** Display a validation message if the input is not exactly 4 digits or contains non-numeric characters.

---

## 3. CRUD Operations

| Operation | Requirement |
| :--- | :--- |
| **Create** | Save Name, Address, Mobile, and the 4-digit Password to the `TTOM_Users` table upon clicking 'Save'. |
| **Read** | Fetch and display all registered users in the data table. |
| **Update** | Allow the Super Admin to edit Name, Address, or Mobile Number and reset the 4-digit password. |
| **Delete** | Permanently remove the user record from the system. |

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Database Agent** | Create the `TTOM_Users` table with a fixed-length string/integer column for the 4-digit password. |
| **Phase 2** | **Logic Agent** | Implement the 4-digit validation logic and password match check in JSX. |
| **Phase 3** | **UI/UX Agent** | Replicate the `ManageAdmin.jsx` styling and table structure for the new `TTOMRegisteredUsers.jsx` view. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Security:** Ensure passwords are encrypted before storage, even if they are only 4 digits.
* **Architecture:** Maintain consistency with the "App Creators" design system.

---

## 6. Definition of Done (DoD)
- [ ] "TTOM Registered Users" menu item is visible and functional.
- [ ] The registration form enforces the 4-digit numerical password rule.
- [ ] Users can be successfully created, edited, and deleted from the data table.
- [ ] The layout is visually identical to the "Manage Admin" module.