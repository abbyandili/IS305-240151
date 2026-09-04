/*
  Program: Dining Meal Booking Feature - MealBooking Class
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
*/

const Student = require('./Student.js');
const DiningAccount = require('./DiningAccount.js');

class MealBooking {
  #student;
  #mealDate;
  #mealType;
  #quantity;
  #dietaryNote;
  #bookingStatus;
  #isPaid;

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
    this.#isPaid = false;

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
  get isPaid() { return this.#isPaid; }

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

  // Task 4: Polymorphic Payment Processing
  processPayment(diningAccount) {
    if (!diningAccount || !(diningAccount instanceof DiningAccount)) {
      console.log("[PAYMENT ERROR]: Invalid dining account provided.");
      return false;
    }

    if (this.#isPaid || this.#bookingStatus === "Confirmed") {
      console.log(`[PAYMENT ERROR]: Booking for ${this.#mealType} on ${this.#mealDate} is already paid and confirmed.`);
      return false;
    }

    const totalCost = this.calculateTotal();
    const paymentSuccess = diningAccount.payForMeal(
      totalCost,
      `${this.#mealType} booking (${this.#quantity}x)`
    );

    if (paymentSuccess) {
      this.#isPaid = true;
      this.confirmBooking();
      console.log(`[PAYMENT SUCCESS]: Charge of K${totalCost.toFixed(2)} accepted for ${this.#student.getFullName()}.`);
      return true;
    } else {
      this.#bookingStatus = "Pending";
      console.log(`[PAYMENT FAILED]: Booking status remains Pending.`);
      return false;
    }
  }

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
Payment Status: ${this.#isPaid ? "Paid" : "Unpaid"}
Total cost: K${this.calculateTotal().toFixed(2)}
========================================`;
  }
}

module.exports = MealBooking;