Role: Act as an Expert Expert Frontend Developer and UI/UX Specialist.

Task: Recreate the "Light Chart Digital" dashboard exactly as shown in the provided reference image ("image_0b1085.png"). 

Tech Stack Requirements:
- Framework: React.js
- File Extensions: Strictly use JavaScript (.jsx). Do NOT use TypeScript (.ts or .tsx).
- Styling: Tailwind CSS. (Use custom arbitrary values in Tailwind for the complex box-shadows, inset shadows, and linear gradients required to match the embossed 3D aesthetics).

Design & Layout Analysis (from image_0b1085.png):
The UI features a highly detailed, skeuomorphic/neumorphic design with a cream/ivory background, gold metallic text/accents, and heavy use of bevels and embossed elements. 

Please break the development down into the following modular .jsx components:

1. Main Container:
   - A rounded rectangle with a thick, soft golden border and an inner drop shadow to give depth against the background.

2. Header Section (`DashboardHeader.jsx`):
   - Left: A hexagonal badge with a dark blue background, gold border, and a gold 'D' inside, with "LIGHT CHART DIGITAL" below it.
   - Center: The title "REAL LIFE LEADERSHIP TRAINING" in a dark blue serif font, with a gold italicized subtitle and a small decorative star separator.
   - Right: Two embossed statistic boxes vertically stacked ("5 MODULES", "40 FACETS") next to a taller dark blue box ("153 PHASES").

3. Interactive Controls (`ModuleSelector.jsx`):
   - A central control area with heavily embossed boxes.
   - Includes a "MODULE 1" box and a "DAYS 30" box, flanked by subtle '-' and '+' buttons.
   - A pill-shaped label underneath summarizing the module details.

4. Data Grids (`FacetsPhasesGrids.jsx`):
   - Two side-by-side data tables with metallic borders.
   - Left Table ("FACETS"): Dark green header, displaying a grid of numbered cells (1-5) with inset shadows.
   - Right Table ("PHASES"): Dark red header, displaying a grid of numbered cells (1-6).

5. Statistics Rows (`StatStrips.jsx`):
   - Middle Row: Three evenly spaced metrics ("WEEKS/PHASE", "DAYS/PHASE", "ART.") with gold numbers and sun icons on the sides.
   - Bottom Row: A complex grid of smaller metrics (OT BKS, NT BKS, CHAP, VRS, ENGLISH WORDS, HEB - WORDS, GK - WORDS) featuring small icons (book, pencil, list).

6. Footer Image Framed (`FooterVisual.jsx`):
   - A cinematic landscape image of mountains at sunrise/sunset at the very bottom.
   - The image must be framed on the left and right by two golden Corinthian pillars.

Execution Instructions:
1. Initialize the project structure and create the necessary .jsx files.
2. Focus heavily on replicating the "glass finish" and 3D geometric depth of the buttons and containers using Tailwind's `shadow-[...]` and `bg-gradient-to-r` utilities.
3. Ensure all components are responsive, maintaining their layout integrity across standard desktop widths.
4. Output the complete React code for each component, ensuring they are seamlessly integrated into the main App component.