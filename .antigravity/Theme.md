We need to implement a complete enterprise-level dynamic theme customization system in our React application using Material UI (MUI v5) ThemeProvider architecture.

Current Application Structure:
- React frontend
- Admin dashboard layout
- Left sidebar navigation
- Top topbar/appbar
- Content area with cards/forms/tables
- Settings page already exists
- Multiple roles:
  - Super Admin
  - Admin
  - Leader
  - Student

Goal:
Create a fully dynamic theme management engine where users can customize the appearance of the application in real time without refreshing the page.

Technical Requirements:
- Use Material UI v5
- Use createTheme()
- Use ThemeProvider
- Use React Context API for global theme state
- Use CssBaseline
- Use dynamic theme generation
- Use localStorage persistence
- Architecture must be scalable and enterprise-grade
- Theme updates should apply instantly across the application

Required Theme Customization Features:

1. Sidebar Customization
- Sidebar background color
- Sidebar text color
- Sidebar active menu color
- Sidebar hover color
- Sidebar border color
- Sidebar width
- Collapsible sidebar support

2. Topbar/Appbar Customization
- Topbar background color
- Topbar text color
- Icon colors
- Elevation/shadow controls

3. Global Typography Customization
- Font family selector
- Font size controls
- Heading styles
- Body text color
- Secondary text color

4. Layout Customization
- Border radius controls
- Card shadow controls
- Container spacing
- Compact mode
- Full width / boxed layout

5. Appearance Modes
- Light mode
- Dark mode
- System mode detection

6. Primary Theme Colors
- Primary color
- Secondary color
- Success color
- Warning color
- Error color
- Info color

7. Card & Surface Customization
- Card background
- Paper background
- Surface elevation
- Border colors

8. Advanced Theme Features
- Theme reset button
- Save theme button
- Export theme JSON
- Import theme JSON
- Live preview updates
- Prebuilt theme presets

Prebuilt Themes Required:
- Corporate Blue
- Dark Ocean
- Emerald
- Purple Night
- Minimal White

Architecture Requirements:

Create:
- ThemeContext.jsx
- theme.js
- ThemeCustomizer.jsx
- themes/
- hooks/
- constants/

Implement:
- Dynamic createTheme() generation
- Context-based state management
- Persistent theme storage using localStorage
- Optional backend sync support

MUI Features To Use:
- ThemeProvider
- createTheme
- CssBaseline
- Palette mode
- Typography customization
- Component style overrides
- Breakpoints
- Shadows
- Shape.borderRadius

Required Component Overrides:
- MuiButton
- MuiCard
- MuiDrawer
- MuiAppBar
- MuiTextField
- MuiDataGrid
- MuiTabs
- MuiDialog

UI Requirements:
- Professional enterprise UI
- Smooth transitions while changing themes
- Real-time live preview
- Responsive on desktop/tablet/mobile
- Clean settings panel with tabs

Suggested Theme Settings Tabs:
- General
- Sidebar
- Topbar
- Typography
- Colors
- Layout
- Appearance
- Presets

Persistence Requirements:
- Save user theme settings in localStorage initially
- Prepare architecture for future API/database storage
- Theme should load automatically after login

Code Requirements:
- Clean modular architecture
- Production-ready code
- Reusable hooks
- Reusable theme utilities
- Avoid hardcoded colors
- Use centralized theme tokens
- Use CSS variables where needed

Deliverables Required:
1. Complete ThemeContext implementation
2. Dynamic Material UI theme engine
3. Theme customization panel UI
4. Sample preset themes
5. LocalStorage persistence
6. Example integration into existing dashboard
7. Folder structure
8. Reusable helper functions
9. Responsive design support
10. Clean scalable enterprise architecture

The implementation must be optimized for large-scale admin dashboard systems and future multi-tenant customization support.