# Project 2 design specification

Reference: `design-concept.png`, generated using the built-in Image Gen tool for this project. It defines the primary dashboard; requested list, detail, form and confirmation states extend the same component system. The user did not request a separate design approval phase.

- White `#ffffff` content, pale green sidebar `#eaf1ed`, forest green actions `#20634d`, text `#15241e`, muted `#687582`, borders `#dfe6e2`.
- Arial/Helvetica system sans-serif; desktop heading 44px, section heading 22px, body/control 15px, caption 13px. Inputs and buttons set font sizes explicitly.
- Sidebar navigation, 72px topbar, generous main gutters, four metrics, bordered full-width active-loan table and quiet full-width action strip.
- Outline icons from Lucide: Box, bar chart, Users, FileText, Landmark, Clock, CircleCheck, CircleAlert, Plus, arrows. Native controls and text throughout.
- 10px panels, 6px controls, green status treatment, orange overdue badges. No raster image is shipped as interactive UI.
- Desktop primary actions: New loan, View all loans, Add equipment, Add borrower. All labels and visible primary copy follow the concept.
- Responsive layout: narrower sidebar, two metric columns, horizontal scrolling contained inside tables; mobile has a top navigation row and single-column forms. Reduced motion respected.

The concept generation brief asked for the complete Project 2 staff dashboard, white/forest green palette, four required metrics, active-loan table with the four explicitly seeded demo loans, navigation for all three entities, and add-equipment/add-borrower actions. No marketing page or charts.

Intentional differences: no department-switch chevron because only one workspace exists; two-person Borrowers icon; date/status/data values always come from MongoDB and the current date rather than a static screenshot. The avatar is a static owner initial, not an authentication control (authentication is outside proposal scope).
