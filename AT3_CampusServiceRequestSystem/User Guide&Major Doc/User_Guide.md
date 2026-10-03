# User Guide

**Project:** Campus Service Request Management System
**Unit:** IS305 Object-Oriented Programming, Divine Word University
**Student name**: Abigail ANDILI 
**ID**: 240151
**Date:** 02 September 2026

This guide shows how to install, start and use the system. The console output shown in each
"Screenshot" is real output copied from the running program (text captures). Where your unit
requires image screenshots, take them from your own computer following the same steps (see
Section 10).

---

## 1. Who Uses the System

| Role | What they do | Menu options |
|------|--------------|--------------|
| **Student / Staff requester** | Register, submit requests, view, update and cancel their own requests | 1 to 9 |
| **Service Officer** | Review requests, set priority, assign a Technician, verify and close | 11 (and 13) |
| **Technician** | View assigned requests, start work, add progress notes, resolve | 12 |
| **System Administrator** | Management reports, audit log, all users | 14 |

Anyone may use options 13 (filter and sort) and 1 to 9. The role menus (11, 12, 14) ask for your
user ID and refuse you if you do not have that role.

## 2. Installation Requirements

- **Node.js 18 or newer** (the project was tested with Node.js 22). Check with `node --version`.
  Download the LTS version from <https://nodejs.org> if needed.
- **Any terminal:** Windows Command Prompt or PowerShell, macOS Terminal, or the terminal built
  into Visual Studio Code.
- No database and no extra packages are needed.

## 3. Setup Instructions

1. Unzip `StudentID_AT3_CampusServiceSystem.zip` (or clone your GitHub repository) to a folder such
   as `Documents\AT3_CampusServiceRequestSystem`.
2. Open a terminal in that folder. In VS Code: **File, Open Folder**, then **Terminal, New Terminal**.
3. Install (this only confirms the project; there are no dependencies to download):

   ```
   npm install
   ```

4. Optional: load the simulated sample data (7 users and 6 requests) so you can try every menu at once:

   ```
   npm run seed
   ```

   If the `data` folder already holds data, the command does nothing and tells you how to replace
   it (`npm run seed -- --force`). The sample IDs are: students `DWU2026001` and `DWU2026002`,
   staff `STAFF001`, Service Officer `OFFICER001`, Technicians `TECH001` and `TECH002`,
   administrator `ADMIN001`.

## 4. Starting the Application

```
node src/CampusServiceApp.js
```

(`npm start` does the same.) The program loads any saved data and shows the main menu.
Type a number and press Enter. Your data is saved automatically after every change, so you can
close the program at any time and continue later.

**Screenshot 1 - first start with an empty `data` folder**

```text
Loaded 0 user(s), 0 request(s) and 0 audit entries from <project folder>/data

============================================
   CAMPUS SERVICE REQUEST SYSTEM
============================================
1. Register User
2. Submit Service Request
3. View Request by ID
4. View My Requests
5. View All Requests
6. Update My Request
7. Cancel My Request
8. Search Requests
9. View Request Summary
10. Exit
--------------------------------------------
11. Service Officer Menu
12. Technician Menu
13. Filter and Sort Requests
14. Administrator Menu
============================================
```

## 5. How to Register or Select a User

There is no password. You "select" yourself by typing your user ID whenever a menu asks for it.
Register once with **option 1**.

1. Choose **1**.
2. Enter a user ID, first name, last name and email address.
3. Choose the user type (type the number, or press Enter for *Student*).
4. Answer the extra questions for that type: programme and year level (Student), department (Staff),
   service section (Service Officer), technical speciality (Technician). Administrators have none.

**Screenshot 2 - registering a student**

```text
Enter choice (1-14): 1
User ID: DWU2026001
First name: Mary
Last name: Kila
Email: mary.kila@example.com
User type:
  1. Student
  2. Staff
  3. Service Officer
  4. Technician
  5. Administrator
Choose [Student]: 1
Programme: Bachelor of Information Systems
Year level (1-6): 2
User registered: ID: DWU2026001 | Name: Mary Kila | Email: mary.kila@example.com | Type: Student | Programme: Bachelor of Information Systems | Year: 2
```

To try the workflow you need at least one requester, one Service Officer and one Technician
(and an Administrator for reports). Register them the same way, or use `npm run seed`.

## 6. How to Submit a Request

Choose **2**. Enter your user ID, then a title, description and campus location. Pick a category
and a priority (press Enter for *Normal*). The program then asks a few questions specific to the
category:

| Category | Extra questions |
|----------|-----------------|
| ICT Support | Device type, system name, fault type, network impact |
| Facilities Maintenance | Building, room number, hazard level, equipment affected |
| Cleaning and Sanitation | Cleaning area, hygiene risk, service type, preferred service time (HH:MM, 24-hour) |
| General Campus Service | Service type, expected outcome |

The request receives an ID such as `REQ001` and the status *Submitted*.

**Screenshot 3 - submitting an ICT Support request**

```text
Enter choice (1-14): 2
Your user ID: DWU2026001
Title: Unable to access campus Wi-Fi
Description: Cannot connect to Wi-Fi from the library
Campus location: Library Level 2
Category:
  1. ICT Support
  2. Facilities Maintenance
  3. Cleaning and Sanitation
  4. General Campus Service
Choose: 1
Priority:
  1. Low
  2. Normal
  3. High
  4. Urgent
Choose [Normal]: 3
Details for ICT Support:
Device type: Laptop
System name: Campus Wi-Fi
Fault type: Connection failure
Network impact:
  1. None
  2. Single User
  3. Department
  4. Campus-wide
Choose [None]: 3
Request submitted with ID REQ001 (status: Submitted).
```

## 7. Viewing, Updating, Cancelling and Searching Your Requests

| Task | Menu | Notes |
|------|------|-------|
| See one request, with its full history | **3** | Type the request ID (not case sensitive). |
| See all of your requests | **4** | Only requests you submitted are shown. |
| See every request | **5** | |
| Change your request | **6** | Only while *Submitted*. Press Enter to keep a value. The category cannot be changed. |
| Cancel your request | **7** | Only while *Submitted*. Status becomes *Cancelled* (final). |
| Search | **8** | Searches request ID, title, description, location and category. |
| Count requests by status | **9** | |

**Screenshot 4 - viewing a request (note the type-specific details and priority score)**

```text
Enter choice (1-14): 3
Request ID: REQ001

Request ID : REQ001
Requester  : Mary Kila (DWU2026001)
Title      : Unable to access campus Wi-Fi
Description: Cannot connect to Wi-Fi from the library
Location   : Library Level 2
Category   : ICT Support
Priority   : High
Status     : Submitted
Technician : Not assigned
Submitted  : 9/21/2026, 7:36:35 PM
Updated    : 9/21/2026, 7:36:35 PM
Request Type      : ICT Support Request
Device Type       : Laptop
System Name       : Campus Wi-Fi
Fault Type        : Connection failure
Network Impact    : Department
Priority Score    : 45
Target Resolution : 8 hours

History:
  [9/21/2026, 7:36:35 PM] Submit Request: None -> Submitted by DWU2026001 (Student) - Request submitted.

[main menu displayed]
```

## 8. How to Assign and Process a Request

The workflow is: **Submitted, Reviewed, Assigned, In Progress, Resolved, Closed**.

### 8.1 Service Officer: review, prioritise, assign (main menu option 11)

1. Choose **11** and enter your Service Officer ID.
2. **List Submitted requests** shows what is waiting.
3. **Review a request** (Submitted becomes *Reviewed*).
4. **Set request priority** (only while *Reviewed*).
5. **Assign a Technician** (only while *Reviewed*). Registered Technicians are listed first. The
   status becomes *Assigned*.

**Screenshot 5 - Service Officer reviews, sets priority and assigns**

```text
Enter choice (1-14): 11
Your Service Officer user ID: OFFICER001

--- SERVICE OFFICER MENU ---
1. List Submitted requests waiting for review
2. Review a request
3. Set request priority (request must be Reviewed)
4. Assign a Technician (request must be Reviewed)
5. Verify and close a Resolved request
6. Back to main menu
Choose (1-6): 1

ID       Priority Status      Category                 Title
REQ001   High     Submitted   ICT Support              Unable to access campus Wi-Fi

1 request(s) shown.

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 2
Request ID: REQ001
Comment (optional): Looks like an access point fault
Request REQ001 is now Reviewed.

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 3
Request ID: REQ001
New priority:
  1. Low
  2. Normal
  3. High
  4. Urgent
Choose: 4
Comment (optional): Whole floor affected
Request REQ001 priority is now Urgent.

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 4
Registered Technicians:
  TECH001 - Ravu Sopi (Networks and ICT)
Request ID: REQ001
Technician user ID: TECH001
Comment (optional): 
Request REQ001 is now Assigned, assigned to Ravu Sopi.

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 6
```

### 8.2 Technician: start, note, resolve (main menu option 12)

1. Choose **12** and enter your Technician ID.
2. **View my assigned requests** lists your work.
3. **Start work** (*Assigned* becomes *In Progress*). Only the assigned Technician can do this.
4. **Add a progress note** at any time while *In Progress*.
5. **Resolve a request** (*In Progress* becomes *Resolved*).

**Screenshot 6 - Technician starts, adds a note and resolves**

```text
Enter choice (1-14): 12
Your Technician user ID: TECH001

--- TECHNICIAN MENU ---
1. View my assigned requests
2. Start work on a request
3. Add a progress note
4. Resolve a request
5. Back to main menu
Choose (1-5): 1

ID       Priority Status      Category                 Title
REQ001   Urgent   Assigned    ICT Support              Unable to access campus Wi-Fi

1 request(s) shown.

--- TECHNICIAN MENU ---
[menu displayed]
Choose (1-5): 2
Request ID: REQ001
Comment (optional): 
Request REQ001 is now In Progress.

--- TECHNICIAN MENU ---
[menu displayed]
Choose (1-5): 3
Request ID: REQ001
Progress note: Checking the access point on Level 2
Progress note recorded.

--- TECHNICIAN MENU ---
[menu displayed]
Choose (1-5): 4
Request ID: REQ001
Comment (optional): Access point replaced
Request REQ001 is now Resolved.

--- TECHNICIAN MENU ---
[menu displayed]
Choose (1-5): 5
```

### 8.3 Service Officer: verify and close

Choose **11**, then **Verify and close a Resolved request**. The status becomes *Closed* (final).
Viewing the request (option 3) now shows every step in its history.

**Screenshot 7 - closing the request and viewing its complete history**

```text
Enter choice (1-14): 11
Your Service Officer user ID: OFFICER001

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 5
Request ID: REQ001
Comment (optional): Confirmed working with the requester
Request REQ001 is now Closed.

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 6

[main menu displayed]
Enter choice (1-14): 3
Request ID: REQ001

Request ID : REQ001
Requester  : Mary Kila (DWU2026001)
Title      : Unable to access campus Wi-Fi
Description: Cannot connect to Wi-Fi from the library
Location   : Library Level 2
Category   : ICT Support
Priority   : Urgent
Status     : Closed
Technician : Ravu Sopi (TECH001)
Submitted  : 9/21/2026, 7:36:35 PM
Updated    : 9/21/2026, 7:36:45 PM
Request Type      : ICT Support Request
Device Type       : Laptop
System Name       : Campus Wi-Fi
Fault Type        : Connection failure
Network Impact    : Department
Priority Score    : 55
Target Resolution : 4 hours

History:
  [9/21/2026, 7:36:35 PM] Submit Request: None -> Submitted by DWU2026001 (Student) - Request submitted.
  [9/21/2026, 7:36:38 PM] Review Request: Submitted -> Reviewed by OFFICER001 (Service Officer) - Looks like an access point fault
  [9/21/2026, 7:36:39 PM] Set Priority: Reviewed -> Reviewed by OFFICER001 (Service Officer) - Priority changed from High to Urgent. Whole floor affected
  [9/21/2026, 7:36:40 PM] Assign Technician: Reviewed -> Assigned by OFFICER001 (Service Officer) - Assigned to Ravu Sopi (TECH001).
  [9/21/2026, 7:36:42 PM] Start Work: Assigned -> In Progress by TECH001 (Technician) - Work started.
  [9/21/2026, 7:36:43 PM] Progress Note: In Progress -> In Progress by TECH001 (Technician) - Checking the access point on Level 2
  [9/21/2026, 7:36:44 PM] Resolve Request: In Progress -> Resolved by TECH001 (Technician) - Access point replaced
  [9/21/2026, 7:36:45 PM] Close Request: Resolved -> Closed by OFFICER001 (Service Officer) - Confirmed working with the requester

[main menu displayed]
```

## 9. How to Search, Filter, Sort and Generate Reports

### 9.1 Search

Option **8**, then type any part of a request ID, title, description, location or category.

**Screenshot 8 - searching**

```text
Enter choice (1-14): 8
Search text: wifi
No matching requests.

[main menu displayed]
```

### 9.2 Filter and sort (main menu option 13)

Filter by category, status, priority or assigned Technician; sort by date submitted (newest or
oldest first) or by priority (highest or lowest first). Results are shown as a compact table.

### 9.3 Management reports (main menu option 14, Administrator only)

Choose **14** and enter an Administrator ID. The menu offers:

| # | Report |
|---|--------|
| 1 to 3 | Requests by status, category, priority |
| 4 | Urgent requests that are still open |
| 5 | Overdue requests (older than their target resolution time) |
| 6 | Requests assigned to each Technician |
| 7 | Completed (Resolved or Closed) requests by Technician |
| 8 | Average resolution time |
| 9 | Request volume by campus location |
| 10 | Priority score and target time for every request (shows polymorphism) |
| 11 | Audit log: who did what, when, and whether it succeeded |
| 12 | All registered users |

**Screenshot 9 - requests by status and overdue requests (sample data)**

```text
Choose (1-13): 1

Requests by status
  Submitted                          1
  Assigned                           2
  Resolved                           1
  Closed                             1
  Cancelled                          1

--- ADMINISTRATOR MENU ---
[menu displayed]

Choose (1-13): 5

Overdue requests (past their target resolution time):
  REQ006   Assigned      113.61 hours overdue - Computer lab PCs will not start

--- ADMINISTRATOR MENU ---
[menu displayed]
```

**Screenshot 10 - priority scores and target times, different for each request type**

```text
Choose (1-13): 10

ID       Class                  Score  Target
REQ001   ICTSupportRequest      45     8 hours
REQ002   MaintenanceRequest     55     8 hours
REQ003   CleaningRequest        50     4 hours
REQ004   GeneralServiceRequest  10     96 hours
REQ005   ICTSupportRequest      25     24 hours
REQ006   ICTSupportRequest      45     8 hours
```

## 10. Taking Real Screenshots

For image screenshots, run the same steps on your computer and capture the terminal window:
Windows **Win + Shift + S**, macOS **Shift + Command + 4**. Capture at least: the start-up menu,
registering a user, submitting a request, the officer and technician workflow, a report, and an
error message. Paste them into the copy of this guide you submit.

## 11. Common Errors and Solutions

These are the exact messages the program prints.

**Screenshot 11 - typical errors: duplicate user, bad email, unregistered user, bad category**

```text
Enter choice (1-14): 1
User ID: DWU2026001
First name: Mary
Last name: Kila
Email: mary.kila@example.com
User type:
  1. Student
  2. Staff
  3. Service Officer
  4. Technician
  5. Administrator
Choose [Student]: 1
Programme: BIS
Year level (1-6): 2
Error: Duplicate user ID: DWU2026001 is already registered.

[main menu displayed]
Enter choice (1-14): 1
User ID: NEWUSER
First name: Peter
Last name: Bani
Email: peter-at-example
User type:
  1. Student
  2. Staff
  3. Service Officer
  4. Technician
  5. Administrator
Choose [Student]: 1
Programme: Business
Year level (1-6): 1
Error: A valid email address is required.

[main menu displayed]
Enter choice (1-14): 2
Your user ID: GHOST
Error: User GHOST is not registered. Register first (option 1).

[main menu displayed]
Enter choice (1-14): 2
Your user ID: DWU2026001
Title: Broken chair
Description: Loose leg
Campus location: Room B12
Category:
  1. ICT Support
  2. Facilities Maintenance
  3. Cleaning and Sanitation
  4. General Campus Service
Choose: Furniture
Error: Unsupported category "Furniture". Allowed: ICT Support, Facilities Maintenance, Cleaning and Sanitation, General Campus Service.

[main menu displayed]
```

**Screenshot 12 - role and workflow errors**

```text
Enter choice (1-14): 11
Your Service Officer user ID: DWU2026001
Error: Access denied: DWU2026001 is a Student, not a Service Officer.

[main menu displayed]
Enter choice (1-14): 11
Your Service Officer user ID: OFFICER001

--- SERVICE OFFICER MENU ---
1. List Submitted requests waiting for review
2. Review a request
3. Set request priority (request must be Reviewed)
4. Assign a Technician (request must be Reviewed)
5. Verify and close a Resolved request
6. Back to main menu
Choose (1-6): 3
Request ID: REQ003
New priority:
  1. Low
  2. Normal
  3. High
  4. Urgent
Choose: 1
Comment (optional): 
Error: Priority can only be set while the request is Reviewed (current status: Cancelled).

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 6

[main menu displayed]
Enter choice (1-14): 11
Your Service Officer user ID: OFFICER001

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 4
Registered Technicians:
  TECH001 - Ravu Sopi (Networks and ICT)
  TECH002 - Lena Kaupa (Plumbing and Electrical)
Request ID: REQ003
Technician user ID: TECH001
Comment (optional): 
Error: Invalid status transition: a request that is Cancelled cannot become Assigned. Allowed next status: none (final status).

--- SERVICE OFFICER MENU ---
[menu displayed]
Choose (1-6): 6

[main menu displayed]
Enter choice (1-14): 12
Your Technician user ID: TECH002

--- TECHNICIAN MENU ---
1. View my assigned requests
2. Start work on a request
3. Add a progress note
4. Resolve a request
5. Back to main menu
Choose (1-5): 3
Request ID: REQ001
Progress note: sneaky note
Error: Access denied: only the assigned Technician can add progress notes. This request is assigned to TECH001.

--- TECHNICIAN MENU ---
[menu displayed]
Choose (1-5): 5

[main menu displayed]
```

| Message | Meaning | Solution |
|---------|---------|----------|
| `Error: Duplicate user ID: X is already registered.` | That ID is taken. | Use a different ID, or just use the existing user. |
| `Error: A valid email address is required.` | Email is not like `name@site.com`. | Retype the email. |
| `Error: User ID is required.` / `First name is required.` | A required field was left blank. | Enter a value. |
| `Error: User X is not registered. Register first (option 1).` | Unknown user ID. | Check the ID or register (option 1). |
| `Error: Unsupported category "X". Allowed: ...` | Category not one of the four. | Choose the number from the list. |
| `Error: Unsupported priority "X". Allowed: ...` | Priority not one of the four. | Choose Low, Normal, High or Urgent. |
| `Error: Network impact must be one of: ...` (and similar) | A category-specific answer is not allowed. | Choose from the numbered list. |
| `Error: Preferred service time must be a 24-hour time such as 14:30.` | Bad time format. | Use HH:MM, e.g. `08:30`. |
| `Error: Request X was not found.` | No request has that ID. | Check the ID with option 5 or 8. |
| `Error: Access denied: you can only change your own requests.` | The request belongs to another user. | Use the ID of the person who submitted it. |
| `Error: Only Submitted requests can be updated / cancelled (current status: ...)` | Work has already begun. | Ask a Service Officer; a started request cannot be changed by the requester. |
| `Error: This request is already Cancelled.` | Cancelled twice. | Nothing to do. |
| `Error: No changes were supplied.` | Update with every answer blank. | Type at least one new value. |
| `Error: The category cannot be changed. ...` | Category is fixed after submission. | Cancel the request and submit a new one. |
| `Error: Access denied: X is a Student, not a Service Officer.` | You opened a role menu you do not hold. | Use the correct menu and ID. |
| `Error: Access denied: only the assigned Technician can ...` | Another Technician (or a non-Technician) tried the step. | Only the assigned Technician may start, note or resolve. |
| `Error: Invalid status transition: ...` | The step is out of order (for example closing before resolving). | Follow the order: review, assign, start, resolve, close. |
| `Error: Priority can only be set while the request is Reviewed ...` | Priority is set between review and assignment. | Review first, and set priority before assigning. |
| `Invalid choice. Please enter a number from 1 to 14.` | Not a menu number. | Type a number shown in the menu. |
| `Error: saved data could not be loaded. Cannot read ...users.json: the file does not contain valid JSON.` | A data file was damaged (for example edited by hand). | Fix the file named in the message, or delete it and start again. The program stops on purpose so it never overwrites your data. |
| `Warning: your change is in memory but could not be saved.` | The `data` folder is not writable. | Check folder permissions and free disk space. |
| `node is not recognized` / `command not found: node` | Node.js is not installed, or the terminal was opened before installing. | Install Node.js, then open a new terminal. |
| `Cannot find module ...` | The terminal is in the wrong folder. | `cd` into `AT3_CampusServiceRequestSystem` first. |
| Syntax error mentioning `#` or `static` | Node.js is too old. | Install Node.js 18 or newer. |

## 12. Starting Fresh

To erase all data and start from an empty system, close the program and delete the four files in
the `data` folder (or empty each to `[]`). To restore the sample data, run `npm run seed -- --force`.
