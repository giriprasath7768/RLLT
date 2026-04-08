# TASK: Implement "Register Here" Flow (JavaScript/JSX)

## Context
Referencing `@rules.md` and `@ARCHITECTURE.md`. We are strictly using **JavaScript (.js)** and **React JSX (.jsx)**. No TypeScript.

## 1. Frontend: Navigation & Form (React + PrimeReact)
* **Component:** In `Login.jsx`, add a "Don't have an account? Register Here" link below the login form.
* **Flow:** - Clicking the link navigates the user to a new route: `/register`.
    - Create a new component `src/pages/Register.jsx` to render the registration form.
* **Fields:** - **Name:** InputText.
    - **Address:** InputTextArea.
    - **Mobile Number:** InputNumber/KeyFilter.
    - **Email ID:** InputText with validation.
    - **Date of Birth:** Calendar (PrimeReact `Calendar`).
    - **Gender:** Dropdown (options: Male, Female, Other, Prefer not to say).
* **Feedback:** Use PrimeReact `Toast` to show a success message: "Registration successful! Check your email for your enrollment number and temporary password."

## 2. Backend: Registration Logic (FastAPI + PostgreSQL)
* **Endpoint:** `POST /api/register` in `backend/app/api/auth.js` (logic) and `main.py` (route).
* **Logic:**
    1. **Validation:** Check if the email already exists in the PostgreSQL `users` table.
    2. **Auto-Generation (CRITICAL):**
        - **Enrollment Number:** Generate a unique, sequence-based enrollment number (e.g., `ACR2024-0001`) or a strong UUID.
        - **Password:** Generate a secure, random temporary password (e.g., using `secrets` or `uuid`).
    3. **Persistence:** Save all user details, the generated Enrollment Number, and the *hashed* temporary password in the `users` table.

## Instructions for Agent
- Use **Gemini 3 Flash** for the `.jsx` component and Tailwind styling.
- Use **Claude Opus** for the secure generation logic in FastAPI and AWS SES integration.
- Ensure the email template uses Portuguese language and proper UTF-8 encoding.