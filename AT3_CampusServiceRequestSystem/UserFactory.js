'use strict';

const { User } = require('./User');
const { StudentRequester } = require('./StudentRequester');
const { StaffRequester } = require('./StaffRequester');
const { ServiceOfficer } = require('./ServiceOfficer');
const { Technician } = require('./Technician');

/** Builds the correct User subclass from plain data (console input or saved JSON). */
class UserFactory {
  static createFromData(data = {}) {
    const { userId, firstName, lastName, email, userType } = data;
    switch (userType) {
      case 'Student':
        return new StudentRequester(userId, firstName, lastName, email, data.programme, data.yearLevel);
      case 'Staff':
        return new StaffRequester(userId, firstName, lastName, email, data.department);
      case 'Service Officer':
        return new ServiceOfficer(userId, firstName, lastName, email, data.serviceSection);
      case 'Technician':
        return new Technician(userId, firstName, lastName, email, data.technicalSpeciality);
      case 'Administrator':
        return new User(userId, firstName, lastName, email, 'Administrator');
      default:
        throw new Error(`Invalid user type "${userType}". Allowed: ${User.USER_TYPES.join(', ')}.`);
    }
  }
}

module.exports = { UserFactory };
