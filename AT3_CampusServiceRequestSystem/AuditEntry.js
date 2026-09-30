'use strict';

const { clean, toValidDate } = require('./validation');

/** One row in the system audit log. Immutable once created. */
class AuditEntry {
  #auditId;
  #actorId;
  #action;
  #requestId;
  #description;
  #timestamp;
  #outcome;

  constructor({ auditId, actorId, action, requestId = null, description, outcome, timestamp = new Date() } = {}) {
    this.#auditId = clean(auditId);
    this.#actorId = clean(actorId);
    this.#action = clean(action);
    this.#requestId = clean(requestId) || null; // user registration has no request
    this.#description = clean(description);
    this.#outcome = clean(outcome);
    this.#timestamp = toValidDate(timestamp);

    const problems = [];
    if (!this.#auditId) problems.push('Audit ID is required.');
    if (!this.#actorId) problems.push('Audit actor ID is required.');
    if (!this.#action) problems.push('Audit action is required.');
    if (!this.#description) problems.push('Audit description is required.');
    if (!this.#outcome) problems.push('Audit outcome is required.');
    if (!this.#timestamp) problems.push('Audit timestamp is not a valid date.');
    if (problems.length > 0) throw new Error(problems.join(' '));
  }

  get auditId() { return this.#auditId; }
  get actorId() { return this.#actorId; }
  get action() { return this.#action; }
  get requestId() { return this.#requestId; }
  get description() { return this.#description; }
  get timestamp() { return new Date(this.#timestamp); }
  get outcome() { return this.#outcome; }

  toData() {
    return {
      auditId: this.#auditId,
      actorId: this.#actorId,
      action: this.#action,
      requestId: this.#requestId,
      description: this.#description,
      timestamp: this.#timestamp.toISOString(),
      outcome: this.#outcome
    };
  }

  static fromData(data) {
    return new AuditEntry(data);
  }
}

module.exports = { AuditEntry };
