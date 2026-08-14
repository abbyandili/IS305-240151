# DWU Dining Meal Booking Application (Lab 2 - Credit Extension)

## Author Information
* **Student Name:** Abigail ANDILI
* **Student ID:** 240151
* **GitHub Repository URL:** https://github.com/abbyandili/IS305-240151.git
---

## Approved Use of AI Tools
AI assistance from **Gemini (Google AI)** was utilized in accordance with academic integrity guidelines for the following specific tasks:
* **Terminal Output & UI Formatting:** Formatting ASCII table borders, padding, and layout alignments to match assignment screenshot specifications.
* **Code Debugging & Refactoring:** Resolving asynchronous `readline/promises` CLI flow issues, fixing string non-breaking space syntax errors, and refactoring object relationships.
* **Documentation & Commit Structure:** Assisting in structuring clean Git commit history messages and drafting clear README documentation. 


## Extension Overview: How Lab 2 Extends Lab 1
Lab 1 implemented a basic meal booking system where each `MealBooking` object directly stored student identity details as standalone string attributes (`studentId` and `studentName`). 

Lab 2 refactors this architecture to demonstrate **Object-Oriented Design and Shared References**:
1. **Encapsulation:** Identity details are removed from `MealBooking` and encapsulated inside a dedicated `Student` class.
2. **Aggregation & Reference Sharing:** `MealBooking` now stores a direct reference to a `Student` object rather than duplicate text strings.
3. **Dynamic State Synchronization:** Updating a student's name on their `Student` instance automatically updates all receipts produced by their associated `MealBooking` objects without requiring manual database or array syncs.
4. **Booking History:** Added `displayBookingHistory()` to filter, display, and calculate aggregate meal costs for individual students.

---

## Explanation of Core Classes

### 1. `Student` Class (`Student.js`)
* **Purpose:** Represents student profile information and protects internal state.
* **Private Fields:** `#studentId`, `#firstName`, `#lastName`.
* **Accessors & Validation:** Getters and setters ensure no empty or whitespace-only inputs are assigned to ID or name fields.
* **Key Methods:**
  * `getFullName()`: Returns the combined first and last name.
  * `displayInfo()`: Returns formatted student identity details.

### 2. `MealBooking` Class (`MealBooking.js`)
* **Purpose:** Manages individual dining hall meal reservations.
* **Private Fields:** `#student` (holds a `Student` object reference), `#mealDate`, `#mealType`, `#quantity`, `#dietaryNote`, and `#bookingStatus`.
* **Key Methods:**
  * `validate()`: Rejects invalid meal types (must be Breakfast, Lunch, or Dinner), missing fields, or quantities less than 1.
  * `calculateTotal()`: Computes meal costs using fixed unit prices in Kina (K).
  * `getSummary()`: Dynamically fetches student details through `#student.getFullName()` and `#student.studentId` to construct a clean receipt.

---

## Connection Between `Student` and `MealBooking`
Instead of duplicating student attributes across every reservation, `MealBooking` relies on **object references**: