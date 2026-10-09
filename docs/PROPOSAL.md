Project Proposal

### 1. Project Name
**Project 2: Equipment Borrowing and Return Management System**

### 2. Team Members
1.Pongpisit Arjnarong	- GitHub: https://github.com/nongfresh8234-cloud


### 3. Project Description
Project 2 is a web application for managing equipment, borrowers, and borrowing records in a university department or a small organization.

Using paper records or separate spreadsheets can make it difficult to check equipment availability, track borrowers, and identify overdue returns. This system will keep the information in one place and provide an interface for managing the borrowing and return process.

### 4. Objectives
- Store and manage equipment information.
- Store and manage borrower information.
- Record equipment borrowing and returns.
- Display equipment availability and overdue borrowing records.
- Develop a proof of concept that can be expanded into a senior project.

### 5. Target Users
Department staff or equipment administrators who manage shared equipment, such as laptops, cameras, projectors, and computer accessories.

### 6. Technology Stack
- **Frontend and backend:** Next.js
- **Database:** MongoDB, self-hosted on a VM
- **API:** REST API implemented using Next.js Route Handlers
- **Styling:** CSS
- **Deployment:** Next.js and MongoDB running on a VM using Docker Compose
- **Version control:** Git and GitHub

The project will not use Firebase, managed backend services, or serverless deployment.

### 7. Data Models

**Equipment**
- Equipment name
- Unique equipment code
- Category
- Description
- Condition
- Created date

Each equipment record represents one physical item. Its availability is determined from its active borrowing record.

**Borrower**
- Full name
- Email
- Phone number
- Department
- Created date

**Loan**
- Equipment reference
- Borrower reference
- Borrowing date
- Due date
- Return date
- Notes

A loan is active when its return date is empty. It is overdue when its due date has passed and the equipment has not been returned.

### 8. Main Features

**Equipment Management**
- Create equipment records.
- View the equipment list and equipment details.
- Update equipment information.
- Delete equipment records that have no linked borrowing records.
- Search equipment by name or equipment code.

**Borrower Management**
- Create borrower records.
- View the borrower list and borrower details.
- Update borrower information.
- Delete borrower records that have no linked borrowing records.

**Loan Management**
- Create borrowing records by selecting an available item and a borrower.
- View borrowing records and their details.
- Update borrowing information and record returns.
- Delete incorrect borrowing records.
- Prevent the same equipment from having more than one active loan.
- Display overdue records.

**Dashboard**
- Total equipment
- Available equipment
- Equipment currently on loan
- Overdue borrowing records

### 9. REST API Endpoints

Each of the three models will support all four CRUD operations.

| Model | Create | Read | Update | Delete |
|---|---|---|---|---|
| Equipment | POST /api/equipment | GET /api/equipment and GET /api/equipment/:id | PATCH /api/equipment/:id | DELETE /api/equipment/:id |
| Borrower | POST /api/borrowers | GET /api/borrowers and GET /api/borrowers/:id | PATCH /api/borrowers/:id | DELETE /api/borrowers/:id |
| Loan | POST /api/loans | GET /api/loans and GET /api/loans/:id | PATCH /api/loans/:id | DELETE /api/loans/:id |

### 10. User Interface
The application will include:
- Dashboard page
- Equipment list, detail, and create/edit forms
- Borrower list, detail, and create/edit forms
- Loan list, detail, and create/edit forms
- Return recording interface
- Delete confirmation dialogs
- Validation messages and operation feedback

### 11. Development Plan
Planned effort: approximately 20 contributed hours per member.

1. Confirm requirements and design the data models.
2. Set up Next.js, MongoDB, and the GitHub repository.
3. Implement and test REST APIs for the three models.
4. Build the user interfaces and dashboard.
5. Test the complete borrowing and return workflow.
6. Deploy the application on a VM.
7. Prepare the README and demonstration video.

### 12. Expected Outcomes and Submission
- A working application deployed on a VM with an accessible production URL.
- Original source code published on GitHub.
- A README containing the project name, team members with repository links, project description, and screenshots.
- A five-minute demonstration video uploaded to YouTube as Unlisted.

### 13. Future Senior Project Development
This proof of concept can later be expanded with user authentication, role-based permissions, QR code scanning, return reminders, and equipment usage reports. These extensions are outside the scope of the current project.


> Project display name updated to **Project 2** at the owner’s request on 9 October 2026. If the earlier EquipTrack proposal was already submitted, notify the instructor before submitting the renamed project. Scope and data models remain the same.
