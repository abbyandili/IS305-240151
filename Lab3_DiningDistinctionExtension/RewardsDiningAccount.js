/*
  Program: Dining Meal Booking Feature - RewardsDiningAccount Class
  Student Name: Abigail ANDILI
  Student ID: 240151
  Date: 14 August 2026
*/

const DiningAccount = require('./DiningAccount.js');

class RewardsDiningAccount extends DiningAccount {
  #rewardRate;

  constructor(accountNumber, openingBalance = 0, rewardRate = 0) {
    super(accountNumber, openingBalance);

    const numericRate = Number(rewardRate);
    if (isNaN(numericRate) || numericRate < 0) {
      throw new Error("Validation Error: Reward rate cannot be negative.");
    }
    this.#rewardRate = numericRate;
  }

  get rewardRate() {
    return this.#rewardRate;
  }

  calculateReward() {
    const currentBalance = this.getBalance();
    return (currentBalance * this.#rewardRate) / 100;
  }

  applyReward() {
    const rewardEarned = this.calculateReward();
    if (rewardEarned > 0) {
      this.deposit(rewardEarned, `Reward payout (${this.#rewardRate}%)`);
    }
    return rewardEarned;
  }
}

module.exports = RewardsDiningAccount;