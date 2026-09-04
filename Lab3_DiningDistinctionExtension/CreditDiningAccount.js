/*
  Program: Dining Meal Booking Feature - CreditDiningAccount Class
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
*/

const DiningAccount = require('./DiningAccount.js');

class CreditDiningAccount extends DiningAccount {
  #creditLimit;

  constructor(accountNumber, openingBalance = 0, creditLimit = 0) {
    super(accountNumber, openingBalance);

    const numericLimit = Number(creditLimit);
    if (isNaN(numericLimit) || numericLimit < 0) {
      throw new Error("Validation Error: Credit limit cannot be negative.");
    }
    this.#creditLimit = numericLimit;
  }

  get creditLimit() {
    return this.#creditLimit;
  }

  // Overridden payForMeal method to handle credit limit functionality
  payForMeal(amount, description = "Meal payment") {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.log("[PAYMENT REJECTED]: Invalid meal payment amount.");
      return false;
    }

    const currentBalance = this.getBalance();
    const availableCredit = currentBalance + this.#creditLimit;

    if (availableCredit >= numericAmount) {
      const newBalance = currentBalance - numericAmount;
      this._setBalance(newBalance);
      this._recordTransaction("Meal Payment (Credit)", numericAmount, description);
      return true;
    } else {
      console.log(`[PAYMENT REJECTED]: Credit limit exceeded on account ${this.accountNumber}. Required: K${numericAmount.toFixed(2)}, Maximum Available (Balance + Credit): K${availableCredit.toFixed(2)}.`);
      return false;
    }
  }
}

module.exports = CreditDiningAccount;