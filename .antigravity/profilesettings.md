# Agent Specification: Super Admin Database & Profile Management

## 1. Objective
Create a secure Super Admin record and a corresponding "Profile Settings" interface that allows the Super Admin to update their personal and security credentials directly within the application.

---

## 2. Database & Authentication Setup (Initial State)
Initialize a `SuperAdmin` table/collection with the following schema:
* **Full Name:** String
* **Email Address (Username):** `admin@example.com`
* **Password:** `adminPassword` (Ensure this is hashed in the database)
* **Mobile Number:** String
* **Address:** Text
* **Profile Image:** URL/String

---

## 3. UI/UX Workflow (JSX)

### A. Access Point
* **Trigger:** Click the Profile Picture in the navigation bar to open a pop-up menu.
* **Selection:** Select "Profile Settings" to launch the modification window.

### B. Profile Settings Pop-up
The pop-up must render a form pre-populated with the current Super Admin data:
1. **Editable Fields:** Name, Mobile Number, Address, and Profile Image.
2. **Security Fields:** * **Email:** Display `admin@example.com` (Editable but validated).
    * **Password:** A "Change Password" toggle or field to update the current credential.
3. **Actions:** * `Update Profile`: Validates and saves changes to the database.
    * `Cancel`: Closes the pop-up without saving.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Backend/Data Agent** | Create the `SuperAdmin` table and seed the initial credentials (`admin@example.com` / `adminPassword`). |
| **Phase 2** | **Logic Agent** | Build the `useProfile` hook in JSX to fetch the admin data and handle the `PUT/PATCH` request to save changes. |
| **Phase 3** | **UI Agent** | Design the Pop-up window and Form components, ensuring the Profile Image preview updates instantly upon selection. |

---

## 5. Constraints & Standards
* **Language:** Use **JavaScript (JSX)** only.
* **Security:** Ensure password fields use `type="password"` and the email field follows standard regex validation.
* **Persistence:** Changes must persist in the database; a page refresh should show the updated details.
* **Branding:** Ensure the "App Creators" design language is maintained in the pop-up styling.

---

## 6. Definition of Done (DoD)
- [ ] Super Admin can log in with the default credentials.
- [ ] Profile Settings pop-up opens correctly and displays existing data.
- [ ] Users can change their name, address, or password and click "Save."
- [ ] The database updates and the UI reflects the new information immediately.