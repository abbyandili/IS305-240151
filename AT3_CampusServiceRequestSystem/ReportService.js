'use strict';

const { ServiceRequest } = require('./ServiceRequest');

const HOUR_MS = 60 * 60 * 1000;

/**
 * ReportService - management reports built with filter(), map(), reduce() and sort().
 * Every method takes an array of requests and returns plain results, so it can be tested
 * without the console or files.
 */
class ReportService {
  /** Counts requests by a key; keys are ordered by `order` if given, otherwise by count. */
  #countBy(requests, keyOf, order = null) {
    const counts = requests.reduce((totals, request) => {
      const key = keyOf(request);
      totals[key] = (totals[key] || 0) + 1;
      return totals;
    }, {});
    const entries = Object.entries(counts).sort(([keyA, countA], [keyB, countB]) =>
      order
        ? order.indexOf(keyA) - order.indexOf(keyB)
        : countB - countA || keyA.localeCompare(keyB)
    );
    return Object.fromEntries(entries);
  }

  #isOpen(request) {
    return ServiceRequest.OPEN_STATUSES.includes(request.status);
  }

  #technicianLabel(request) {
    const technician = request.assignedTechnician;
    return `${technician.userId} - ${technician.getFullName()}`;
  }

  requestsByStatus(requests) {
    return this.#countBy(requests, (r) => r.status, ServiceRequest.STATUSES);
  }

  requestsByCategory(requests) {
    return this.#countBy(requests, (r) => r.category);
  }

  requestsByPriority(requests) {
    return this.#countBy(requests, (r) => r.priority, [...ServiceRequest.PRIORITIES].reverse());
  }

  /** Urgent requests that still need work, oldest first. */
  urgentRequests(requests) {
    return requests
      .filter((r) => r.priority === 'Urgent' && this.#isOpen(r))
      .sort((a, b) => a.dateSubmitted - b.dateSubmitted);
  }

  /** Open requests older than their target resolution time, most overdue first. */
  overdueRequests(requests, now = new Date()) {
    return requests
      .filter((r) => this.#isOpen(r))
      .map((request) => {
        const dueTime = request.dateSubmitted.getTime() + request.getTargetResolutionHours() * HOUR_MS;
        return { request, hoursOverdue: Math.round(((now.getTime() - dueTime) / HOUR_MS) * 100) / 100 };
      })
      .filter((item) => item.hoursOverdue > 0)
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue);
  }

  /** Requests currently assigned to each Technician (cancelled requests never have one). */
  requestsPerTechnician(requests) {
    return this.#countBy(requests.filter((r) => r.assignedTechnician), (r) => this.#technicianLabel(r));
  }

  /** Resolved or Closed requests for each Technician. */
  completedByTechnician(requests) {
    const completed = requests.filter((r) => r.assignedTechnician && ['Resolved', 'Closed'].includes(r.status));
    return this.#countBy(completed, (r) => this.#technicianLabel(r));
  }

  /** Average hours from submission to the Resolved step. averageHours is null when nothing is resolved. */
  averageResolutionHours(requests) {
    const hours = requests
      .map((request) => {
        const resolvedEntry = request.getHistory().find((entry) => entry.newStatus === 'Resolved');
        return resolvedEntry ? (resolvedEntry.timestamp - request.dateSubmitted) / HOUR_MS : null;
      })
      .filter((value) => value !== null);
    if (hours.length === 0) return { count: 0, averageHours: null };
    const average = hours.reduce((sum, value) => sum + value, 0) / hours.length;
    return { count: hours.length, averageHours: Math.round(average * 100) / 100 };
  }

  volumeByLocation(requests) {
    return this.#countBy(requests, (r) => r.location);
  }
}

module.exports = { ReportService };
