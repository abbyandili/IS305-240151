
# DWU Dining Meal Booking Application

A Node.js console application for managing student dining hall meal bookings. This system enforces strict item validations, calculates totals using Kina (K), controls booking status state changes, and prevents duplicate entries using an in-memory storage array.

## Author Details
* **Program:** Dining Meal Booking Feature
* **Student Name:** Abigail ANDILI
* **Student ID:** 240151
* **Date:** 24 July 2026

## File Structure
* `MealBooking.js` - Contains the core `MealBooking` class blueprint with private fields (`#`), getters/setters, parameter validation routines, status mutators (`confirmBooking()`, `cancelBooking()`), and layout formatting logic.
* `DiningApp.js` - The main executable driver script that runs automated validation/duplicate test sequences before spinning up an interactive user command-line menu.

## Prerequisites
* **Node.js**: Ensure you have Node.js installed (Version 18.x or higher recommended for native promise-based console reading features).

## Execution Instructions

1. Open your terminal or command prompt interface.
2. Navigate directly to the folder containing your program files:
   ```bash
   cd path/to/your/project-folder
