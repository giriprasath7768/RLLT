# TASK: Implement "Forgot Password" Logic (JavaScript/JSX)

## Context
Referencing the rules in `@rules.md` and the architecture in `@ARCHITECTURE.md`. 
We are strictly using **JavaScript (.js)** and **React JSX (.jsx)**. No TypeScript.

## 1. Frontend: Modular Popup (React + PrimeReact)
* **Component:** Create `src/components/auth/ForgotPasswordModal.jsx`.
* **UI:** Use PrimeReact `Dialog`.
* **Flow:** - Add a "Forgot Password?" link to the existing `Login.jsx`.
    - Clicking the link opens the `Dialog` modal.
    - User enters their "Registered Email ID".
    - "Submit" button triggers the backend API call.
* **Feedback:** Use PrimeReact `Toast` to show: "If this email is registered, a reset link has been sent."

## 2. Backend: Reset Logic (FastAPI + PostgreSQL)
* **Endpoint:** `POST /api/auth/forgot-password` in `backend/app/api/auth.js` (logic) and `main.py` (route).
* **Logic:**
    - Check the PostgreSQL `users` table for the email.
    - Generate a secure, time-limited token (UUID) and store it in a `password_resets` table with a 15-minute expiry.
    - Construct a URL: `https://appcreators.com/reset-password?token=XYZ`.

## 3. Email Integration (AWS SES)
* **Service:** Use `boto3` to send a transactional email via **Amazon SES**.
* **Template:** The email should be in HTML, formatted for professional delivery, and support Portuguese UTF-8 characters.

## Instructions for Agent
- Generate the **SQLAlchemy/SQLModel** migration for the `password_resets` table first.
- Use **Gemini 3 Flash** for the `.jsx` component and Tailwind styling.
- Use **Claude Opus** for the Python logic involving cryptography and AWS SES integration.
- Ensure all React code uses `.jsx` extension and standard JavaScript hooks.