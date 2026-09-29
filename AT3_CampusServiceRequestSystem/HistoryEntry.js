'use strict';

const { clean, toValidDate } = require('./validation');

/** One row in a request's history: what changed, who did it, when. Immutable once created. */
class HistoryEntry {
  #previousStatus;
  #newStatus;
  #action;
  #actorId;
  #actorRole;
  #comment;
  #timestamp;

  constructor({ previousStatus, newStatus, action, actorId, actorRole, comment = '', timestamp = new Date() } = {}) {
    this.#previousStatus = clean(previousStatus);
    this.#newStatus = clean(newStatus);
    this.#action = clean(action);
    this.#actorId = clean(actorId);
    this.#actorRole = clean(actorRole);
    this.#comment = clean(comment);
    this.#timestamp = toValidDate(timestamp);

    const problems = [];
    if (!this.#previousStatus) problems.push('History previous status is required.');
    if (!this.#newStatus) problems.push('History new status is required.');
    if (!this.#action) problems.push('History action is required.');
    if (!this.#actorId) problems.push('History actor ID is required.');
    if (!this.#actorRole) problems.push('History actor role is required.');
    if (!this.#timestamp) problems.push('History timestamp is not a valid date.');
    if (problems.length > 0) throw new Error(problems.join(' '));
  }

  get previousStatus() { return this.#previousStatus; }
  get newStatus() { return this.#newStatus; }
  get action() { return this.#action; }
  get actorId() { return this.#actorId; }
  get actorRole() { return this.#actorRole; }
  get comment() { return this.#comment; }
  get timestamp() { return new Date(this.#timestamp); }

  toData() {
    return {
      previousStatus: this.#previousStatus,
      newStatus: this.#newStatus,
      action: this.#action,
      actorId: this.#actorId,
      actorRole: this.#actorRole,
      comment: this.#comment,
      timestamp: this.#timestamp.toISOString()
    };
  }

  static fromData(data) {
    return new HistoryEntry(data);
  }
}

module.exports = { HistoryEntry };

