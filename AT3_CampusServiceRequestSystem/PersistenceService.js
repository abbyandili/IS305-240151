'use strict';

const path = require('node:path');
const { UserFactory } = require('./UserFactory');
const { ServiceRequestFactory } = require('./ServiceRequestFactory');
const { AuditEntry } = require('./AuditEntry');
const { Technician } = require('./Technician');
const { UserFileRepository } = require('./repositories/UserFileRepository');
const { ServiceRequestFileRepository } = require('./repositories/ServiceRequestFileRepository');
const { RequestHistoryFileRepository } = require('./repositories/RequestHistoryFileRepository');
const { AuditFileRepository } = require('./repositories/AuditFileRepository');

/**
 * PersistenceService - moves data between the manager (objects) and the four JSON
 * files (plain data), using the repositories and the factories.
 * CampusServiceApp talks to this class and never touches files itself.
 */
class PersistenceService {
  #dataDirectory;
  #users;
  #requests;
  #history;
  #audit;

  constructor(dataDirectory) {
    if (typeof dataDirectory !== 'string' || !dataDirectory.trim()) {
      throw new Error('A data directory is required.');
    }
    this.#dataDirectory = dataDirectory;
    this.#users = new UserFileRepository(path.join(dataDirectory, 'users.json'));
    this.#requests = new ServiceRequestFileRepository(path.join(dataDirectory, 'serviceRequests.json'));
    this.#history = new RequestHistoryFileRepository(path.join(dataDirectory, 'requestHistory.json'));
    this.#audit = new AuditFileRepository(path.join(dataDirectory, 'auditLog.json'));
  }

  get dataDirectory() { return this.#dataDirectory; }

  /** Creates any missing data file containing an empty array. */
  async ensureFiles() {
    for (const repository of [this.#users, this.#requests, this.#history, this.#audit]) {
      await repository.ensureFile();
    }
  }

  /**
   * Loads all four files, rebuilds the correct objects and gives them to the manager.
   * Throws a clear error (naming the record) if anything is invalid; the manager is left unchanged.
   */
  async loadInto(manager) {
    await this.ensureFiles();

    const userRecords = await this.#users.loadAll();
    const users = userRecords.map((record) => {
      try {
        return UserFactory.createFromData(record);
      } catch (error) {
        throw new Error(`Saved user ${record?.userId ?? '(no ID)'} is invalid: ${error.message}`);
      }
    });
    const usersById = new Map(users.map((u) => [u.userId, u]));

    const historyByRequest = new Map();
    for (const row of await this.#history.loadAll()) {
      if (!historyByRequest.has(row.requestId)) historyByRequest.set(row.requestId, []);
      historyByRequest.get(row.requestId).push(row);
    }

    const requests = (await this.#requests.loadAll()).map((record) => {
      try {
        const requester = usersById.get(record.requesterId);
        if (!requester) throw new Error(`requester ${record.requesterId} is not in users.json`);
        let technician = null;
        if (record.assignedTechnicianId) {
          technician = usersById.get(record.assignedTechnicianId);
          if (!(technician instanceof Technician)) {
            throw new Error(`${record.assignedTechnicianId} is not a saved Technician`);
          }
        }
        return ServiceRequestFactory.createFromData(record, requester, technician, historyByRequest.get(record.requestId) ?? []);
      } catch (error) {
        throw new Error(`Saved request ${record?.requestId ?? '(no ID)'} is invalid: ${error.message}`);
      }
    });

    const auditEntries = (await this.#audit.loadAll()).map((record) => {
      try {
        return AuditEntry.fromData(record);
      } catch (error) {
        throw new Error(`Saved audit entry ${record?.auditId ?? '(no ID)'} is invalid: ${error.message}`);
      }
    });

    manager.restoreData(users, requests, auditEntries);
    return { users: users.length, requests: requests.length, auditEntries: auditEntries.length };
  }

  /** Validates every object, converts it to plain data, and writes all four files. */
  async saveFrom(manager) {
    const users = manager.getAllUsers();
    const requests = manager.getAllRequests();
    const auditEntries = manager.getAuditEntries();

    // Never save an invalid object.
    users.forEach((u) => u.validate());
    requests.forEach((r) => {
      r.validate();
      r.validateSpecialisedFields();
    });

    const historyRecords = requests.flatMap((r) =>
      r.getHistory().map((entry, index) => ({
        historyId: `${r.requestId}-${index + 1}`,
        requestId: r.requestId,
        ...entry.toData()
      }))
    );

    await this.#users.saveAll(users.map((u) => u.toData()));
    await this.#requests.saveAll(requests.map((r) => r.toData()));
    await this.#history.saveAll(historyRecords);
    await this.#audit.saveAll(auditEntries.map((a) => a.toData()));
  }
}

module.exports = { PersistenceService };
