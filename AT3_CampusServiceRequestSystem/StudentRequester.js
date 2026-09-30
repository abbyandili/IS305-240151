'use strict';

const { User } = require('./User');
const { clean } = require('./validation');

/** A student who submits service requests. Extends User (inheritance). */
class StudentRequester extends User {
  #programme;
  #yearLevel;

  constructor(userId, firstName, lastName, email, programme, yearLevel) {
    super(userId, firstName, lastName, email, 'Student'); // constructor chaining
    this.#programme = clean(programme);
    this.#yearLevel = Number(yearLevel);
    this.validateSpecialisedFields();
  }

  get programme() { return this.#programme; }
  get yearLevel() { return this.#yearLevel; }

  validateSpecialisedFields() {
    const problems = [];
    if (!this.#programme) problems.push('Programme is required.');
    if (!Number.isInteger(this.#yearLevel) || this.#yearLevel < 1 || this.#yearLevel > 6) {
      problems.push('Year level must be a whole number from 1 to 6.');
    }
    if (problems.length > 0) throw new Error(problems.join(' '));
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()} | Programme: ${this.#programme} | Year: ${this.#yearLevel}`;
  }
}

module.exports = { StudentRequester };
