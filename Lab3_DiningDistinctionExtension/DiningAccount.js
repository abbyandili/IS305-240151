/*
  Program: Dining Meal Booking Feature - DiningAccount Base Class
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
*/

class DiningAccount {
  #accountNumber;
  #balance;
  #transactions;

  constructor(accountNumber, openingBalance = 0) {
    if (!accountNumber || String(accountNumber).trim() === "") {
      throw new Error("Validation Error: Account number cannot be empty.");
    }
    if (isNaN(openingBalance) || openingBalance < 0) {
      throw new Error("Validation Error: Opening balance cannot be negative.");
    }

    this.#accountNumber = String(accountNumber).trim();
    this.#balance = Number(openingBalance);
    this.#transactions = [];

    // Record initial transaction if opening balance > 0
    if (this.#balance > 0) {
      this.#recordTransaction("Deposit", this.#balance, "Opening balance");
    }
  }

  get accountNumber() {
    return this.#accountNumber;
  }

  getBalance() {
    return this.#balance;
  }

  // Returns a safe shallow copy of transaction history
  getTransactions() {
    return [...this.#transactions];
  }

  // Protected helper method for subclasses to update balance securely
  _setBalance(newBalance) {
    this.#balance = newBalance;
  }

  // Protected helper to record transactions
  _recordTransaction(type, amount, description) {
    this.#recordTransaction(type, amount, description);
  }

  #recordTransaction(type, amount, description) {
    this.#transactions.push({
      type: type,
      amount: Number(amount),
      description: description,
      date: new Date().toLocaleString(),
      balanceAfter: this.#balance
    });
  }

  // Simulated method overloading using optional/default parameter
  deposit(amount, description = "Standard Deposit") {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.log("[PAYMENT REJECTED]: Deposit amount must be greater than zero.");
      return false;
    }

    this.#balance += numericAmount;
    this.#recordTransaction("Deposit", numericAmount, description);
    return true;
  }

  payForMeal(amount, description = "Meal payment") {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      console.log("[PAYMENT REJECTED]: Invalid meal payment amount.");
      return false;
    }

    if (this.#balance >= numericAmount) {
      this.#balance -= numericAmount;
      this.#recordTransaction("Meal Payment", numericAmount, description);
      return true;
    } else {
      console.log(`[PAYMENT REJECTED]: Insufficient funds in standard account ${this.#accountNumber}. Required: K${numericAmount.toFixed(2)}, Available: K${this.#balance.toFixed(2)}.`);
      return false;
    }
  }

  displayAccountSummary() {
    console.log(`Account Number: ${this.#accountNumber}`);
    console.log(`Account Type: ${this.constructor.name}`);
    console.log(`Current Balance: K${this.#balance.toFixed(2)}`);
  }
}

module.exports = DiningAccount;