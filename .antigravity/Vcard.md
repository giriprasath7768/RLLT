# Agent Specification: V-Card Chart Development (Fully Editable)

## 1. Objective
Create a new view component, `VCardChart.jsx`, within the "Chart Creation" module. The chart must replicate the visual structure of the provided screenshot but transition all static content into a fully editable state.

---

## 2. Structural & Interactive Requirements

### A. Element Conversion (Static to Editable)
* **Text Fields:** Every text element found in the screenshot (Titles, Labels, Headers, and Body content) must be rendered as a controlled JSX input or textarea.
* **Symbol Removal:** Remove all hardcoded bullet points and "Asterisk" (*) symbols from the original design.
* **Dynamic Bullets:** Replace removed symbols with a customizable "Bullet Toggle" or a rich-text list component where the user can choose their own icons.

### B. V-Card Layout Features
* **Grid System:** Maintain the card-based layout structure shown in the screenshot.
* **Component Mapping:** Use a `.map()` function to render the "V-Cards" from a JSON state, allowing users to add or remove cards dynamically.

---

## 3. Visual Design (Ref: Screenshot Analysis)

### A. UI/UX Specifications
* **Editable States:** When a user clicks on a piece of text, it should transform into an active input field with a subtle border to indicate it is "In-Edit".
* **Placeholder Logic:** If a field is cleared, display a helpful placeholder (e.g., "Enter Heading here...") instead of leaving a blank gap.
* **Save Mechanism:** Include a "Save Layout" button that persists all text changes and custom symbol selections to the database.

### B. Styling & Aesthetics
* **Typography:** Match the font style from the screenshot but ensure the weight and size are adjustable via the UI.
* **Spacing:** Maintain the exact padding and margin ratios from the original PDF/Screenshot to ensure a professional look.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **UI/UX Agent** | Build the base `VCard.jsx` component using `input` and `textarea` tags for every text node. |
| **Phase 2** | **Logic Agent** | Remove all hardcoded asterisks (*) and implement the state management for "Real-time Editing." |
| **Phase 3** | **Data Agent** | Connect the V-Card data to the main project database so changes are saved across sessions. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Cleanliness:** No hardcoded strings. All text must be pulled from a state object to ensure 100% editability.
* **Icons:** If bullets are needed, use a library like `FontAwesome` or `Lucide-React` instead of text-based symbols like `*`.

---

## 6. Definition of Done (DoD)
- [ ] The V-Card Chart is visible in the Chart Creation list.
- [ ] No asterisks (*) or hardcoded bullets remain in the UI.
- [ ] All text displayed on the screen can be clicked and edited by the user.
- [ ] The layout maintains the aesthetic integrity of the original screenshot.