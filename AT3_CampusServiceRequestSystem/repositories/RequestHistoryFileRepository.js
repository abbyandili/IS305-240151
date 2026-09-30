'use strict';

const { FileRepository } = require('./FileRepository');

/** requestHistory.json - one row per history entry, e.g. historyId "REQ001-1". */
class RequestHistoryFileRepository extends FileRepository {
  constructor(filePath) {
    super(filePath, 'historyId');
  }

  async findByRequest(requestId) {
    return (await this.loadAll()).filter((r) => r.requestId === requestId);
  }
}

module.exports = { RequestHistoryFileRepository };
