'use strict';

const { ServiceRequest } = require('./ServiceRequest');
const { clean } = require('./validation');

/** Request for ICT help: devices, systems, Wi-Fi and network faults. */
class ICTSupportRequest extends ServiceRequest {
  static CATEGORY = 'ICT Support';
  static NETWORK_IMPACTS = ['None', 'Single User', 'Department', 'Campus-wide'];

  static #IMPACT_SCORE = { None: 0, 'Single User': 5, Department: 15, 'Campus-wide': 25 };
  static #BASE_HOURS = { Urgent: 4, High: 8, Normal: 24, Low: 72 };
  static #IMPACT_HOURS_CAP = { None: Infinity, 'Single User': Infinity, Department: 8, 'Campus-wide': 4 };

  #deviceType;
  #systemName;
  #faultType;
  #networkImpact;

  constructor(commonRequestData, specialisedData = {}) {
    super({ ...commonRequestData, category: ICTSupportRequest.CATEGORY }); // constructor chaining
    this.#deviceType = clean(specialisedData.deviceType);
    this.#systemName = clean(specialisedData.systemName);
    this.#faultType = clean(specialisedData.faultType);
    this.#networkImpact = clean(specialisedData.networkImpact) || 'None';
    this.validateSpecialisedFields();
  }

  get deviceType() { return this.#deviceType; }
  get systemName() { return this.#systemName; }
  get faultType() { return this.#faultType; }
  get networkImpact() { return this.#networkImpact; }

  // ---- overridden methods ----

  validateSpecialisedFields() {
    const problems = [];
    if (!this.#deviceType) problems.push('Device type is required.');
    if (!this.#systemName) problems.push('System name is required.');
    if (!this.#faultType) problems.push('Fault type is required.');
    if (!ICTSupportRequest.NETWORK_IMPACTS.includes(this.#networkImpact)) {
      problems.push(`Network impact must be one of: ${ICTSupportRequest.NETWORK_IMPACTS.join(', ')}.`);
    }
    if (problems.length > 0) throw new Error(problems.join(' '));
    return true;
  }

  calculatePriorityScore() {
    return ServiceRequest.PRIORITY_WEIGHTS[this.priority] + ICTSupportRequest.#IMPACT_SCORE[this.#networkImpact];
  }

  getTargetResolutionHours() {
    return Math.min(
      ICTSupportRequest.#BASE_HOURS[this.priority],
      ICTSupportRequest.#IMPACT_HOURS_CAP[this.#networkImpact]
    );
  }

  getRequestSummary() {
    return [
      super.getRequestSummary(),
      'Request Type      : ICT Support Request',
      `Device Type       : ${this.#deviceType}`,
      `System Name       : ${this.#systemName}`,
      `Fault Type        : ${this.#faultType}`,
      `Network Impact    : ${this.#networkImpact}`,
      `Priority Score    : ${this.calculatePriorityScore()}`,
      `Target Resolution : ${this.getTargetResolutionHours()} hours`
    ].join('\n');
  }
}

module.exports = { ICTSupportRequest };
