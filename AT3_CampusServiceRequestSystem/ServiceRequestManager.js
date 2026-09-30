'use strict';

const { User } = require('./User');
const { ServiceRequest } = require('./ServiceRequest');
const { AuditEntry } = require('./AuditEntry');

/**
 * ServiceRequestManager - holds users, requests and audit entries in arrays and
 * enforces the business rules (duplicates, ownership, roles via the request).
 * It does no console or file input/output.
 *
 * Every action that changes data goes through #perform(), which writes an audit
 * entry whether the action succeeds or is rejected.
 */
class ServiceRequestManager {
  #users = [];
  #requests = [];
  #auditEntries = [];

  // ------------------------------------------------------------------
  // Audit helpers
  // ------------------------------------------------------------------

  #audit(actorId, action, requestId, description, outcome) {
    const number = this.#auditEntries.length + 1;
    this.#auditEntries.push(new AuditEntry({
      auditId: `AUD${String(number).padStart(4, '0')}`,
      actorId: String(actorId ?? '').trim() || 'UNKNOWN',
      action,
      requestId: requestId == null ? null : String(requestId).trim() || null,
      description,
      outcome
    }));
  }

  /** Runs an operation and records Success, or Rejected (then re-throws the error). */
  #perform(actorId, action, requestId, description, operation) {
    try {
      const result = operation();
      this.#audit(actorId, action, requestId, description, 'Success');
      return result;
    } catch (error) {
      this.#audit(actorId, action, requestId, `${description} Reason: ${error.message}`, 'Rejected');
      throw error;
    }
  }

  getAuditEntries() {
    return [...this.#auditEntries];
  }

  // ------------------------------------------------------------------
  // Users
  // ------------------------------------------------------------------

  registerUser(user) {
    const actorId = user instanceof User ? user.userId : 'UNKNOWN';
    return this.#perform(actorId, 'Register User', null, `Register ${actorId}.`, () => {
      if (!(user instanceof User)) throw new Error('registerUser requires a User object.');
      user.validate();
      if (this.findUserById(user.userId)) {
        throw new Error(`Duplicate user ID: ${user.userId} is already registered.`);
      }
      this.#users.push(user);
      return user;
    });
  }

  findUserById(userId) {
    return this.#users.find((u) => u.userId === String(userId ?? '').trim());
  }

  getAllUsers() {
    return [...this.#users];
  }

  #mustFindUser(userId) {
    const user = this.findUserById(userId);
    if (!user) throw new Error(`User ${String(userId ?? '').trim() || '(blank)'} is not registered.`);
    return user;
  }

  // ------------------------------------------------------------------
  // Requests (Pass)
  // ------------------------------------------------------------------

  submitRequest(request) {
    const isRequest = request instanceof ServiceRequest;
    const actorId = isRequest ? request.requester.userId : 'UNKNOWN';
    const requestId = isRequest ? request.requestId : null;
    return this.#perform(actorId, 'Create Request', requestId, `Create request ${requestId}.`, () => {
      if (!isRequest) throw new Error('submitRequest requires a ServiceRequest object.');
      request.validate();
      request.validateSpecialisedFields(); // throws for an abstract (untyped) request
      const requester = this.findUserById(request.requester.userId);
      if (!requester) throw new Error(`Requester ${request.requester.userId} is not registered.`);
      if (!['Student', 'Staff'].includes(requester.userType)) {
        throw new Error('Only students and staff can submit service requests.');
      }
      if (this.findRequestById(request.requestId)) {
        throw new Error(`Duplicate request ID: ${request.requestId} already exists.`);
      }
      this.#requests.push(request);
      return request;
    });
  }

  findRequestById(requestId) {
    const id = String(requestId ?? '').trim().toUpperCase();
    return this.#requests.find((r) => r.requestId.toUpperCase() === id);
  }

  #mustFindRequest(requestId) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${String(requestId ?? '').trim() || '(blank)'} was not found.`);
    return request;
  }

  getRequestsByUser(userId) {
    const id = String(userId ?? '').trim();
    return this.#requests.filter((r) => r.requester.userId === id);
  }

  getAllRequests() {
    return [...this.#requests]; // copy, so callers cannot modify the internal array
  }

  #getOwnedRequest(requestId, userId) {
    const request = this.#mustFindRequest(requestId);
    if (request.requester.userId !== String(userId ?? '').trim()) {
      throw new Error('Access denied: you can only change your own requests.');
    }
    return request;
  }

  updateRequest(requestId, userId, changes) {
    return this.#perform(userId, 'Update Request', requestId, `Update request ${requestId}.`, () => {
      const request = this.#getOwnedRequest(requestId, userId);
      request.updateDetails(changes);
      return request;
    });
  }

  cancelRequest(requestId, userId) {
    return this.#perform(userId, 'Cancel Request', requestId, `Cancel request ${requestId}.`, () => {
      const request = this.#getOwnedRequest(requestId, userId);
      request.cancelRequest();
      return request;
    });
  }

  searchRequests(searchText) {
    const text = String(searchText ?? '').trim().toLowerCase();
    if (!text) throw new Error('Search text is required.');
    return this.#requests.filter((r) =>
      [r.requestId, r.title, r.description, r.location, r.category]
        .some((field) => field.toLowerCase().includes(text))
    );
  }

  getRequestSummaryByStatus() {
    return this.#requests.reduce((summary, r) => {
      summary[r.status] = (summary[r.status] || 0) + 1;
      return summary;
    }, {});
  }

  // ------------------------------------------------------------------
  // Workflow (Credit): the manager finds the objects; the request enforces
  // the role and status rules; #perform audits the outcome.
  // ------------------------------------------------------------------

  reviewRequest(requestId, officerId, comment = '') {
    return this.#perform(officerId, 'Review Request', requestId, `Review request ${requestId}.`, () => {
      const request = this.#mustFindRequest(requestId);
      request.review(this.#mustFindUser(officerId), comment);
      return request;
    });
  }

  setRequestPriority(requestId, officerId, priority, comment = '') {
    return this.#perform(officerId, 'Set Priority', requestId, `Set priority of ${requestId} to ${priority}.`, () => {
      const request = this.#mustFindRequest(requestId);
      request.setPriority(this.#mustFindUser(officerId), priority, comment);
      return request;
    });
  }

  assignTechnician(requestId, officerId, technicianId, comment = '') {
    return this.#perform(officerId, 'Assign Technician', requestId,
      `Assign ${technicianId} to request ${requestId}.`, () => {
        const request = this.#mustFindRequest(requestId);
        request.assignTechnician(this.#mustFindUser(officerId), this.#mustFindUser(technicianId), comment);
        return request;
      });
  }

  startWork(requestId, technicianId, comment = '') {
    return this.#perform(technicianId, 'Start Work', requestId, `Start work on request ${requestId}.`, () => {
      const request = this.#mustFindRequest(requestId);
      request.startWork(this.#mustFindUser(technicianId), comment);
      return request;
    });
  }

  addProgressNote(requestId, technicianId, note) {
    return this.#perform(technicianId, 'Progress Note', requestId, `Add progress note to request ${requestId}.`, () => {
      const request = this.#mustFindRequest(requestId);
      request.addProgressNote(this.#mustFindUser(technicianId), note);
      return request;
    });
  }

  resolveRequest(requestId, technicianId, comment = '') {
    return this.#perform(technicianId, 'Resolve Request', requestId, `Resolve request ${requestId}.`, () => {
      const request = this.#mustFindRequest(requestId);
      request.resolve(this.#mustFindUser(technicianId), comment);
      return request;
    });
  }

  closeRequest(requestId, officerId, comment = '') {
    return this.#perform(officerId, 'Close Request', requestId, `Close request ${requestId}.`, () => {
      const request = this.#mustFindRequest(requestId);
      request.close(this.#mustFindUser(officerId), comment);
      return request;
    });
  }

  // ------------------------------------------------------------------
  // Filter and sort (Credit). The optional last argument lets you filter
  // first and then sort the result: sortByPriority(true, filterByStatus('Assigned')).
  // ------------------------------------------------------------------

  filterByCategory(category, requests = this.#requests) {
    const value = String(category ?? '').trim();
    if (!ServiceRequest.CATEGORIES.includes(value)) {
      throw new Error(`Unsupported category "${category}". Allowed: ${ServiceRequest.CATEGORIES.join(', ')}.`);
    }
    return requests.filter((r) => r.category === value);
  }

  filterByStatus(status, requests = this.#requests) {
    const value = String(status ?? '').trim();
    if (!ServiceRequest.STATUSES.includes(value)) {
      throw new Error(`Unsupported status "${status}". Allowed: ${ServiceRequest.STATUSES.join(', ')}.`);
    }
    return requests.filter((r) => r.status === value);
  }

  filterByPriority(priority, requests = this.#requests) {
    const value = String(priority ?? '').trim();
    if (!ServiceRequest.PRIORITIES.includes(value)) {
      throw new Error(`Unsupported priority "${priority}". Allowed: ${ServiceRequest.PRIORITIES.join(', ')}.`);
    }
    return requests.filter((r) => r.priority === value);
  }

  filterByTechnician(technicianId, requests = this.#requests) {
    const id = String(technicianId ?? '').trim();
    if (!id) throw new Error('A Technician ID is required.');
    return requests.filter((r) => r.assignedTechnician && r.assignedTechnician.userId === id);
  }

  sortByDateSubmitted(ascending = true, requests = this.#requests) {
    const direction = ascending ? 1 : -1;
    return [...requests].sort((a, b) => direction * (a.dateSubmitted - b.dateSubmitted));
  }

  sortByPriority(highestFirst = true, requests = this.#requests) {
    const rank = (r) => ServiceRequest.PRIORITIES.indexOf(r.priority);
    const direction = highestFirst ? -1 : 1;
    return [...requests].sort((a, b) =>
      direction * (rank(a) - rank(b)) || (a.dateSubmitted - b.dateSubmitted) // ties: oldest first
    );
  }

  // ------------------------------------------------------------------
  // Restoring saved data (Distinction). Validates before replacing anything.
  // ------------------------------------------------------------------

  restoreData(users = [], requests = [], auditEntries = []) {
    const userIds = new Set();
    for (const user of users) {
      if (!(user instanceof User)) throw new Error('Restored users must be User objects.');
      user.validate();
      if (userIds.has(user.userId)) throw new Error(`Duplicate user ID in saved data: ${user.userId}.`);
      userIds.add(user.userId);
    }
    const requestIds = new Set();
    for (const request of requests) {
      if (!(request instanceof ServiceRequest)) throw new Error('Restored requests must be ServiceRequest objects.');
      if (requestIds.has(request.requestId)) throw new Error(`Duplicate request ID in saved data: ${request.requestId}.`);
      if (!userIds.has(request.requester.userId)) {
        throw new Error(`Saved request ${request.requestId} refers to an unregistered requester.`);
      }
      requestIds.add(request.requestId);
    }
    for (const entry of auditEntries) {
      if (!(entry instanceof AuditEntry)) throw new Error('Restored audit entries must be AuditEntry objects.');
    }
    this.#users = [...users];
    this.#requests = [...requests];
    this.#auditEntries = [...auditEntries];
  }
}

module.exports = { ServiceRequestManager };
