# TASK: Implement "Manage Student" CRUD with Activation Email Trigger

## Context
Referencing `@rules.md` and `@ARCHITECTURE.md`. We are building the administrative control panel for Students.
Language: **JavaScript (JSX)**. Framework: **PrimeReact DataTable**.

## 1. UI Requirements: PrimeReact DataTable
* **Pattern:** Follow the "Product CRUD" style at https://primereact.org/datatable/#dtproducts.
* **Columns:** Enrollment Number, Name, Email, Mobile, Registration Date, Status (Badge).
* **Features:** - **Search:** Global filter for Name, Email, and Enrollment ID.
    - **Export:** Buttons for CSV and PDF export (using PrimeReact built-in tools).
    - **Actions:** Edit (Dialog), Delete (ConfirmDialog).

## 2. The "Activation" Logic (CRITICAL)
* **Status Column:** Use a PrimeReact `InputSwitch` or `ToggleButton` for "Active/Inactive".
* **Trigger Requirement:** When the toggle is switched to **Active** for the first time:
    1. The system must update the `is_active` boolean in the PostgreSQL `users` table.
    2. **Email Dispatch:** Trigger a FastAPI background task to send an email via **AWS SES**.
    3. **Content:** The email must contain the student's **Enrollment Number** and their **Generated Password** (UTF-8/Portuguese support).
* **UX:** Show a `Toast` message: "Student activated and credentials sent to email."

## 3. Backend Integration (FastAPI + AWS SES)
* **Endpoint:** `PATCH /api/students/{id}/activate`.
* **Security:** Ensure only `super_admin` or `admin` roles can hit this endpoint.
* **Logic:** The password should only be sent upon the *initial* activation to prevent spamming the user if the toggle is flipped multiple times.

## 4. Implementation Details
* **File:** Create `src/pages/admin/ManageStudents.jsx`.
* **Responsiveness:** Ensure the table switches to the **Mobile Card View** on small screens.

## Instructions for Agent
- Use **Gemini 3 Pro** for the conditional email trigger logic in the backend.
- Use **Gemini 3 Flash** for the DataTable UI and Export functions.
- Strictly use `.jsx` and standard JavaScript.
- Maintain a **Pure White** background for the entire component.