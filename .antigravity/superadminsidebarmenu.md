# TASK: Implement Admin Sidebar Navigation (JavaScript/JSX)

## Context
Referencing `@rules.md` and `@ARCHITECTURE.md`. We are building the vertical navigation sidebar for the Super Admin dashboard.
Language: **JavaScript (JSX)**. Framework: **PrimeReact + Tailwind CSS**.

## 1. UI Requirements: Sidebar Layout
* **Background:** Pure White (`#FFFFFF`) with a subtle right border (`border-r border-gray-100`).
* **Component:** Use PrimeReact `Menu` or a custom `nav` element with Tailwind.
* **Behavior:** The sidebar should be fixed to the left side and span the full height of the viewport.

## 2. Navigation Menu Items
Implement the following links with corresponding `primeicons`:
1.  **Dashboard** (pi-home)
2.  **Create Admin** (pi-user-plus)
3.  **Create Leader** (pi-users)
4.  **Student List** (pi-list)
5.  **Create Assessment** (pi-file-edit)
6.  **Create Training Contents** (pi-video)
7.  **Chart Creation** (pi-chart-bar)
8.  **Locations** (pi-map-marker)
9.  **Settings** (pi-cog)

## 3. Logic & Routing (JS)
* **Active State:** Use `react-router-dom` (useLocation hook) to highlight the active menu item with a primary color left-border or background tint.
* **Redirection:** Each item must link to its respective route (e.g., `/admin/create-leader`).
* **Responsive:** On mobile screens, the sidebar should transform into a PrimeReact `Sidebar` (Drawer) component triggered by a hamburger menu.

## 4. Implementation Details
* **File:** Create `src/components/layout/AdminSidebar.jsx`.
* **Styling:** Ensure text is dark and professional (e.g., `text-gray-700`) to contrast with the white background.

## Instructions for Agent
- Use **Gemini 3 Flash** for the JSX structure and icon mapping.
- Ensure the menu items are spaced comfortably (vertical padding).
- Strictly use `.jsx` extension and standard JavaScript hooks.