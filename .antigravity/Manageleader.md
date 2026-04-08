# TASK: Implement "Manage Leader" CRUD with Cascading Auto-Population

## Context
Referencing `@rules.md` and `@ARCHITECTURE.md`. We are building the "Manage Leader" module.
Language: **JavaScript (JSX)**. Framework: **PrimeReact DataTable (Product CRUD Style)**.

## 1. UI Requirements: PrimeReact DataTable
* **URL Reference:** Follow https://primereact.org/datatable/#dtproducts.
* **Table Columns:** Leader Name, Assigned Admin, Location, Country, Email, Mobile.
* **Features:** Global Search, Add New Leader (Dialog), Edit, and Delete.

## 2. Form Logic: The "Chained" Leader Dialog
Implement a PrimeReact `Dialog` with the following smart behavior:

### A. The "Assigned Admin" Selector
* **Field:** Dropdown labeled "Assigned To Admin".
* **Source:** Fetch all saved Admins from the PostgreSQL `admins` table.
* **Logic (Auto-Population):** - Upon selecting an Admin, the agent must automatically fetch that Admin's linked `location_id`.
    - It must then auto-populate the **Location, Country, and Continent** fields in the Leader form based on that Admin's profile.
    - These four fields (Admin Name, Location, Country, Continent) should be **Read-Only** to maintain data integrity.

### B. General Information (User Input)
The following fields are manually entered for the new Leader:
* **Name:** InputText.
* **Address:** InputTextArea.
* **Mobile Number:** InputNumber/KeyFilter.
* **Email ID:** InputText with validation.

## 3. Backend Integration (FastAPI + PostgreSQL)
* **Schema:** Create a `leaders` table. 
* **Relations:** `leader.admin_id` should be a Foreign Key to `admins.id`.
* **API:** The `GET /api/leaders` endpoint should use a **SQL JOIN** (Leaders ↔ Admins ↔ Locations) so the frontend gets the full geographic string in one request.

## Instructions for Agent
- Use **Gemini 3 Pro** for the complex "chained" lookup logic (Admin -> Location -> Country).
- Use **Gemini 3 Flash** for the PrimeReact UI components.
- Ensure the background remains **Pure White** and the layout is responsive (Mobile Card View).
- Strictly use `.jsx` and standard JavaScript hooks.