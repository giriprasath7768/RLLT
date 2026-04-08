# TASK: UI/UX Audit & Cross-Device Compatibility Test

## Context
Referencing the project at `@ARCHITECTURE.md` and the UI rules in `@rules.md`. 
The application is built with **React (JSX)** and **PrimeReact**.

## 1. Test Objective
Perform a comprehensive design and responsiveness audit across three viewports:
- **Desktop:** 1920 x 1080
- **Tablet (Portrait/Landscape):** 768px to 1024px
- **Mobile (Standard):** 375px to 425px (iPhone/Android standard)

## 2. Key Focus: PrimeReact DataTables
The agent must specifically test the `AdminManagement.jsx` and `LocationCRUD.jsx` tables for:
- **Horizontal Overflow:** Ensure the table doesn't break the page container. Check if `responsiveLayout="stack"` or `scrollable` is correctly implemented.
- **Action Buttons:** Verify that Edit/Delete icons are large enough for touch interaction on mobile.
- **Column Visibility:** Suggest which columns should be hidden on mobile (e.g., Continent) to maintain readability.

## 3. Visual & Design Check
- **Theme Consistency:** Confirm the background is **Pure White (#FFFFFF)** as per our Super Admin requirements.
- **Alignment:** Check the App Bar (Header) for "Logo-Left, Title-Center, Profile-Right" positioning across all screen sizes.
- **Sidebar Behavior:** Verify the Sidebar correctly collapses into a Hamburger Menu/Drawer on mobile/tablet widths.

## 4. Deliverable: Compatibility Report
Please provide a report in the following format:
1. **Pass/Fail Table:** Listing each viewport and component status.
2. **Visual Bug Artifacts:** Screenshots (rendered internally) showing any layout shifts or "broken" CSS.
3. **Remediation Code:** Provide the specific Tailwind or PrimeReact prop changes needed to fix the issues found.

---
*Note to Agent: Use the 'Browser Agent' to execute these tests. Focus on the 'Product CRUD' pattern specifically, as it contains multiple Dialogs and Overlays.*