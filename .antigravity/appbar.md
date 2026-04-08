# TASK: Implement Admin Dashboard App Bar (JavaScript/JSX)

## Context
Referencing `@rules.md` and `@ARCHITECTURE.md`. We are building the header for the "Super Admin" dashboard. 
Language: **JavaScript (JSX)**. Framework: **PrimeReact + Tailwind CSS**.

## 1. UI Requirements: Layout & Styling
* **Background:** The body and App Bar background for the Super Admin page must be **Pure White (`#FFFFFF`)**.
* **Left Section:** Place the company logo (referencing the logo project in our workspace). 
* **Center Section:** Display the App Name in a clean, professional font (e.g., "App Creators Media").
* **Right Section:** * Display a **Profile Picture** (use a PrimeReact `Avatar` component).
    * Implement a **Dropdown Menu** on the profile picture using PrimeReact `Menu` or `TieredMenu`.
    * Dropdown options must include: "Profile Settings" and **"Logout"**.

## 2. Functionality (JS Logic)
* **Logout Logic:** The logout option must clear the `access_token` cookie and redirect the user back to the `/login` page using `react-router-dom`.
* **Responsive Design:** Ensure the App Bar is sticky and uses Tailwind `flex` utilities for perfect alignment (justify-between).

## 3. Implementation Details
* **Component:** Create `src/components/layout/AdminHeader.jsx`.
* **State:** Use a local `useRef` for the PrimeReact Menu toggle.
* **Icons:** Use `primeicons` for the logout and settings menu items.

## Instructions for Agent
- Use **Gemini 3 Flash** for the JSX and Tailwind layout to optimize quota.
- Ensure the logo is properly scaled (e.g., `h-10`).
- Strictly use `.jsx` extension and standard JavaScript hooks.