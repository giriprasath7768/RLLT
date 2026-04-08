# TASK: Implement Responsive View Switcher (DataTable to CardView)

## Context
Referencing `@rules.md` and `@ARCHITECTURE.md`. We are optimizing the `AdminManagement.jsx` and `LocationCRUD.jsx` pages for mobile users.
Language: **JavaScript (JSX)**. Framework: **PrimeReact + Tailwind CSS**.

## 1. Logic: View Detection
* **Hook:** Use a custom `useWindowSize` hook or Tailwind-based conditional rendering (e.g., `hidden md:block` and `block md:hidden`).
* **Breakpoint:** Switch from **DataTable** to **CardView** at the `768px` (md) breakpoint.

## 2. Mobile UI: The CardView Component
Create a sub-component `src/components/common/MobileDataCard.jsx` that renders a vertical stack of cards instead of rows:
* **Card Style:** Pure White background, rounded corners, and a subtle shadow (`shadow-sm`).
* **Content:** * **Header:** Bold "Name" or "Location Title".
    * **Body:** Use a 2-column grid for labels and values (e.g., "Email: admin@test.com").
    * **Actions:** A horizontal button group at the bottom of the card for "Edit" and "Delete".

## 3. Desktop UI: Optimized DataTable
* **Props:** Add `responsiveLayout="stack"` and `breakpoint="768px"` to the PrimeReact `<DataTable />`.
* **Scrolling:** Enable `scrollable` with `scrollDirection="both"` as a fallback.

## 4. Implementation Details
* Update the main CRUD pages to import both the DataTable and the new MobileDataCard.
* Ensure the "Global Search" filter works seamlessly across both views.

## Instructions for Agent
- Use **Gemini 3 Flash** to scaffold the Card layout using Tailwind `flex-col`.
- Ensure the "Add New" button remains visible as a **Floating Action Button (FAB)** or a fixed top-bar button on mobile.
- Strictly use `.jsx` and standard JavaScript.