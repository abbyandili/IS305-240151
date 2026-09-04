/*
  Program: Dining Meal Booking Feature - Student Class
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
*/

const DiningAccount = require('./DiningAccount.js');

class Student {
  #studentId;
  #firstName;
  #lastName;
  #diningAccount;

  constructor(studentId, firstName, lastName) {
    this.studentId = studentId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.#diningAccount = null;
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

  get diningAccount() {
    return this.#diningAccount;
  }

  // Account Assignment Task 3
  assignDiningAccount(account) {
    if (!(account instanceof DiningAccount)) {
      throw new Error("Type Error: Assigned object must be a valid DiningAccount or descendant subclass.");
    }
    this.#diningAccount = account;
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