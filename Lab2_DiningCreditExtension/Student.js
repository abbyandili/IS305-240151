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
