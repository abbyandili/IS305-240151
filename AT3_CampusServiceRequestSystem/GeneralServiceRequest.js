'use strict';

const { ServiceRequest } = require('./ServiceRequest');
const { clean } = require('./validation');

/** Any other campus service request. Gives the General category a concrete class. */
class GeneralServiceRequest extends ServiceRequest {
  static CATEGORY = 'General Campus Service';

  static #BASE_HOURS = { Urgent: 8, High: 24, Normal: 48, Low: 96 };

  #serviceType;
  #expectedOutcome;

  constructor(commonRequestData, specialisedData = {}) {
    super({ ...commonRequestData, category: clean(commonRequestData?.category) || GeneralServiceRequest.CATEGORY });
    this.#serviceType = clean(specialisedData.serviceType);
    this.#expectedOutcome = clean(specialisedData.expectedOutcome);
    this.validateSpecialisedFields();
  }

  get serviceType() { return this.#serviceType; }
  get expectedOutcome() { return this.#expectedOutcome; }

  validateSpecialisedFields() {
    const problems = [];
    if (this.category !== GeneralServiceRequest.CATEGORY) {
      problems.push(`A general service request must use the category "${GeneralServiceRequest.CATEGORY}".`);
    }
    if (!this.#serviceType) problems.push('Service type is required.');
    if (!this.#expectedOutcome) problems.push('Expected outcome is required.');
    if (problems.length > 0) throw new Error(problems.join(' '));
    return true;
  }

  calculatePriorityScore() {
    return ServiceRequest.PRIORITY_WEIGHTS[this.priority];
  }

  getTargetResolutionHours() {
    return GeneralServiceRequest.#BASE_HOURS[this.priority];
  }

  getRequestSummary() {
    return [
      this.getCommonSummary(),
      'Request Type      : General Service Request',
      `Service Type      : ${this.#serviceType}`,
      `Expected Outcome  : ${this.#expectedOutcome}`,
      `Priority Score    : ${this.calculatePriorityScore()}`,
      `Target Resolution : ${this.getTargetResolutionHours()} hours`
    ].join('\n');
  }

  toData() {
    return {
      ...super.toData(),
      details: {
        serviceType: this.#serviceType,
        expectedOutcome: this.#expectedOutcome
      }
    };
  }
}

module.exports = { GeneralServiceRequest };
