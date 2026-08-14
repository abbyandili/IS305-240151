/*
  Program: Dining Meal Booking Feature - MealBooking Class
  Student Name: Your Name
  Student ID: Your Student ID
  Date: 14 August 2026
  Description: Refactored MealBooking class accepting a Student object reference.
*/

const Student = require('./Student.js');

class MealBooking {
  #student; // Stores reference to Student object
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;

  static MEAL_PRICES = {
    "Breakfast": 10.00,
    "Lunch": 15.00,
    "Dinner": 20.00
  };

  constructor(student, mealDate, mealType, quantity, dietaryNote = "None") {
    this.#student = student;
    this.#mealDate = mealDate?.trim();
    this.#mealType = mealType?.trim();
    this.#quantity = parseInt(quantity, 10);
    this.#dietaryNote = dietaryNote?.trim() || "None";
    this.#bookingStatus = "Pending";

    this.validate();
  }

  // Validation Routine
  validate() {
    if (!this.#student || !(this.#student instanceof Student)) {
      throw new Error("Validation Error: A valid Student object reference must be provided.");
    }
    if (!this.#mealDate) {
      throw new Error("Validation Error: Meal date cannot be missing or empty.");
    }
    if (!["Breakfast", "Lunch", "Dinner"].includes(this.#mealType)) {
      throw new Error("Validation Error: Invalid meal type. Must be Breakfast, Lunch, or Dinner.");
    }
    if (isNaN(this.#quantity) || this.#quantity < 1) {
      throw new Error("Validation Error: Quantity must be at least 1.");
    }
  }

  // Getters & Setters
  get student() { return this.#student; }
  get mealDate() { return this.#mealDate; }
  get mealType() { return this.#mealType; }
  get quantity() { return this.#quantity; }
  get dietaryNote() { return this.#dietaryNote; }
  get bookingStatus() { return this.#bookingStatus; }

  confirmBooking() {
    this.#bookingStatus = "Confirmed";
  }

  cancelBooking() {
    this.#bookingStatus = "Cancelled";
  }

  calculateTotal() {
    const pricePerMeal = MealBooking.MEAL_PRICES[this.#mealType] || 0;
    return pricePerMeal * this.#quantity;
  }

  // Obtains student identity directly from connected Student object
  getSummary() {
    return `
========================================
            BOOKING RECEIPT
========================================
Student: ${this.#student.getFullName()} (${this.#student.studentId})
Meal: ${this.#mealType} x ${this.#quantity}
Date: ${this.#mealDate}
Dietary note: ${this.#dietaryNote}
Status: ${this.#bookingStatus}
Total cost: K${this.calculateTotal().toFixed(2)}
========================================`;
  }
}

module.exports = MealBooking;
