# Agent Specification: Oil Chart Development & Integration

## 1. Objective
Create a new view component, `OilChart.jsx`, and integrate it into the "Chart Listing" menu. This chart must maintain the high-level branding of the Main Chart while implementing a specific dual-section table structure.

---
## 2. Table Architecture & Column Mapping

### A. Column Definitions (Left to Right)
The table must implement the following 6-column grid:
1.  **TEAM BAR (Vertical)**: 4% (Displays "THEME / TEAM - 1" to "TEAM - 5" in vertical orientation).
2.  **WISDOM & OT BOOKS**: 18% (Contains numbered lists of books/chapters; e.g., "1. PROVERBS 1").
3.  **CHRONOLOGY BAR (Vertical)**: 4% (Displays dates like "950 BC - 979 BC" vertically).
4.  **THEME**: 30% (Editable bullet-point area labeled "EDITABLE").
5.  **TIME**: 8% (Numeric display for reading duration; e.g., "6 m", "4 m").
6.  **OBSERVATION IMAGINATION LESSONS**: 36% (Large white-space area for notes).

### B. Specialized Structural Elements
* **Right Sidebar (Vertical)**: A unique sidebar on the far right spanning the entire table height, displaying "AVERAGE READING TIME PER DAY: 28 m" in bold red vertical text.
* **Footer Stats (Bottom Right)**: Stacked vertical labels for "VERSE - 234" and "CHAPTERS - 11".
* **Scripture Footer**: A single horizontal row spanning the bottom of the table containing the Isaiah 55:11 text.

---

## 3. Visual & Style Specifications

### A. Header Consistency
* **Instruction**: The top-level header (Above "WISDOM & OT BOOKS") must be identical in font, size, and styling to the **Main Chart Header** previously established.

### B. Typography & Colors
* **Font**: Use **Roboto Condensed** (10px) for table body data.
* **Color Logic**:
    - **Green Text**: For Team 1-3 book names and times.
    - **Blue Text**: For Team 4-5 book names and times.
    - **Red Text**: Specifically for the Average Reading Time sidebar.
* **Bullet Points**: Use solid round bullet points in the "THEME" column as shown in the screenshot.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **CSS Specialist** | Implement the `writing-mode: vertical-rl` classes for the sidebar labels and the colored text themes. |
| **Phase 2** | **JSX Architect** | Build the table grid ensuring the right-hand sidebar spans all five rows correctly. |
| **Phase 3** | **Logic Agent** | Ensure the "THEME" column is an editable field that persists changes to the database. |

---

## 5. Constraints & Standards
* **Language**: **JavaScript (JSX)** only.
* **Editability**: The "THEME" column must be 100% editable by the user.
* **Alignment**: Vertical bars must be perfectly centered within their columns.

---

## 6. Definition of Done (DoD)
- [ ] The chart is successfully linked in the Chart Listing.
- [ ] The header matches the Main Chart exactly.
- [ ] The vertical text bars (Team, Chronology, and Avg Time) are accurately rendered.
- [ ] Color-coding (Green/Blue/Red) matches the screenshot exactly.