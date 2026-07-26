const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
// Import the MealBooking class
const MealBooking = require('./MealBooking.js');

// Runtime in-memory persistence array
const bookingsDatabase = [];

// Create a new MealBooking object instance
const sampleBooking = new MealBooking(
  "STU98765",
  "Alex Morgan",
  "2026-07-20",
  "Dinner (Premium Buffet)",
  3,
  "Gluten-Free preference"
);

// Display initial state summary and calculated total
console.log(sampleBooking.getSummary());
console.log(`Calculated Total: $${sampleBooking.calculateTotal().toFixed(2)}`);

// Safely modify states using setters to show dynamic capabilities
sampleBooking.bookingStatus = "Confirmed";
sampleBooking.quantity = 4; // Update quantity

console.log("\n...Updating Booking Details...");

// Re-display updated state summary and new total
console.log(sampleBooking.getSummary());
console.log(`Updated Calculated Total: $${sampleBooking.calculateTotal().toFixed(2)}`)