'use strict';

const { ServiceRequest } = require('./ServiceRequest');
const { clean } = require('./validation');

/** Request to repair or inspect buildings, rooms and equipment. */
class MaintenanceRequest extends ServiceRequest {
  static CATEGORY = 'Facilities Maintenance';
  static HAZARD_LEVELS = ['None', 'Low', 'Medium', 'High'];

  static #HAZARD_SCORE = { None: 0, Low: 5, Medium: 15, High: 30 };
  static #BASE_HOURS = { Urgent: 8, High: 24, Normal: 72, Low: 120 };
  static #HAZARD_HOURS_CAP = { None: Infinity, Low: Infinity, Medium: 24, High: 8 };

  #building;
  #roomNumber;
  #hazardLevel;
  #equipmentAffected;

  constructor(commonRequestData, specialisedData = {}) {
    super({ ...commonRequestData, category: MaintenanceRequest.CATEGORY });
    this.#building = clean(specialisedData.building);
    this.#roomNumber = clean(specialisedData.roomNumber);
    this.#hazardLevel = clean(specialisedData.hazardLevel) || 'None';
    this.#equipmentAffected = clean(specialisedData.equipmentAffected);
    this.validateSpecialisedFields();
  }

  get building() { return this.#building; }
  get roomNumber() { return this.#roomNumber; }
  get hazardLevel() { return this.#hazardLevel; }
  get equipmentAffected() { return this.#equipmentAffected; }

  validateSpecialisedFields() {
    const problems = [];
    if (!this.#building) problems.push('Building is required.');
    if (!this.#roomNumber) problems.push('Room number is required.');
    if (!MaintenanceRequest.HAZARD_LEVELS.includes(this.#hazardLevel)) {
      problems.push(`Hazard level must be one of: ${MaintenanceRequest.HAZARD_LEVELS.join(', ')}.`);
    }
    if (!this.#equipmentAffected) problems.push('Equipment affected is required.');
    if (problems.length > 0) throw new Error(problems.join(' '));
    return true;
  }

  calculatePriorityScore() {
    return ServiceRequest.PRIORITY_WEIGHTS[this.priority] + MaintenanceRequest.#HAZARD_SCORE[this.#hazardLevel];
  }

  getTargetResolutionHours() {
    return Math.min(
      MaintenanceRequest.#BASE_HOURS[this.priority],
      MaintenanceRequest.#HAZARD_HOURS_CAP[this.#hazardLevel]
    );
  }

  getRequestSummary() {
    return [
      super.getRequestSummary(),
      'Request Type      : Maintenance Request',
      `Building          : ${this.#building}`,
      `Room Number       : ${this.#roomNumber}`,
      `Hazard Level      : ${this.#hazardLevel}`,
      `Equipment Affected: ${this.#equipmentAffected}`,
      `Priority Score    : ${this.calculatePriorityScore()}`,
      `Target Resolution : ${this.getTargetResolutionHours()} hours`
    ].join('\n');
  }
}

module.exports = { MaintenanceRequest };
