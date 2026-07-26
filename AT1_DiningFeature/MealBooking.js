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

  // Meal Price structure according to standard university dining baselines
  static MEAL_PRICES = {
    "Breakfast": 10.00,
    "Lunch": 15.00,
    "Dinner": 20.00
  };



  // Constructor receiving booking info
  constructor(studentId, studentName, mealDate, mealType, quantity, dietaryNote) {
    this.#studentId = studentId;
    this.#studentName = studentName;
    this.#mealDate = mealDate;
    this.#mealType = mealType; // Fixed: Added this missing assignment
    this.#quantity = quantity;
    this.#dietaryNote = dietaryNote;
    this.#bookingStatus = "Pending"; // Default status
 

 // Automatically trigger validation upon instantiation
    this.validate();
  }

  // Validation Method
  validate() {
    if (!this.#studentId) {
      throw new Error("Validation Error: Student ID cannot be missing or empty.");
    }
    if (!this.#studentName) {
      throw new Error("Validation Error: Student Name cannot be missing or empty.");
    }
    if (!this.#mealDate) {
      throw new Error("Validation Error: Meal Date cannot be missing or empty.");
    }
    if (!["Breakfast", "Lunch", "Dinner"].includes(this.#mealType)) {
      throw new Error("Validation Error: Invalid meal type. Must be Breakfast, Lunch, or Dinner.");
    }
    if (isNaN(this.#quantity) || this.#quantity < 1) {
      throw new Error("Validation Error: Quantity must be at least 1.");
    }
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

  // State Management Methods
  confirmBooking() {
    this.#bookingStatus = "Confirmed";
  }

  cancelBooking() {
    this.#bookingStatus = "Cancelled";
  }
  // Calculate method used to calculate the total based on the structure
 calculateTotal() {
    const pricePerMeal = MealBooking.MEAL_PRICES[this.#mealType] || 0;
    return pricePerMeal * this.#quantity;
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

