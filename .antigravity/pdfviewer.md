# Agent Specification: 3D PDF Flipbook Viewer Integration

## 1. Objective
Implement a "Real 3D Flipbook Viewer" within the Players module. The viewer must trigger specifically when the **SMT Player** is launched, transforming standard uploaded PDFs into an interactive, 3D page-turning experience.

---

## 2. Functional Requirements (JSX)

### A. Trigger & Initialization
* **Source Module:** Players Module.
* **Activation Trigger:** Clicking on the **SMT Player** icon or button.
* **Input Data:** The viewer must dynamically load the PDF file currently associated with the selected content/chapter.

### B. 3.D Flipbook Capabilities
* **Realistic Physics:** Implement a page-turning effect that mimics a physical book (3D curvature, shadows, and sound effects).
* **Navigation Controls:** * "Flip" via mouse drag or edge-clicking.
    * Table of Contents (TOC) sidebar for quick jumping.
    * Zoom-in/out functionality for detailed reading.
* **Responsive Rendering:** The 3D canvas must scale according to the screen size while maintaining the PDF's aspect ratio.

---

## 3. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Integration Agent** | Modify the SMT Player trigger in the `PlayersModule.jsx` to launch the Flipbook modal instead of a standard PDF viewer. |
| **Phase 2** | **Graphics Agent** | Implement the 3D rendering engine using a library like `react-pageflip`, `3d-flip-book`, or `three.js` wrappers. |
| **Phase 3** | **UI/UX Agent** | Design the viewer interface (toolbar, close button, and background overlay) using the "App Creators" design language. |

---

## 4. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Performance:** Ensure the PDF is buffered/loaded efficiently to prevent lag during the 3D animation.
* **Format:** Support for standard `.pdf` files uploaded via the "Create Content" menu.

---

## 5. Definition of Done (DoD)
- [ ] Clicking the SMT Player opens the 3D Flipbook interface.
- [ ] The PDF pages turn with a realistic 3D animation.
- [ ] The viewer correctly displays the content uploaded for that specific chapter.
- [ ] Navigation and zoom controls are fully functional and responsive.