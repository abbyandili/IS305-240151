'use strict';

const { User } = require('./User');

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * ServiceRequest - one campus service request.
 * Fields are private; changes go through updateDetails() / cancelRequest()
 * so the rules (validation, status checks) cannot be bypassed.
 */
class ServiceRequest {
  static CATEGORIES = [
    'ICT Support',
    'Facilities Maintenance',
    'Cleaning and Sanitation',
    'General Campus Service'
  ];
  static PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
  static UPDATABLE_FIELDS = ['title', 'description', 'location', 'category', 'priority'];

  #requestId;
  #requester;
  #title;
  #description;
  #location;
  #category;
  #priority;
  #status;
  #dateSubmitted;
  #dateUpdated;

  /**
   * @param {object} data - { requestId, requester, title, description,
   *                          location, category, priority }
   * Using one data object keeps subclass constructors simple later:
   *   super(commonRequestData)
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
  get dateSubmitted() { return new Date(this.#dateSubmitted); }
  get dateUpdated() { return new Date(this.#dateUpdated); }

  // Only priority has a direct setter here; everything else uses updateDetails().
  set priority(value) {
    const v = clean(value);
    if (!ServiceRequest.PRIORITIES.includes(v)) {
      throw new Error(`Unsupported priority "${value}". Allowed: ${ServiceRequest.PRIORITIES.join(', ')}.`);
    }
    this.#priority = v;
    this.#touch();
  }

  #touch() {
    this.#dateUpdated = new Date();
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

  /** Throws if the request is invalid; returns true otherwise. */
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

  /**
   * Update editable details. All-or-nothing: if any new value is invalid,
   * nothing is changed. Only allowed while status is Submitted.
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

    this.#title = next.title;
    this.#description = next.description;
    this.#location = next.location;
    this.#category = next.category;
    this.#priority = next.priority;
    this.#touch();
    return true;
  }

  cancelRequest() {
    if (this.#status === 'Cancelled') throw new Error('This request is already Cancelled.');
    if (this.#status !== 'Submitted') {
      throw new Error(`Only Submitted requests can be cancelled (current status: ${this.#status}).`);
    }
    this.#status = 'Cancelled';
    this.#touch();
    return true;
  }

  getRequestSummary() {
    return [
      `Request ID : ${this.#requestId}`,
      `Requester  : ${this.#requester.getFullName()} (${this.#requester.userId})`,
      `Title      : ${this.#title}`,
      `Description: ${this.#description}`,
      `Location   : ${this.#location}`,
      `Category   : ${this.#category}`,
      `Priority   : ${this.#priority}`,
      `Status     : ${this.#status}`,
      `Submitted  : ${this.#dateSubmitted.toLocaleString()}`,
      `Updated    : ${this.#dateUpdated.toLocaleString()}`
    ].join('\n');
  }
}

module.exports = { ServiceRequest };