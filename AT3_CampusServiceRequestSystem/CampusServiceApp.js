'use strict';

const readline = require('node:readline');
const { User } = require('./User');
const { ServiceRequest } = require('./ServiceRequest');
const { ServiceRequestManager } = require('./ServiceRequestManager');

const MENU = `
============================================
   CAMPUS SERVICE REQUEST SYSTEM
============================================
1. Register User
2. Submit Service Request
3. View Request by ID
4. View My Requests
5. View All Requests
6. Update My Request
7. Cancel My Request
8. Search Requests
9. View Request Summary
10. Exit
============================================`;

/**
 * CampusServiceApp - console menu only. It asks questions, calls the manager,
 * and prints results. Business rules live in the other classes.
 */
class CampusServiceApp {
  #manager;
  #lines;
  #running = true;

  constructor(manager = new ServiceRequestManager(), input = process.stdin) {
    this.#manager = manager;
    // An async iterator over input lines works for typing AND piped input.
    this.#lines = readline.createInterface({ input })[Symbol.asyncIterator]();
  }

  async #ask(question) {
    process.stdout.write(question);
    const { value, done } = await this.#lines.next();
    if (done) { this.#running = false; return ''; }
    return value.trim();
  }

  /** Lets the user type a number or the option name. Unknown text is passed on so validation can reject it. */
  async #choose(label, options, defaultValue = '') {
    console.log(`${label}:`);
    options.forEach((o, i) => console.log(`  ${i + 1}. ${o}`));
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    const answer = await this.#ask(`Choose${suffix}: `);
    if (!answer) return defaultValue;
    const index = Number(answer);
    if (Number.isInteger(index) && index >= 1 && index <= options.length) return options[index - 1];
    return answer;
  }

  #print(request) {
    console.log('\n' + request.getRequestSummary());
  }

  #printList(requests, emptyMessage) {
    if (requests.length === 0) return console.log(emptyMessage);
    requests.forEach((r) => this.#print(r));
    console.log(`\n${requests.length} request(s) shown.`);
  }

  /** First unused ID (REQ001, REQ002, ...) so failed submissions never leave gaps. */
  #nextRequestId() {
    let number = 1;
    const format = (n) => `REQ${String(n).padStart(3, '0')}`;
    while (this.#manager.findRequestById(format(number))) number++;
    return format(number);
  }

  // ---------------- menu actions ----------------

  async #registerUser() {
    const userId = await this.#ask('User ID: ');
    const firstName = await this.#ask('First name: ');
    const lastName = await this.#ask('Last name: ');
    const email = await this.#ask('Email: ');
    const userType = await this.#choose('User type', User.USER_TYPES, 'Student');
    const user = new User(userId, firstName, lastName, email, userType);
    this.#manager.registerUser(user);
    console.log(`User registered: ${user.displayInfo()}`);
  }

  async #submitRequest() {
    const userId = await this.#ask('Your user ID: ');
    const requester = this.#manager.findUserById(userId);
    if (!requester) throw new Error(`User ${userId} is not registered. Register first (option 1).`);

    const title = await this.#ask('Title: ');
    const description = await this.#ask('Description: ');
    const location = await this.#ask('Campus location: ');
    const category = await this.#choose('Category', ServiceRequest.CATEGORIES);
    const priority = await this.#choose('Priority', ServiceRequest.PRIORITIES, 'Normal');

    const request = new ServiceRequest({
      requestId: this.#nextRequestId(),
      requester, title, description, location, category, priority
    });
    this.#manager.submitRequest(request);
    console.log(`Request submitted with ID ${request.requestId} (status: ${request.status}).`);
  }

  async #viewById() {
    const id = await this.#ask('Request ID: ');
    const request = this.#manager.findRequestById(id);
    if (!request) throw new Error(`Request ${id} was not found.`);
    this.#print(request);
  }

  async #viewMine() {
    const userId = await this.#ask('Your user ID: ');
    if (!this.#manager.findUserById(userId)) throw new Error(`User ${userId} is not registered.`);
    this.#printList(this.#manager.getRequestsByUser(userId), 'You have no requests.');
  }

  async #updateMine() {
    const requestId = await this.#ask('Request ID to update: ');
    const userId = await this.#ask('Your user ID: ');
    console.log('Press Enter to keep the current value.');
    const changes = {};
    for (const field of ['title', 'description', 'location']) {
      const value = await this.#ask(`New ${field}: `);
      if (value) changes[field] = value;
    }
    const category = await this.#choose('New category', ServiceRequest.CATEGORIES, '');
    if (category) changes.category = category;
    const priority = await this.#choose('New priority', ServiceRequest.PRIORITIES, '');
    if (priority) changes.priority = priority;

    const request = this.#manager.updateRequest(requestId, userId, changes);
    console.log('Request updated.');
    this.#print(request);
  }

  async #cancelMine() {
    const requestId = await this.#ask('Request ID to cancel: ');
    const userId = await this.#ask('Your user ID: ');
    const request = this.#manager.cancelRequest(requestId, userId);
    console.log(`Request ${request.requestId} is now ${request.status}.`);
  }

  async #search() {
    const text = await this.#ask('Search text: ');
    this.#printList(this.#manager.searchRequests(text), 'No matching requests.');
  }

  #summary() {
    const summary = this.#manager.getRequestSummaryByStatus();
    const entries = Object.entries(summary);
    if (entries.length === 0) return console.log('No requests recorded yet.');
    console.log('\nRequests by status:');
    entries.forEach(([status, count]) => console.log(`  ${status.padEnd(12)} ${count}`));
  }

  // ---------------- main loop ----------------

  async run() {
    while (this.#running) {
      console.log(MENU);
      const choice = await this.#ask('Enter choice (1-10): ');
      if (!this.#running) break;
      try {
        switch (choice) {
          case '1': await this.#registerUser(); break;
          case '2': await this.#submitRequest(); break;
          case '3': await this.#viewById(); break;
          case '4': await this.#viewMine(); break;
          case '5': this.#printList(this.#manager.getAllRequests(), 'No requests recorded yet.'); break;
          case '6': await this.#updateMine(); break;
          case '7': await this.#cancelMine(); break;
          case '8': await this.#search(); break;
          case '9': this.#summary(); break;
          case '10': this.#running = false; console.log('Goodbye.'); break;
          default: console.log('Invalid choice. Please enter a number from 1 to 10.');
        }
      } catch (error) {
        console.log(`Error: ${error.message}`); // clear message, app keeps running
      }
    }
    process.stdin.pause();
  }
}

module.exports = { CampusServiceApp };

if (require.main === module) {
  new CampusServiceApp().run();
}
