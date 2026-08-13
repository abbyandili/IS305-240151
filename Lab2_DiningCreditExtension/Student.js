/*
  Program: Dining Meal Booking Feature - Student Module
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
  Description: Student class demonstrating private fields, accessors with 
               validation, and display methods.
*/

class Student {
  // Declare private fields
  #studentId;
  #firstName;
  #lastName;

constructor(studentId, firstName, lastName) {
    // Leverage setters to apply validation during instantiation
    this.studentId = studentId;
    this.firstName = firstName;
    this.lastName = lastName;
}
}

// --- Getters & Setters ---
  
  get studentId() {
    return this.#studentId;
  }

  set studentId(value) {
    if (!value || value.trim() === "") {
      throw new Error("Validation Error: Student ID cannot be empty.");
    }
    this.#studentId = value.trim();
  }

  get firstName() {
    return this.#firstName;
  }

  set firstName(value) {
    if (!value || value.trim() === "") {
      throw new Error("Validation Error: First name cannot be empty.");
    }
    this.#firstName = value.trim();
  }

  get lastName() {
    return this.#lastName;
  }

  set lastName(value) {
    if (!value || value.trim() === "") {
      throw new Error("Validation Error: Last name cannot be empty.");
    }
    this.#lastName = value.trim();
  }
