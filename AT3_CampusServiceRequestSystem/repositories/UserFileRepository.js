'use strict';

const { FileRepository } = require('./FileRepository');

/** users.json */
class UserFileRepository extends FileRepository {
  constructor(filePath) {
    super(filePath, 'userId');
  }

  async findByUserType(userType) {
    return (await this.loadAll()).filter((r) => r.userType === userType);
  }
}

module.exports = { UserFileRepository };
