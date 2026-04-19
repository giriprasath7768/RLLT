# Agent Specification: Multi-Layered Typography System Integration

## 1. Objective
Enhance the typography engine across the application—specifically for '7TNT Word'—by integrating a comprehensive library of "Free Layered Fonts." These fonts must support multi-layered styling (e.g., base, shadow, outline, and fill layers) to provide a high-end, 3D aesthetic.

---

## 2. Technical Requirements (The Font Stack)

### A. Font Library Selection
The agents must integrate high-quality, open-source layered font families. Recommended "Free Layered" options include:
* **Frontage** (Layers: Bulb, Bold, Shadow).
* **Anisette** (Multi-layered Art Deco).
* **Zevida** (Sans Serif Layered).
* **Trend** (Layers: Slab, Sans, Ornaments).
* **Graduate** (Collegiate layered style).

### B. CSS-in-JS Implementation
To handle "Layered" fonts in **JSX**, the agents must implement a multi-stack CSS approach:
* **Text-Shadow Layering:** Use `text-shadow` to simulate depth without multiple DOM elements.
* **Component Layering:** Create a `LayeredText` component that stacks multiple versions of the same string with different CSS classes (e.g., `font-layer-base`, `font-layer-outline`, `font-layer-shadow`).

---

## 3. UI Integration (7TNT Word & Main Charts)

### A. The "Fancy Font" Picker
Update the font dropdown in the **7TNT Word** toolbar to include a "Layered Fonts" category.
* **Preview Mode:** The dropdown must show the font name rendered in its specific layered style so the user can see the effect before selecting.

### B. Size & Color Adjustment Logic
* **Synchronized Scaling:** When the user adjusts the "Size", all layers (base, shadow, outline) must scale proportionally to maintain the 3D effect.
* **Independent Color Control:** Provide a sub-menu to allow users to set different colors for the "Fill" vs. the "Outline" layers.

---

## 4. Technical Execution Steps (Parallel Workflow)

| Phase | Agent Assignment | Task Description |
| :--- | :--- | :--- |
| **Phase 1** | **Asset Agent** | Source and install the `.woff2` or Google Font files for the layered families. |
| **Phase 2** | **CSS Architect** | Build the global `@font-face` declarations and the `LayeredText` JSX wrapper component. |
| **Phase 3** | **UI/UX Agent** | Integrate these fonts into the **7TNT Word** typography picker and the **V-Card** editable fields. |

---

## 5. Constraints & Standards
* **Language:** **JavaScript (JSX)** only.
* **Performance:** Use font-display: `swap` to prevent layout shifts.
* **Editability:** Ensure the layered text remains fully editable as plain text for the user.

---

## 6. Definition of Done (DoD)
- [ ] A minimum of 5 distinct layered font families are available in the system.
- [ ] The "Fancy Font" picker in 7TNT Word displays these options with accurate previews.
- [ ] Layers scale and change color correctly when using the toolbar adjustments.
- [ ] The 3D/fancy effect is visible in both the editor and the final printed/PPT outputs.