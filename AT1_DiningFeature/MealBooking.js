/*
Program: Dining Meal Booking Feature
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 20 July 2026
  Description: A JavaScript program demonstrating classes,
  objects, constructors, private fields and methods.
  */

 class MealBooking {
    // Private fields defined
  #studentId;
  #studentName;
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;

  // Constructor receiving booking info
  constructor(studentId, studentName, mealDate, mealType, quantity, dietaryNote) {
    this.#studentId = studentId;
    this.#studentName = studentName;
    this.#mealDate = mealDate;
    this.#mealType = mealType; // Fixed: Added this missing assignment
    this.#quantity = quantity;
    this.#dietaryNote = dietaryNote;
    this.#bookingStatus = "Pending"; // Default status
 } 

 // Getters and Setters (Moved out of the constructor)
  get studentId() { return this.#studentId; }
  set studentId(value) { this.#studentId = value; }

  get studentName() { return this.#studentName; }
  set studentName(value) { this.#studentName = value; }

  get mealDate() { return this.#mealDate; }
  set mealDate(value) { this.#mealDate = value; }

  get mealType() { return this.#mealType; }
  set mealType(value) { this.#mealType = value; }

  get quantity() { return this.#quantity; }
  set quantity(value) { if (value > 0) this.#quantity = value; }

  get dietaryNote() { return this.#dietaryNote; }
  set dietaryNote(value) { this.#dietaryNote = value; }

  get bookingStatus() { return this.#bookingStatus; }
  set bookingStatus(value) { this.#bookingStatus = value; }

  // Calculate method used to calculate the total based on the structure
  calculateTotal() {
    const baseMealPrice = 12.50; 
    return this.#quantity * baseMealPrice;
  }

  // GetSummary method used to compile and return the summary text
  getSummary() {
    return `
=== Meal Booking Summary ===
Status: [${this.#bookingStatus}]
Student ID: ${this.#studentId}
Name: ${this.#studentName}
Date: ${this.#mealDate}
Meal Type: ${this.#mealType}
Quantity: ${this.#quantity}
Dietary Note: ${this.#dietaryNote}
============================`;
  }
 }

 // Export the class
module.exports = MealBooking;

