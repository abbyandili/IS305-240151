'use strict';

const { User } = require('./User');
const { ServiceRequest } = require('./ServiceRequest');

/**
 * ServiceRequestManager - holds users and requests in JavaScript arrays and
 * enforces the business rules (duplicates, ownership; roles are enforced by
 * the request itself). It does no console input/output - that belongs to
 * CampusServiceApp. (The audit trail is added at the Distinction stage.)
 */
class ServiceRequestManager {
  #users = [];
  #requests = [];

  // ------------------------------------------------------------------
  // Users
  // ------------------------------------------------------------------

  registerUser(user) {
    if (!(user instanceof User)) throw new Error('registerUser requires a User object.');
    user.validate();
    if (this.findUserById(user.userId)) {
      throw new Error(`Duplicate user ID: ${user.userId} is already registered.`);
    }
    this.#users.push(user);
    return user;
  }

  findUserById(userId) {
    return this.#users.find((u) => u.userId === String(userId).trim());
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
    if (!(request instanceof ServiceRequest)) throw new Error('submitRequest requires a ServiceRequest object.');
    request.validate();
    request.validateSpecialisedFields();
    if (!this.findUserById(request.requester.userId)) {
      throw new Error(`Requester ${request.requester.userId} is not registered.`);
    }
    if (this.findRequestById(request.requestId)) {
      throw new Error(`Duplicate request ID: ${request.requestId} already exists.`);
    }
    this.#requests.push(request);
    return request;
  }

  findRequestById(requestId) {
    const id = String(requestId).trim().toUpperCase();
    return this.#requests.find((r) => r.requestId.toUpperCase() === id);
  }

  #mustFindRequest(requestId) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${String(requestId ?? '').trim() || '(blank)'} was not found.`);
    return request;
  }

  getRequestsByUser(userId) {
    const id = String(userId).trim();
    return this.#requests.filter((r) => r.requester.userId === id);
  }

  getAllRequests() {
    return [...this.#requests]; // copy, so callers cannot modify the internal array
  }

  #getOwnedRequest(requestId, userId) {
    const request = this.#mustFindRequest(requestId);
    if (request.requester.userId !== String(userId).trim()) {
      throw new Error('Access denied: you can only change your own requests.');
    }
    return request;
  }

  updateRequest(requestId, userId, changes) {
    const request = this.#getOwnedRequest(requestId, userId);
    request.updateDetails(changes);
    return request;
  }

  cancelRequest(requestId, userId) {
    const request = this.#getOwnedRequest(requestId, userId);
    request.cancelRequest();
    return request;
  }

  searchRequests(searchText) {
    const text = String(searchText).trim().toLowerCase();
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
  // Workflow (Credit): the manager finds the objects; the request itself
  // enforces the role and status rules.
  // ------------------------------------------------------------------

  reviewRequest(requestId, officerId, comment = '') {
    const request = this.#mustFindRequest(requestId);
    request.review(this.#mustFindUser(officerId), comment);
    return request;
  }

  setRequestPriority(requestId, officerId, priority, comment = '') {
    const request = this.#mustFindRequest(requestId);
    request.setPriority(this.#mustFindUser(officerId), priority, comment);
    return request;
  }

  assignTechnician(requestId, officerId, technicianId, comment = '') {
    const request = this.#mustFindRequest(requestId);
    request.assignTechnician(this.#mustFindUser(officerId), this.#mustFindUser(technicianId), comment);
    return request;
  }

  startWork(requestId, technicianId, comment = '') {
    const request = this.#mustFindRequest(requestId);
    request.startWork(this.#mustFindUser(technicianId), comment);
    return request;
  }

  addProgressNote(requestId, technicianId, note) {
    const request = this.#mustFindRequest(requestId);
    request.addProgressNote(this.#mustFindUser(technicianId), note);
    return request;
  }

  resolveRequest(requestId, technicianId, comment = '') {
    const request = this.#mustFindRequest(requestId);
    request.resolve(this.#mustFindUser(technicianId), comment);
    return request;
  }

  closeRequest(requestId, officerId, comment = '') {
    const request = this.#mustFindRequest(requestId);
    request.close(this.#mustFindUser(officerId), comment);
    return request;
  }

  // ------------------------------------------------------------------
  // Filter and sort (Credit). The optional last argument lets you filter
  // first and then sort the result: sortByPriority(true, filterByStatus('Assigned'))
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
}

module.exports = { ServiceRequestManager };
