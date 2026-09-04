/*
  Program: DWU Dining Application - Lab 3 Driver
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
*/

const Student = require('./Student.js');
const MealBooking = require('./MealBooking.js');
const DiningAccount = require('./DiningAccount.js');
const RewardsDiningAccount = require('./RewardsDiningAccount.js');
const CreditDiningAccount = require('./CreditDiningAccount.js');

function runPart1Demonstrations() {
  console.log("========================================");
  console.log("       STANDARD DINING ACCOUNT");
  console.log("========================================");
  const stdAccount = new DiningAccount("DA001", 1000.00);
  console.log(`Account Number: ${stdAccount.accountNumber}`);
  console.log(`Opening Balance: K1000.00`);
  
  stdAccount.deposit(500.00, "Weekly allowance");
  console.log(`Deposit: K500.00`);

  const payment1 = stdAccount.payForMeal(200.00, "Meal payment");
  console.log(`Meal Payment: K200.00`);
  console.log(`Payment Status: ${payment1 ? "Successful" : "Failed"}`);
  console.log(`Final Balance: K${stdAccount.getBalance().toFixed(2)}`);

  console.log("\n========================================");
  console.log("        REWARDS DINING ACCOUNT");
  console.log("========================================");
  const rewardsAccount = new RewardsDiningAccount("RA001", 1500.00, 2.5);
  rewardsAccount.deposit(500.00, "Deposit funds");
  
  console.log(`Account Number: ${rewardsAccount.accountNumber}`);
  console.log(`Balance Before Reward: K${rewardsAccount.getBalance().toFixed(2)}`);
  console.log(`Reward Rate: ${rewardsAccount.rewardRate}%`);
  
  const rewardEarned = rewardsAccount.calculateReward();
  console.log(`Reward Earned: K${rewardEarned.toFixed(2)}`);
  
  rewardsAccount.applyReward();
  console.log(`Final Balance: K${rewardsAccount.getBalance().toFixed(2)}`);
  console.log("========================================\n");
}

function runPart2Demonstrations() {
  console.log("\n========================================");
  console.log("   PART 2: CREDIT, POLYMORPHISM & PAYMENTS");
  console.log("========================================");

  // 1. Credit Account Test
  console.log("\n--- Credit Dining Account Tests ---");
  const creditAccount = new CreditDiningAccount("CA001", 1000.00, 500.00);
  console.log(`Created Credit Account: Balance = K1000.00, Limit = K500.00`);
  
  console.log("Attempting payment of K1500.00...");
  creditAccount.payForMeal(1500.00, "Catering service");
  console.log(`Resulting Balance: K${creditAccount.getBalance().toFixed(2)}`);

  console.log("Attempting payment of K100.00 (exceeds total limit)...");
  creditAccount.payForMeal(100.00, "Extra snack");

  // 2. Polymorphic Processing
  console.log("\n--- Demonstrating Polymorphism ---");
  const diningAccounts = [
    new DiningAccount("DA002", 300.00),
    new RewardsDiningAccount("RA002", 500.00, 3.0),
    new CreditDiningAccount("CA002", 200.00, 400.00)
  ];

  for (const account of diningAccounts) {
    console.log("----------------------------------------");
    account.displayAccountSummary();
  }

  // 3. Complete Integration: Student, Booking, and Account
  console.log("\n========================================");
  console.log("          STUDENT DINING ACCOUNT");
  console.log("========================================");
  const student = new Student("DWU2026001", "Maria", "Kila");
  const studentAccount = new RewardsDiningAccount("RA001", 100.00, 2.5);
  student.assignDiningAccount(studentAccount);

  console.log(`Student: ${student.getFullName()}`);
  console.log(`Student ID: ${student.studentId}`);
  console.log(`Account Type: ${student.diningAccount.constructor.name}`);
  console.log(`Account Number: ${student.diningAccount.accountNumber}`);
  console.log(`Opening Balance: K${student.diningAccount.getBalance().toFixed(2)}`);

  // Create Booking and Process Payment
  const booking = new MealBooking(student, "15 August 2026", "Dinner", 2, "No seafood");
  
  console.log("\n========================================");
  console.log("             MEAL BOOKING");
  console.log("========================================");
  console.log(`Meal: ${booking.mealType}`);
  console.log(`Quantity: ${booking.quantity}`);
  console.log(`Total Cost: K${booking.calculateTotal().toFixed(2)}`);

  const paymentSuccess = booking.processPayment(student.diningAccount);

  console.log(`Payment Status: ${paymentSuccess ? "Successful" : "Failed"}`);
  console.log(`Booking Status: ${booking.bookingStatus}`);
  console.log(`Remaining Balance: K${student.diningAccount.getBalance().toFixed(2)}`);

  // Attempt Duplicate Payment
  console.log("\n--- Testing Duplicate Payment Prevention ---");
  booking.processPayment(student.diningAccount);

  // 4. Display Transaction History
  console.log("\n========================================");
  console.log("          TRANSACTION HISTORY");
  console.log("========================================");
  const transactions = student.diningAccount.getTransactions();
  transactions.forEach((tx, index) => {
    console.log(`${index + 1}. ${tx.type} - K${tx.amount.toFixed(2)}`);
    console.log(`   Description: ${tx.description}`);
    console.log(`   Balance: K${tx.balanceAfter.toFixed(2)}`);
  });
  console.log(`\nTotal Transactions: ${transactions.length}`);
  console.log("========================================");
}

function main() {
  runPart1Demonstrations();
  runPart2Demonstrations();
}

main();