'use strict';

const { FileRepository } = require('./FileRepository');

/** auditLog.json */
class AuditFileRepository extends FileRepository {
  constructor(filePath) {
    super(filePath, 'auditId');
  }

  async findByRequest(requestId) {
    return (await this.loadAll()).filter((r) => r.requestId === requestId);
  }
}

module.exports = { AuditFileRepository };
