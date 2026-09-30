'use strict';

const { User } = require('./User');
const { ServiceOfficer } = require('./ServiceOfficer');
const { Technician } = require('./Technician');
const { HistoryEntry } = require('./HistoryEntry');
const { clean } = require('./validation');

/**
 * ServiceRequest - base class for a campus service request.
 *
 * Credit stage note: calculatePriorityScore(), getTargetResolutionHours(),
 * validateSpecialisedFields() and getRequestSummary() have sensible CONCRETE
 * defaults here, so a specialised subclass genuinely OVERRIDES them rather
 * than just adding new methods. (At Distinction stage these four become
 * abstract-style: the base versions throw instead of returning a default.)
 */
class ServiceRequest {
  static CATEGORIES = [
    'ICT Support',
    'Facilities Maintenance',
    'Cleaning and Sanitation',
    'General Campus Service'
  ];
  static PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
  static STATUSES = ['Submitted', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Cancelled'];
  static UPDATABLE_FIELDS = ['title', 'description', 'location', 'category', 'priority'];
  static PRIORITY_WEIGHTS = Object.freeze({ Low: 10, Normal: 20, High: 30, Urgent: 40 });
  static DEFAULT_TARGET_HOURS = Object.freeze({ Urgent: 24, High: 48, Normal: 96, Low: 168 });

  // The whole workflow in one lookup table: status -> statuses it may move to.
  static TRANSITIONS = Object.freeze({
    Submitted: Object.freeze(['Reviewed', 'Cancelled']),
    Reviewed: Object.freeze(['Assigned']),
    Assigned: Object.freeze(['In Progress']),
    'In Progress': Object.freeze(['Resolved']),
    Resolved: Object.freeze(['Closed']),
    Closed: Object.freeze([]),
    Cancelled: Object.freeze([])
  });

  #requestId;
  #requester;
  #title;
  #description;
  #location;
  #category;
  #priority;
  #status;
  #assignedTechnician = null;
  #dateSubmitted;
  #dateUpdated;
  #history = [];

  /**
   * @param {object} data - { requestId, requester, title, description,
   *                          location, category, priority }
   * Subclasses call super(commonRequestData) (constructor chaining).
   */
  constructor(data = {}) {
    this.#requestId = clean(data.requestId);
    this.#requester = data.requester;
    this.#title = clean(data.title);
    this.#description = clean(data.description);
    this.#location = clean(data.location);
    this.#category = clean(data.category);
    this.#priority = clean(data.priority) || 'Normal';
    this.#status = 'Submitted'; // default status
    this.#dateSubmitted = new Date();
    this.#dateUpdated = new Date(this.#dateSubmitted);
    this.validate();
    this.#history.push(new HistoryEntry({
      previousStatus: 'None',
      newStatus: 'Submitted',
      action: 'Submit Request',
      actorId: this.#requester.userId,
      actorRole: this.#requester.userType,
      comment: 'Request submitted.'
    }));
  }

  // ---- getters ----
  get requestId() { return this.#requestId; }
  get requester() { return this.#requester; }
  get title() { return this.#title; }
  get description() { return this.#description; }
  get location() { return this.#location; }
  get category() { return this.#category; }
  get priority() { return this.#priority; }
  get status() { return this.#status; }
  get assignedTechnician() { return this.#assignedTechnician; }
  get dateSubmitted() { return new Date(this.#dateSubmitted); }
  get dateUpdated() { return new Date(this.#dateUpdated); }

  getHistory() {
    return [...this.#history]; // copy, so callers cannot change the history
  }

  /** Checks a set of field values; returns a list of problems (empty = valid). */
  static #findProblems(fields) {
    const problems = [];
    if (!fields.title) problems.push('Request title is required.');
    if (!fields.description) problems.push('Request description is required.');
    if (!fields.location) problems.push('Campus location is required.');
    if (!ServiceRequest.CATEGORIES.includes(fields.category)) {
      problems.push(`Unsupported category "${fields.category}". Allowed: ${ServiceRequest.CATEGORIES.join(', ')}.`);
    }
    if (!ServiceRequest.PRIORITIES.includes(fields.priority)) {
      problems.push(`Unsupported priority "${fields.priority}". Allowed: ${ServiceRequest.PRIORITIES.join(', ')}.`);
    }
    return problems;
  }

  /** Validates the COMMON fields; throws if invalid, returns true otherwise. */
  validate() {
    const problems = [];
    if (!this.#requestId) problems.push('Request ID is required.');
    if (!(this.#requester instanceof User)) problems.push('A valid requester (User object) is required.');
    problems.push(...ServiceRequest.#findProblems({
      title: this.#title,
      description: this.#description,
      location: this.#location,
      category: this.#category,
      priority: this.#priority
    }));
    if (problems.length > 0) throw new Error(problems.join(' '));
    return true;
  }

  // ------------------------------------------------------------------
  // Methods every subclass is expected to OVERRIDE. Each has a sensible
  // default here so the base class is still usable on its own for the
  // "General Campus Service" category (no specialised class required
  // for that one at Credit stage).
  // ------------------------------------------------------------------

  /** No specialised fields on the base class, so there is nothing extra to check. */
  validateSpecialisedFields() {
    return true;
  }

  /** Default score: just the priority weight. Subclasses add type-specific factors. */
  calculatePriorityScore() {
    return ServiceRequest.PRIORITY_WEIGHTS[this.#priority];
  }

  /** Default target time: a generic table by priority. Subclasses tighten this. */
  getTargetResolutionHours() {
    return ServiceRequest.DEFAULT_TARGET_HOURS[this.#priority];
  }

  getRequestSummary() {
    const technician = this.#assignedTechnician
      ? `${this.#assignedTechnician.getFullName()} (${this.#assignedTechnician.userId})`
      : 'Not assigned';
    return [
      `Request ID : ${this.#requestId}`,
      `Requester  : ${this.#requester.getFullName()} (${this.#requester.userId})`,
      `Title      : ${this.#title}`,
      `Description: ${this.#description}`,
      `Location   : ${this.#location}`,
      `Category   : ${this.#category}`,
      `Priority   : ${this.#priority}`,
      `Status     : ${this.#status}`,
      `Technician : ${technician}`,
      `Submitted  : ${this.#dateSubmitted.toLocaleString()}`,
      `Updated    : ${this.#dateUpdated.toLocaleString()}`
    ].join('\n');
  }

  // ------------------------------------------------------------------
  // Requester actions
  // ------------------------------------------------------------------

  /**
   * Update editable details. All-or-nothing: if any new value is invalid,
   * nothing is changed. Only allowed while status is Submitted.
   * The category cannot change because the category decides the request class.
   */
  updateDetails(changes) {
    const keys = Object.keys(changes || {});
    if (keys.length === 0) throw new Error('No changes were supplied.');

    const unknown = keys.filter((k) => !ServiceRequest.UPDATABLE_FIELDS.includes(k));
    if (unknown.length > 0) throw new Error(`These fields cannot be updated: ${unknown.join(', ')}.`);

    if (this.#status !== 'Submitted') {
      throw new Error(`Only Submitted requests can be updated (current status: ${this.#status}).`);
    }

    const next = {
      title: this.#title,
      description: this.#description,
      location: this.#location,
      category: this.#category,
      priority: this.#priority
    };
    for (const key of keys) next[key] = clean(changes[key]);

    const problems = ServiceRequest.#findProblems(next);
    if (problems.length > 0) throw new Error(problems.join(' '));
    if (next.category !== this.#category) {
      throw new Error('The category cannot be changed. Cancel this request and submit a new one in the correct category.');
    }

    this.#title = next.title;
    this.#description = next.description;
    this.#location = next.location;
    this.#priority = next.priority;
    this.#record(this.#status, this.#status, 'Update Details', this.#requester, `Updated: ${keys.join(', ')}.`);
    return true;
  }

  cancelRequest() {
    if (this.#status === 'Cancelled') throw new Error('This request is already Cancelled.');
    if (this.#status !== 'Submitted') {
      throw new Error(`Only Submitted requests can be cancelled (current status: ${this.#status}).`);
    }
    this.#transition('Cancelled', 'Cancel Request', this.#requester, 'Cancelled by requester.');
    return true;
  }

  // ------------------------------------------------------------------
  // Workflow (Credit): every method checks the ROLE first, then the
  // status transition, then records the change in the history.
  // ------------------------------------------------------------------

  static #requireOfficer(actor, what) {
    if (!(actor instanceof ServiceOfficer)) {
      throw new Error(`Access denied: only a Service Officer can ${what}.`);
    }
  }

  #requireAssignedTechnician(actor, what) {
    const assigned = this.#assignedTechnician;
    if (!(actor instanceof Technician) || !assigned || actor.userId !== assigned.userId) {
      const detail = assigned ? `assigned to ${assigned.userId}` : 'not assigned to a Technician yet';
      throw new Error(`Access denied: only the assigned Technician can ${what}. This request is ${detail}.`);
    }
  }

  #record(previousStatus, newStatus, action, actor, comment) {
    this.#history.push(new HistoryEntry({
      previousStatus,
      newStatus,
      action,
      actorId: actor.userId,
      actorRole: actor.userType,
      comment
    }));
    this.#dateUpdated = new Date();
  }

  /** The single place a status can change. Rejects moves not in TRANSITIONS. */
  #transition(newStatus, action, actor, comment, beforeCommit = () => {}) {
    const allowed = ServiceRequest.TRANSITIONS[this.#status];
    if (!allowed.includes(newStatus)) {
      const next = allowed.length > 0 ? allowed.join(' or ') : 'none (final status)';
      throw new Error(
        `Invalid status transition: a request that is ${this.#status} cannot become ${newStatus}. Allowed next status: ${next}.`
      );
    }
    beforeCommit();
    const previous = this.#status;
    this.#status = newStatus;
    this.#record(previous, newStatus, action, actor, comment);
  }

  review(actor, comment = '') {
    ServiceRequest.#requireOfficer(actor, 'review requests');
    this.#transition('Reviewed', 'Review Request', actor, comment || 'Request reviewed.');
    return true;
  }

  setPriority(actor, priority, comment = '') {
    ServiceRequest.#requireOfficer(actor, 'set the request priority');
    if (this.#status !== 'Reviewed') {
      throw new Error(`Priority can only be set while the request is Reviewed (current status: ${this.#status}).`);
    }
    const value = clean(priority);
    if (!ServiceRequest.PRIORITIES.includes(value)) {
      throw new Error(`Unsupported priority "${priority}". Allowed: ${ServiceRequest.PRIORITIES.join(', ')}.`);
    }
    const previous = this.#priority;
    this.#priority = value;
    const note = clean(comment);
    this.#record(this.#status, this.#status, 'Set Priority', actor,
      `Priority changed from ${previous} to ${value}.${note ? ' ' + note : ''}`);
    return true;
  }

  assignTechnician(actor, technician, comment = '') {
    ServiceRequest.#requireOfficer(actor, 'assign a Technician');
    if (!(technician instanceof Technician)) {
      throw new Error('Only a registered Technician can be assigned to a request.');
    }
    this.#transition('Assigned', 'Assign Technician', actor,
      comment || `Assigned to ${technician.getFullName()} (${technician.userId}).`,
      () => { this.#assignedTechnician = technician; });
    return true;
  }

  startWork(actor, comment = '') {
    this.#requireAssignedTechnician(actor, 'start the work');
    this.#transition('In Progress', 'Start Work', actor, comment || 'Work started.');
    return true;
  }

  addProgressNote(actor, note) {
    this.#requireAssignedTechnician(actor, 'add progress notes');
    if (this.#status !== 'In Progress') {
      throw new Error(`Progress notes can only be added while the request is In Progress (current status: ${this.#status}).`);
    }
    const text = clean(note);
    if (!text) throw new Error('A progress note is required.');
    this.#record('In Progress', 'In Progress', 'Progress Note', actor, text);
    return true;
  }

  resolve(actor, comment = '') {
    this.#requireAssignedTechnician(actor, 'resolve the request');
    this.#transition('Resolved', 'Resolve Request', actor, comment || 'Work completed.');
    return true;
  }

  close(actor, comment = '') {
    ServiceRequest.#requireOfficer(actor, 'verify and close a request');
    this.#transition('Closed', 'Close Request', actor, comment || 'Resolution verified.');
    return true;
  }
}

module.exports = { ServiceRequest };
