'use strict';

const { ServiceRequest } = require('./ServiceRequest');
const { clean } = require('./validation');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour HH:MM

/** Request for cleaning, sanitation or waste removal. */
class CleaningRequest extends ServiceRequest {
  static CATEGORY = 'Cleaning and Sanitation';
  static HYGIENE_RISKS = ['Low', 'Medium', 'High'];
  static SERVICE_TYPES = ['Routine Clean', 'Deep Clean', 'Spill Response', 'Waste Removal'];

  static #HYGIENE_SCORE = { Low: 0, Medium: 10, High: 20 };
  static #BASE_HOURS = { Urgent: 2, High: 6, Normal: 12, Low: 24 };
  static #HYGIENE_HOURS_CAP = { Low: Infinity, Medium: Infinity, High: 4 };

  #cleaningArea;
  #hygieneRisk;
  #serviceType;
  #preferredServiceTime;

  constructor(commonRequestData, specialisedData = {}) {
    super({ ...commonRequestData, category: CleaningRequest.CATEGORY });
    this.#cleaningArea = clean(specialisedData.cleaningArea);
    this.#hygieneRisk = clean(specialisedData.hygieneRisk) || 'Low';
    this.#serviceType = clean(specialisedData.serviceType);
    this.#preferredServiceTime = clean(specialisedData.preferredServiceTime);
    this.validateSpecialisedFields();
  }

  get cleaningArea() { return this.#cleaningArea; }
  get hygieneRisk() { return this.#hygieneRisk; }
  get serviceType() { return this.#serviceType; }
  get preferredServiceTime() { return this.#preferredServiceTime; }

  validateSpecialisedFields() {
    const problems = [];
    if (!this.#cleaningArea) problems.push('Cleaning area is required.');
    if (!CleaningRequest.HYGIENE_RISKS.includes(this.#hygieneRisk)) {
      problems.push(`Hygiene risk must be one of: ${CleaningRequest.HYGIENE_RISKS.join(', ')}.`);
    }
    if (!CleaningRequest.SERVICE_TYPES.includes(this.#serviceType)) {
      problems.push(`Service type must be one of: ${CleaningRequest.SERVICE_TYPES.join(', ')}.`);
    }
    if (!TIME_PATTERN.test(this.#preferredServiceTime)) {
      problems.push('Preferred service time must be a 24-hour time such as 14:30.');
    }
    if (problems.length > 0) throw new Error(problems.join(' '));
    return true;
  }

  calculatePriorityScore() {
    return ServiceRequest.PRIORITY_WEIGHTS[this.priority] + CleaningRequest.#HYGIENE_SCORE[this.#hygieneRisk];
  }

  getTargetResolutionHours() {
    return Math.min(
      CleaningRequest.#BASE_HOURS[this.priority],
      CleaningRequest.#HYGIENE_HOURS_CAP[this.#hygieneRisk]
    );
  }

  getRequestSummary() {
    return [
      super.getRequestSummary(),
      'Request Type      : Cleaning Request',
      `Cleaning Area     : ${this.#cleaningArea}`,
      `Hygiene Risk      : ${this.#hygieneRisk}`,
      `Service Type      : ${this.#serviceType}`,
      `Preferred Time    : ${this.#preferredServiceTime}`,
      `Priority Score    : ${this.calculatePriorityScore()}`,
      `Target Resolution : ${this.getTargetResolutionHours()} hours`
    ].join('\n');
  }
}

module.exports = { CleaningRequest };
