'use strict';

const { User } = require('./User');
const { clean } = require('./validation');

/** A staff member who submits service requests. */
class StaffRequester extends User {
  #department;

  constructor(userId, firstName, lastName, email, department) {
    super(userId, firstName, lastName, email, 'Staff');
    this.#department = clean(department);
    this.validateSpecialisedFields();
  }

  get department() { return this.#department; }

  validateSpecialisedFields() {
    if (!this.#department) throw new Error('Department is required.');
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()} | Department: ${this.#department}`;
  }
}

module.exports = { StaffRequester };
