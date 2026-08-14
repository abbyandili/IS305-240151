/*
  Program: Dining Meal Booking Feature - Student Class
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
  Description: Class holding student identity details with accessors and validation.
*/

class Student {
  #studentId;
  #firstName;
  #lastName;

  constructor(studentId, firstName, lastName) {
    this.studentId = studentId;
    this.firstName = firstName;
    this.lastName = lastName;
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

  // --- Methods ---

  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  displayInfo() {
    return `========================================
          STUDENT INFORMATION
========================================
Student ID: ${this.#studentId}
Student Name: ${this.getFullName()}`;
  }
}

module.exports = Student;