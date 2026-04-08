# Data Engineering Directive: Book & Verse Master Schema

## 1. Objective
Ingest two related Excel sheets to create a unified PostgreSQL "Master Table" that supports Chart Generation and full CRUD (Create, Read, Update, Delete) operations via FastAPI.

## 2. Data Source Analysis
**Sheet 1: Book Metadata**
* Columns: `Book Name`, `Short Form`, `Author`, `Total Chapters`, `Total Verses`, `Total ART` (Average Reading Time), `PPL`.
* **Constraint:** If `Author` is missing in the source, default it to **"Unknown"** in the database.

**Sheet 2: Chapter Breakdown**
* Columns: `Book Name`, `Chapter Number`, `Verse Count`, `ART`.
* **Relational Logic:** Link Sheet 2 to Sheet 1 using `Book Name` as the Foreign Key.

## 3. Database Schema Requirement (PostgreSQL)
Create a normalized structure with two primary tables:

1. **`books` Table:** * `id` (UUID, PK)
   * `name` (String, Unique)
   * `short_form` (String)
   * `author` (String, Default: "Unknown")
   * `total_chapters` (Integer)
   * `total_verses` (Integer)
   * `total_art` (Float)
   * `ppl` (Float)

2. **`chapters` Table:**
   * `id` (UUID, PK)
   * `book_id` (FK referencing books.id)
   * `chapter_number` (Integer)
   * `verse_count` (Integer)
   * `art` (Float)

## 4. Frontend Display Rules (PrimeReact DataTable)
* **Empty State Logic:** When displaying data in the UI tables, any "Unknown" or null values must be rendered as a **Blank Space** (`""`). Do not display "N/A" or "None".

## 5. CRUD API Requirements (FastAPI)
**Claude 4.6 Opus** must generate endpoints for:
* `POST /books`: Create a new book entry.
* `GET /books`: List all books (with optional filtering for charts).
* `PUT /books/{id}`: Update book/chapter metadata.
* `DELETE /books/{id}`: Remove a book and its associated chapters.

## 6. Agent Instructions
* **Analyzer Agent:** Parse the attached Excel files. Verify that the sum of `verse_count` in Sheet 2 matches the `Total Verses` in Sheet 1 for each book. Report any discrepancies.
* **Backend Agent:** Generate the SQLAlchemy models and Pydantic schemas based on the parsed data. Implement the "Unknown" logic for authors.
* **Frontend Agent:** Create a PrimeReact `DataTable` with global search and sort functionality to display this master list.

## 7. Immediate Execution Command
"Anti-Gravity, please analyze the attached Excel files and generate a 'Data Validation Report.' Once validated, have Claude 4.6 Opus generate the PostgreSQL migration script (Alembic) to initialize these tables."