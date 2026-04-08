# Agent Specification: 'Create Content' CRUD & Media Management

## 1. Objective
Implement a comprehensive Content Management System (CMS) within the "Create Content" menu. This system will allow admins to link audio, video, and external reference links to specific Books and Chapters stored in the master database.

---

## 2. UI & Functional Requirements (JSX)

### A. Dynamic Selection (The Anchor)
* **Book & Chapter Dropdowns:** * Populate the first dropdown from the `Book Master` table.
    * The second dropdown (Chapters) must be **dependent**; it should only show chapters belonging to the selected book.

### B. Media & Metadata Inputs
* **Audio Upload:** Integrated file picker for `.mp3`, `.wav`, or `.m4a` files.
* **Video Upload:** Integrated file picker for `.mp4` or `.mov` files.
* **Reference Link:** A standard text input for external URLs (e.g., YouTube, Study Guides).

### C. Bulk Import (Excel)
* **Functionality:** Provide an "Import Excel" button to map multiple media links to multiple chapters at once.
* **Format:** The Excel must contain columns: `Book Name`, `Chapter Number`, `Audio_URL/Path`, `Video_URL/Path`, `Ref_Link`.
* **Validation:** The agent must verify that the Book and Chapter exist in the Master list before committing the import.

---

## 3. CRUD Operations

| Operation | Requirement |
| :--- | :--- |
| **Create** | Save the mapping of Book + Chapter + Media Files to the `Content` table. |
| **Read** | Display a searchable table of all uploaded content with preview icons for Audio/Video. |
| **Update** | Allow users to replace a specific audio/video file or edit the reference link for an existing entry. |
| **Delete** | Remove the content mapping (and optionally trigger a cleanup of the stored media files). |

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Database Agent** | Create the `Content` table schema and establish Foreign Key relationships with the Book/Chapter tables. |
| **Phase 2** | **Logic Agent** | Implement the Excel parsing logic using `xlsx` and the dependent dropdown filtering logic in JSX. |
| **Phase 3** | **UI/UX Agent** | Build the "Create Content" form, including the file upload progress bars and the management table. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **File Handling:** Ensure large video uploads do not block the UI; use asynchronous state updates.
* **Error Handling:** Display clear toasts if a user tries to upload an unsupported file format or a duplicate chapter entry.

---

## 6. Definition of Done (DoD)
- [ ] Users can successfully link a video/audio file to a specific chapter via the UI.
- [ ] The "Read" table accurately reflects all stored content with working search filters.
- [ ] Bulk Excel upload successfully populates the `Content` table without duplicates.
- [ ] The system prevents "Orphaned" content (content must always be tied to a valid Book/Chapter).