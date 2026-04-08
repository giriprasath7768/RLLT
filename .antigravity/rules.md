# Project Architecture Rules
- **Backend:** FastAPI (Python). Always use Async handlers for I/O tasks (DB/S3).
- **Frontend:** React + PrimeReact components + Tailwind.
- **Auth:** JWT tokens. Store in `HttpOnly` cookies, not LocalStorage.
- **Storage:** AWS S3 for all binary files. Use 'Presigned URLs' for media streaming.
- **Database:** PostgreSQL via SQLAlchemy/SQLModel.

# Model Delegation
- Use **Claude Opus** for: JWT Logic, S3 Integration, and Complex Refactoring.
- Use **Gemini 3 Pro** for: PrimeReact UI components and State Management.
- Use **Gemini 3 Flash** for: Unit tests, documentation, and CSS tweaks.