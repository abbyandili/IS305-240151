'use strict';

const { User } = require('./User');
const { clean } = require('./validation');

/** Carries out the work on assigned requests. */
class Technician extends User {
  #technicalSpeciality;

  constructor(userId, firstName, lastName, email, technicalSpeciality) {
    super(userId, firstName, lastName, email, 'Technician');
    this.#technicalSpeciality = clean(technicalSpeciality);
    this.validateSpecialisedFields();
  }

  get technicalSpeciality() { return this.#technicalSpeciality; }

  validateSpecialisedFields() {
    if (!this.#technicalSpeciality) throw new Error('Technical speciality is required.');
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()} | Speciality: ${this.#technicalSpeciality}`;
  }
}

module.exports = { Technician };
