🛠 Menu & UI Integration
Super Admin Dashboard
New Menu Item: Add a primary menu item labeled "Classroom" to the Super Admin sidebar/navigation.
Location Switcher: Ensure the Super Admin's location dropdown selector contextually updates the data within this new Classroom menu.
🧱 Classroom Module Architecture (Location-Aware)
Implement the Classroom functionality using a modular service pattern, strictly scoped by `location_id`.
1. Content Service
Hierarchy: Course → Module → Lesson.
Logic: Courses created in the Classroom must inherit the `location_id` of the active center (e.g., Chennai Center).
2. Assignment Service
Logic: Tie all classroom assignments to the specific `location_id`. Students must only see assignments for their assigned location.
3. Analytics Service
Dashboard: Within the Classroom menu, provide location-specific progress analytics for courses and assignments.
⚠️ Core Database & API Mandate
No Data Leakage: All SQLite queries for the Classroom module must include a `WHERE location_id = ?` clause.
Inheritance: Every new entity created within the Classroom (Lessons, Assignments, etc.) must automatically inherit the `location_id` from its parent Course or User context.
👤 Role-Based Flow
Super Admin: Full CRUD access to Classroom items across all locations via the switcher.
Student: View-only access to Content and Interaction access for Assignments, strictly filtered by their registered `location_id`.