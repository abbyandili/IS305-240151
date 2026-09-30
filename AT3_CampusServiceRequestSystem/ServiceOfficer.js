'use strict';

const { User } = require('./User');
const { clean } = require('./validation');

/** Reviews requests, sets priority, assigns Technicians and closes resolved requests. */
class ServiceOfficer extends User {
  #serviceSection;

  constructor(userId, firstName, lastName, email, serviceSection) {
    super(userId, firstName, lastName, email, 'Service Officer');
    this.#serviceSection = clean(serviceSection);
    this.validateSpecialisedFields();
  }

  get serviceSection() { return this.#serviceSection; }

  validateSpecialisedFields() {
    if (!this.#serviceSection) throw new Error('Service section is required.');
    return true;
  }

  displayInfo() {
    return `${super.displayInfo()} | Section: ${this.#serviceSection}`;
  }
}

module.exports = { ServiceOfficer };
