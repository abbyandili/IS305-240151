/*
  Program: Dining Meal Booking Feature (Lab 2 Main Application)
  Student Name: Abigail Andili
  Student ID: 240151
  Date: 13 August 2026
  Description: Complete application orchestrating Student setup, automated unit tests,
               dynamic state mutations, and interactive meal booking inputs.
*/

const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const Student = require('./Student.js');
const MealBooking = require('./MealBooking.js');

// Runtime in-memory persistence array
const bookingsDatabase = [];

// Helper function to check for duplicates
function isDuplicateBooking(studentId, mealDate, mealType) {
  if (!studentId || !mealDate || !mealType) return false;

  return bookingsDatabase.some(booking => 
    booking.studentId.toLowerCase() === studentId.trim().toLowerCase() &&
    booking.mealDate === mealDate.trim() &&
    booking.mealType.toLowerCase() === mealType.trim().toLowerCase()
  );
}

// Task 1: Interactive Student Registration
async function runStudentSetup() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("\n========================================");
    console.log("       DWU STUDENT REGISTRATION");
    console.log("========================================");

    const idInput = await rl.question("Enter Student ID: ");
    const firstNameInput = await rl.question("Enter First Name: ");
    const lastNameInput = await rl.question("Enter Last Name: ");

    // Instantiates Student object (triggers setters and validation)
    const currentStudent = new Student(idInput, firstNameInput, lastNameInput);

    console.log(currentStudent.displayInfo());
    return currentStudent;

  } catch (error) {
    console.log(`\n[ERROR]: ${error.message}`);
    return null;
  } finally {
    rl.close();
  }
}

// Task 2: Interactive Meal Booking Registration
async function runInteractiveBooking() {
  const rl = readline.createInterface({ input, output });
  
  console.log("\n========================================");
  console.log("       DWU DINING MEAL BOOKING");
  console.log("========================================");

  try {
    const studentId = await rl.question("Student ID: ");
    const studentName = await rl.question("Student name: ");
    const mealDate = await rl.question("Meal date (YYYY-MM-DD): ");
    const mealType = await rl.question("Meal type (Breakfast/Lunch/Dinner): ");
    const quantityStr = await rl.question("Quantity: ");
    const dietaryNote = await rl.question("Dietary note: ");

    // Duplicate Check prior to instantiating
    if (isDuplicateBooking(studentId, mealDate, mealType)) {
      throw new Error(`Duplicate Error: A booking for Student ${studentId} on ${mealDate} for ${mealType} already exists.`);
    }

    // Instantiation (Triggers internal validation)
    const newBooking = new MealBooking(
      studentId, 
      studentName, 
      mealDate, 
      mealType, 
      parseInt(quantityStr, 10), 
      dietaryNote
    );

    // Save item in database array
    bookingsDatabase.push(newBooking);

    console.log("\n========================================");
    console.log("          BOOKING CREATED");
    console.log("========================================");
    console.log(newBooking.getSummary());

  } catch (error) {
    console.log(`\n[ERROR]: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Automated Execution Testing Engine
function runRequiredTests() {
  console.log("\n--- EXECUTING AUTOMATED REQUIREMENT TEST SUITE ---");

  // TEST 1: Valid Booking Demonstration
  console.log("\n[TEST 1] Creating a completely valid booking...");
  try {
    const booking1 = new MealBooking("DWU2026001", "Maria Kila", "2026-07-18", "Lunch", 2, "No peanuts");
    bookingsDatabase.push(booking1);
    console.log("Result: Success!");
    console.log(booking1.getSummary());
  } catch (e) {
    console.log(`Result: Failed unexpectedly -> ${e.message}`);
  }

  // TEST 2: Invalid Booking Demonstration
  console.log("\n[TEST 2] Attempting to create an invalid booking (Missing Student Name & Bad Meal Type)...");
  try {
    const booking2 = new MealBooking("DWU2026002", "", "2026-07-18", "MidnightSnack", 0, "None");
    bookingsDatabase.push(booking2);
  } catch (e) {
    console.log(`Result: Caught anticipated validation crash -> "${e.message}"`);
  }

  // TEST 3: Duplicate Booking Prevention
  console.log("\n[TEST 3] Testing duplicate protection against Maria Kila's initial lunch configuration...");
  const targetId = "DWU2026001";
  const targetDate = "2026-07-18";
  const targetType = "Lunch";

  if (isDuplicateBooking(targetId, targetDate, targetType)) {
    console.log(`Result: Success! Blocked duplicate profile match entry dynamically for [${targetId}, ${targetDate}, ${targetType}].`);
  } else {
    console.log("Result: Failure. Duplicate element allowed inside data system context window.");
  }
  
  console.log("\n--- TEST SUITE COMPLETE ---\n");
}

// Single Instance Setter & Getter Demonstration
function runSampleBookingDemo() {
  console.log("\n--- DEMONSTRATING SETTERS & DYNAMIC STATE UPDATES ---");
  try {
    const sampleBooking = new MealBooking(
      "STU98765",
      "Alex Morgan",
      "2026-07-20",
      "Dinner",
      3,
      "Gluten-Free preference"
    );

    console.log(sampleBooking.getSummary());
    console.log(`Calculated Total: K${sampleBooking.calculateTotal().toFixed(2)}`);

    // Modify state using setters
    sampleBooking.bookingStatus = "Confirmed";
    sampleBooking.quantity = 4;

    console.log("\n...Updating Booking Details...");
    console.log(sampleBooking.getSummary());
    console.log(`Updated Calculated Total: K${sampleBooking.calculateTotal().toFixed(2)}`);
  } catch (e) {
    console.log(`Demo Failed -> ${e.message}`);
  }
}

// Orchestrator initialization block
async function main() {
  // 1. Run Lab 2 Student Setup first
  await runStudentSetup();

  // 2. Run automated verification test suite
  runRequiredTests();

  // 3. Demonstrate property mutators and calculation updates
  runSampleBookingDemo();

  // 4. Launch interactive meal booking console menu
  await runInteractiveBooking();
}

// Execute complete program flow
main();