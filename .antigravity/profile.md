# Agent Specification: User Profile Management & Modal System

## 1. Objective
Implement a user profile interaction flow where clicking the user's profile picture opens a detailed, editable profile form.

---

## 2. User Interaction Flow
1.  **Trigger:** The user clicks on the `Profile Picture` (Avatar) located in the navigation bar or dashboard.
2.  **Selection:** A dropdown or menu appears with the option "View Profile."
3.  **Display:** Upon selecting "View Profile," a modal or dedicated overlay must render containing the `Profile Form`.

---

## 3. Core Requirements (JSX)

### A. Profile Form Fields
The form must be built using controlled components in JSX and include:
* **Avatar Upload:** A way to preview and update the profile picture.
* **Personal Info:** Fields for `First Name`, `Last Name`, and `Email` (read-only for email).
* **Professional Details:** Fields for `Role` and `Company Name` (Default: "App Creators").
* **Actions:** `Save Changes` and `Cancel` buttons.

### B. State Management
* **Visibility State:** A boolean state (e.g., `isProfileOpen`) to toggle the visibility of the form.
* **Form State:** An object state to track real-time changes to the profile fields before saving.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **UI/UX Builder** | Create the `ProfileOverlay.jsx` component and ensure it centers correctly on the screen with a backdrop blur. |
| **Phase 2** | **Logic Architect** | Handle the `onClick` events for the avatar and manage the state transitions between the "Viewing" and "Editing" modes. |
| **Phase 3** | **Data Specialist** | Implement the `handleSave` logic to update the local state or API and ensure the profile picture updates across the app instantly. |

---

## 5. Constraints & Standards
* **Language:** Use **JavaScript (JSX)** only.
* **Responsiveness:** The profile form must be mobile-friendly, stacking input fields vertically on smaller screens.
* **Visual Feedback:** Include a "Loading" state on the Save button to indicate the update is in progress.

---

## 6. Definition of Done (DoD)
- [ ] Clicking the avatar opens a menu/modal.
- [ ] Selecting "Profile" displays a pre-populated form with the user's current data.
- [ ] Users can edit fields and see a live preview of their changes.
- [ ] Clicking "Save" persists the data and closes the modal.