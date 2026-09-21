'use strict';

const { User } = require('./User');
const { ServiceRequest } = require('./ServiceRequest');

/**
 * ServiceRequestManager - holds users and requests in JavaScript arrays
 * and enforces the business rules (duplicates, ownership).
 * It does no console input/output - that belongs to CampusServiceApp.
 */
class ServiceRequestManager {
  #users = [];
  #requests = [];

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

  submitRequest(request) {
    if (!(request instanceof ServiceRequest)) throw new Error('submitRequest requires a ServiceRequest object.');
    request.validate();
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

  getRequestsByUser(userId) {
    const id = String(userId).trim();
    return this.#requests.filter((r) => r.requester.userId === id);
  }

  getAllRequests() {
    return [...this.#requests]; // copy, so callers cannot modify the internal array
  }

  #getOwnedRequest(requestId, userId) {
    const request = this.findRequestById(requestId);
    if (!request) throw new Error(`Request ${requestId} was not found.`);
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
}

module.exports = { ServiceRequestManager };
