'use strict';

// Helper: trims strings, returns '' for anything that is not a string.
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * User - base class for everyone who uses the system.
 * All data is stored in private (#) fields (encapsulation) and can only be
 * changed through validated setters.
 */
class User {
  static USER_TYPES = ['Student', 'Staff', 'Service Officer', 'Technician', 'Administrator'];

  #userId;
  #firstName;
  #lastName;
  #email;
  #userType;

  constructor(userId, firstName, lastName, email, userType) {
    this.#userId = clean(userId);
    this.#firstName = clean(firstName);
    this.#lastName = clean(lastName);
    this.#email = clean(email);
    this.#userType = clean(userType);
    this.validate(); // reject invalid objects at construction time
  }

  // ---- getters ----
  get userId() { return this.#userId; }
  get firstName() { return this.#firstName; }
  get lastName() { return this.#lastName; }
  get email() { return this.#email; }
  get userType() { return this.#userType; }

  // ---- controlled setters (the user ID is never changed after creation) ----
  set firstName(value) {
    const v = clean(value);
    if (!v) throw new Error('First name is required.');
    this.#firstName = v;
  }

  set lastName(value) {
    const v = clean(value);
    if (!v) throw new Error('Last name is required.');
    this.#lastName = v;
  }

  set email(value) {
    const v = clean(value);
    if (!EMAIL_PATTERN.test(v)) throw new Error('A valid email address is required.');
    this.#email = v;
  }

  set userType(value) {
    const v = clean(value);
    if (!User.USER_TYPES.includes(v)) {
      throw new Error(`Invalid user type "${value}". Allowed: ${User.USER_TYPES.join(', ')}.`);
    }
    this.#userType = v;
  }

  getFullName() {
    return `${this.#firstName} ${this.#lastName}`;
  }

  /** Throws one Error listing every problem found; returns true if valid. */
  validate() {
    const problems = [];
    if (!this.#userId) problems.push('User ID is required.');
    if (!this.#firstName) problems.push('First name is required.');
    if (!this.#lastName) problems.push('Last name is required.');
    if (!EMAIL_PATTERN.test(this.#email)) problems.push('A valid email address is required.');
    if (!User.USER_TYPES.includes(this.#userType)) {
      problems.push(`User type must be one of: ${User.USER_TYPES.join(', ')}.`);
    }
    if (problems.length > 0) throw new Error(problems.join(' '));
    return true;
  }

  displayInfo() {
    return `ID: ${this.#userId} | Name: ${this.getFullName()} | Email: ${this.#email} | Type: ${this.#userType}`;
  }
}

module.exports = { User };
