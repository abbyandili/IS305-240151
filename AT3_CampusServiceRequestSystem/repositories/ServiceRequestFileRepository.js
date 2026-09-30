'use strict';

const { FileRepository } = require('./FileRepository');

/** serviceRequests.json */
class ServiceRequestFileRepository extends FileRepository {
  constructor(filePath) {
    super(filePath, 'requestId');
  }

  async findByRequester(userId) {
    return (await this.loadAll()).filter((r) => r.requesterId === userId);
  }

  async findByTechnician(technicianId) {
    return (await this.loadAll()).filter((r) => r.assignedTechnicianId === technicianId);
  }
}

module.exports = { ServiceRequestFileRepository };
