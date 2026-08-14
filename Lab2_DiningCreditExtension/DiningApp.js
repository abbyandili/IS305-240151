/*
  Program: Dining Meal Booking Feature - Main Application
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
  Description: Console driver featuring object integration, duplicate checking,
               booking history display, and reference mutation demonstrations.
*/

const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const Student = require('./Student.js');
const MealBooking = require('./MealBooking.js');

// Runtime in-memory storage array
const bookingsDatabase = [];

// Check duplicates using connected Student object's ID
function isDuplicateBooking(studentId, mealDate, mealType) {
  if (!studentId || !mealDate || !mealType) return false;

  return bookingsDatabase.some(booking => 
    booking.student.studentId.toLowerCase() === studentId.trim().toLowerCase() &&
    booking.mealDate === mealDate.trim() &&
    booking.mealType.toLowerCase() === mealType.trim().toLowerCase()
  );
}

// Task 3: Student Booking History Function
function displayBookingHistory(student, bookingArray) {
  if (!student || !(student instanceof Student)) {
    console.log("[ERROR]: Invalid Student object passed to displayBookingHistory.");
    return;
  }

  // Filter bookings belonging to this student
  const studentBookings = bookingArray.filter(
    booking => booking.student.studentId === student.studentId
  );

  console.log(student.displayInfo());

  console.log("========================================");
  console.log("            BOOKING HISTORY");
  console.log("========================================");

  if (studentBookings.length === 0) {
    console.log("No bookings found for this student.");
    console.log("========================================");
    return;
  }

  let combinedCost = 0;

  studentBookings.forEach((booking, index) => {
    const cost = booking.calculateTotal();
    combinedCost += cost;

    console.log(`${index + 1}. ${booking.mealType} - ${booking.mealDate}`);
    console.log(`   Quantity: ${booking.quantity}`);
    console.log(`   Status: ${booking.bookingStatus}`);
    console.log(`   Cost: K${cost.toFixed(2)}\n`);
  });

  console.log(`Total Bookings: ${studentBookings.length}`);
  console.log(`Combined Cost: K${combinedCost.toFixed(2)}`);
  console.log("========================================\n");
}

// Automated Test Suite for Credit Requirements
function runRequiredCreditTests() {
  console.log("\n========================================");
  console.log("   RUNNING REQUIRED CREDIT-LEVEL TESTS");
  console.log("========================================");

  // TEST 1: Valid Student Object Creation
  console.log("\n[TEST 1] Valid Student Object Creation...");
  let maria;
  try {
    maria = new Student("DWU2026001", "Maria", "Kila");
    console.log("Result: Success!");
    console.log(maria.displayInfo());
  } catch (e) {
    console.log(`Result: Failed -> ${e.message}`);
  }

  // TEST 2: Invalid Student Information Rejection
  console.log("[TEST 2] Rejecting Invalid Student Info (Empty Name)...");
  try {
    const invalidStudent = new Student("DWU2026002", "", "Kila");
  } catch (e) {
    console.log(`Result: Success! Caught validation error -> "${e.message}"`);
  }

  // TEST 3: Student and Meal Booking Integration
  console.log("\n[TEST 3] Integrating Student object into MealBooking...");
  let booking1, booking2;
  try {
    booking1 = new MealBooking(maria, "12 August 2026", "Lunch", 2, "No peanuts");
    booking1.confirmBooking();
    bookingsDatabase.push(booking1);

    booking2 = new MealBooking(maria, "13 August 2026", "Dinner", 1, "None");
    bookingsDatabase.push(booking2);

    console.log("Result: Success! Receipt pulls student name via object reference:");
    console.log(booking1.getSummary());
  } catch (e) {
    console.log(`Result: Failed -> ${e.message}`);
  }

  // TEST 4: Booking History Display
  console.log("[TEST 4] Displaying Student Booking History...");
  displayBookingHistory(maria, bookingsDatabase);

  // TEST 5: Controlled Student Name Update (Reflected across shared references)
  console.log("[TEST 5] Updating Student's Last Name and Verifying Shared Reference...");
  console.log("Updating Maria's last name from 'Kila' to 'Kila-Vele'...");
  maria.lastName = "Kila-Vele";

  console.log("\nRe-printing Booking Receipt (Shows updated name automatically):");
  console.log(booking1.getSummary());

  console.log("--- TEST SUITE COMPLETE ---\n");
}

// Interactive Task 2 Workflow
async function runInteractiveWorkflow() {
  const rl = readline.createInterface({ input, output });

  console.log("========================================");
  console.log("    INTERACTIVE BOOKING WORKFLOW");
  console.log("========================================");

  try {
    // 1. Collect Student Details & Create Student Object
    console.log("--- Step 1: Student Registration ---");
    const studentId = await rl.question("Student ID: ");
    const firstName = await rl.question("First Name: ");
    const lastName = await rl.question("Last Name: ");

    const studentObj = new Student(studentId, firstName, lastName);

    // 2. Collect Meal Details & Create Connected MealBooking
    console.log("\n--- Step 2: Meal Booking Details ---");
    const mealDate = await rl.question("Meal Date (e.g., 2026-08-15): ");
    const mealType = await rl.question("Meal Type (Breakfast/Lunch/Dinner): ");
    const quantityStr = await rl.question("Quantity: ");
    const dietaryNote = await rl.question("Dietary Note: ");

    if (isDuplicateBooking(studentObj.studentId, mealDate, mealType)) {
      throw new Error(`Duplicate Error: Booking already exists for ${studentObj.studentId} on ${mealDate} for ${mealType}.`);
    }

    const newBooking = new MealBooking(
      studentObj,
      mealDate,
      mealType,
      parseInt(quantityStr, 10),
      dietaryNote
    );

    // 3. Store in array & display integrated output
    bookingsDatabase.push(newBooking);

    console.log("\n========================================");
    console.log("       INTEGRATED BOOKING CREATED");
    console.log("========================================");
    console.log(newBooking.getSummary());

    // 4. Display complete history for the newly created student
    displayBookingHistory(studentObj, bookingsDatabase);

  } catch (error) {
    console.log(`\n[ERROR]: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Program Execution
async function main() {
  // Run credit level tests demonstrating required scenarios
  runRequiredCreditTests();

  // Launch interactive CLI workflow
  await runInteractiveWorkflow();
}

main();