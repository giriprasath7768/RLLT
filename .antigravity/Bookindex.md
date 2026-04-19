# Agent Specification: 'Book Index' Navigation & Reading System

## 1. Objective
Develop a new sidebar menu item labeled "Book Index." This module must replicate the UX of the **SMT Player**, allowing users to drill down from a list of books to specific chapters and finally to a full-screen reading interface.

---

## 2. UI & Functional Requirements (The Three-Tier Navigation)

### A. Tier 1: Book List (Sidebar)
* **Design Pattern:** Replicate the vertical book list used in the SMT Player.
* **Content:** Display all 66 books based on the book type from the master database.
* **Interaction:** Clicking a book expands the view to show its chapters.

### B. Tier 2: Chapter Navigation Bar (Horizontal/Grid)
* **Design Pattern:** Mirror the "Day Navigation" bar found in the SMT Player.
* **Content:** Display a numbered grid or list representing every chapter in the selected book.
* **Interaction:** Clicking a chapter number loads the text content for that specific chapter.

### C. Tier 3: Reading Interface (The Reader)
* **Display:** A clean, high-readability canvas where the user reads the book content.
* **Features:**
    - **Sync:** The Reader must stay synchronized with the selected chapter in the navigation bar.
    - **Layout:** Replicate the SMT Player’s clean UI, focusing on typography rather than video/audio controls.

---

## 3. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Integration Agent** | Register the "Book Index" route and create the sidebar toggle logic. |
| **Phase 2** | **Logic Agent** | Implement the `Book -> Chapter -> Content` state management, reusing the SMT player's "Current Selection" logic. |
| **Phase 3** | **UI/UX Agent** | Build the `BookIndexReader.jsx` component using the same styling and layout as the SMT Player view. |

---

## 4. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Data Source:** Pull book names, chapter counts, and text content directly from the existing master database tables.
* **Consistency:** Ensure the "SMT-like" feel is maintained in transition animations and active-state highlights.

---

## 5. Definition of Done (DoD)
- [ ] "Book Index" is visible in the sidebar navigation.
- [ ] Users can navigate from a Book to a Chapter number exactly like the SMT Player.
- [ ] The reading interface displays the correct text for the selected chapter.
- [ ] The overall aesthetic and navigation flow are indistinguishable from the SMT Player experience.