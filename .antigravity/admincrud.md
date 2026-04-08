# TASK: Implement Admin Management CRUD with Auto-Population (JS/JSX)

## Context
Referencing `@rules.md` and `@ARCHITECTURE.md`. We are building the "Create Admin" module for the Super Admin dashboard.
Language: **JavaScript (JSX)**. Framework: **PrimeReact DataTable (Product CRUD Style)**.

## 1. UI Requirements: PrimeReact DataTable
* **URL Reference:** Follow the implementation pattern at "https://primereact.org/datatable/#dtproducts".
* **Table Columns:** Name, Email ID, Mobile Number, Location, Country, Continent.
* **Actions:** Add New Admin (Dialog), Edit Admin, Delete Admin (ConfirmDialog), Global Search.

## 2. Form Logic (The "Smart" Admin Dialog)
Implement a PrimeReact `Dialog` for adding/editing admins with these fields:
1. **Name:** InputText.
2. **Address:** InputTextArea.
3. **Mobile Number:** InputNumber or KeyFilter (Numeric).
4. **Email ID:** InputText with Email validation.
5. **Location (City):** Dropdown. 
    * **Logic:** Source this from our existing `Locations` database table.
6. **Country & Continent:** Read-only InputTexts.
    * **CRITICAL AUTO-POPULATION:** When a user selects a **Location** from the dropdown, the agent must automatically look up the corresponding **Country** and **Continent** from the Location record and populate these fields instantly.

## 3. Backend Integration (FastAPI + PostgreSQL)
* **Endpoint:** `POST /api/admins` and `GET /api/admins`.
* **Database:** Create an `admins` table in PostgreSQL. The `location_id` should be a foreign key referencing our `locations` table.
* **Join Logic:** Ensure the `GET` request performs a SQL Join so the frontend receives the Name, Address, and the full geographic hierarchy in one object.

## 4. Implementation Details
* **File:** Create `src/pages/admin/AdminManagement.jsx`.
* **State:** Use `useState` to handle the selected location and the resulting auto-fill data.

## Instructions for Agent
- Use **Gemini 3 Pro** for the auto-population logic and database Join queries.
- Use **Gemini 3 Flash** for the PrimeReact DataTable/Dialog boilerplate.
- Strictly use `.jsx` extension and standard JS hooks.