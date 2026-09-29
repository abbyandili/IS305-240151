'use strict';

const readline = require('node:readline');
const { User } = require('./User');
const { StudentRequester } = require('./StudentRequester');
const { StaffRequester } = require('./StaffRequester');
const { ServiceOfficer } = require('./ServiceOfficer');
const { Technician } = require('./Technician');
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
--------------------------------------------
11. Service Officer Menu
12. Technician Menu
13. Filter and Sort Requests
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
    this.#log(`${label}:`);
    options.forEach((o, i) => this.#log(`  ${i + 1}. ${o}`));
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    const answer = await this.#ask(`Choose${suffix}: `);
    if (!answer) return defaultValue;
    const index = Number(answer);
    if (Number.isInteger(index) && index >= 1 && index <= options.length) return options[index - 1];
    return answer;
  }

  // ---------------- output helpers ----------------

  /** Prints one line. Used everywhere instead of console.log so all output goes through one place. */
  #log(text = '') {
    console.log(text);
  }

  #print(request) {
    this.#log('\n' + request.getRequestSummary());
  }

  #printList(requests, emptyMessage) {
    if (requests.length === 0) return this.#log(emptyMessage);
    requests.forEach((r) => this.#print(r));
    this.#log(`\n${requests.length} request(s) shown.`);
  }

  /** A compact one-line-per-request table, used by the role and filter/sort menus. */
  #printRows(requests, emptyMessage) {
    if (requests.length === 0) return this.#log(emptyMessage);
    this.#log(`\n${'ID'.padEnd(8)} ${'Priority'.padEnd(8)} ${'Status'.padEnd(11)} ${'Category'.padEnd(24)} Title`);
    requests.forEach((r) => {
      this.#log(`${r.requestId.padEnd(8)} ${r.priority.padEnd(8)} ${r.status.padEnd(11)} ${r.category.padEnd(24)} ${r.title}`);
    });
    this.#log(`\n${requests.length} request(s) shown.`);
  }

  /** First unused ID (REQ001, REQ002, ...) so failed submissions never leave gaps. */
  #nextRequestId() {
    let number = 1;
    const format = (n) => `REQ${String(n).padStart(3, '0')}`;
    while (this.#manager.findRequestById(format(number))) number++;
    return format(number);
  }

  /** Runs one action; prints any error instead of crashing the menu loop. */
  async #execute(action, mutating = false) {
    try {
      await action();
    } catch (error) {
      this.#log(`Error: ${error.message}`);
    }
  }

  // ---------------- menu actions ----------------

  /**
   * Builds the correct User subclass for the chosen type, asking whatever extra
   * question that subclass needs. Without this, every registered user would be a
   * plain User, and role checks like "actor instanceof ServiceOfficer" would
   * always fail, even for someone registered as a Service Officer.
   */
  async #registerUser() {
    const userId = await this.#ask('User ID: ');
    const firstName = await this.#ask('First name: ');
    const lastName = await this.#ask('Last name: ');
    const email = await this.#ask('Email: ');
    const userType = await this.#choose('User type', User.USER_TYPES, 'Student');

    let user;
    switch (userType) {
      case 'Student': {
        const programme = await this.#ask('Programme: ');
        const yearLevel = await this.#ask('Year level (1-6): ');
        user = new StudentRequester(userId, firstName, lastName, email, programme, yearLevel);
        break;
      }
      case 'Staff': {
        const department = await this.#ask('Department: ');
        user = new StaffRequester(userId, firstName, lastName, email, department);
        break;
      }
      case 'Service Officer': {
        const serviceSection = await this.#ask('Service section: ');
        user = new ServiceOfficer(userId, firstName, lastName, email, serviceSection);
        break;
      }
      case 'Technician': {
        const technicalSpeciality = await this.#ask('Technical speciality: ');
        user = new Technician(userId, firstName, lastName, email, technicalSpeciality);
        break;
      }
      default:
        user = new User(userId, firstName, lastName, email, userType); // Administrator, or an invalid type (rejected by validate())
    }

    this.#manager.registerUser(user);
    this.#log(`User registered: ${user.displayInfo()}`);
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
    this.#log(`Request submitted with ID ${request.requestId} (status: ${request.status}).`);
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
    this.#log('Press Enter to keep the current value.');
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
    this.#log('Request updated.');
    this.#print(request);
  }

  async #cancelMine() {
    const requestId = await this.#ask('Request ID to cancel: ');
    const userId = await this.#ask('Your user ID: ');
    const request = this.#manager.cancelRequest(requestId, userId);
    this.#log(`Request ${request.requestId} is now ${request.status}.`);
  }

  async #search() {
    const text = await this.#ask('Search text: ');
    this.#printList(this.#manager.searchRequests(text), 'No matching requests.');
  }

  #summary() {
    const summary = this.#manager.getRequestSummaryByStatus();
    const entries = Object.entries(summary);
    if (entries.length === 0) return this.#log('No requests recorded yet.');
    this.#log('\nRequests by status:');
    entries.forEach(([status, count]) => this.#log(`  ${status.padEnd(12)} ${count}`));
  }

  // ---------------- sub-menus ----------------

  /** Shows a numbered sub-menu until the user chooses Back. */
  async #runMenu(title, items) {
    while (this.#running) {
      this.#log(`\n--- ${title} ---`);
      items.forEach((item, i) => this.#log(`${i + 1}. ${item.label}`));
      this.#log(`${items.length + 1}. Back to main menu`);
      const answer = await this.#ask(`Choose (1-${items.length + 1}): `);
      if (!this.#running) return;
      const index = Number(answer);
      if (index === items.length + 1) return;
      const item = Number.isInteger(index) ? items[index - 1] : undefined;
      if (!item) {
        this.#log(`Invalid choice. Please enter a number from 1 to ${items.length + 1}.`);
        continue;
      }
      await this.#execute(item.action, item.mutating);
    }
  }

  async #requireRole(userId, RoleClass, roleName) {
    const user = this.#manager.findUserById(userId);
    if (!user) throw new Error(`User ${userId} is not registered.`);
    if (!(user instanceof RoleClass)) {
      throw new Error(`Access denied: ${user.userId} is a ${user.userType}, not a ${roleName}.`);
    }
    return user;
  }

  async #officerMenu() {
    const officerId = await this.#ask('Your Service Officer user ID: ');
    await this.#requireRole(officerId, ServiceOfficer, 'Service Officer');

    await this.#runMenu('SERVICE OFFICER MENU', [
      {
        label: 'List Submitted requests waiting for review',
        action: () => this.#printRows(this.#manager.filterByStatus('Submitted'), 'No requests are waiting for review.')
      },
      {
        label: 'Review a request',
        mutating: true,
        action: async () => {
          const requestId = await this.#ask('Request ID: ');
          const comment = await this.#ask('Comment (optional): ');
          const request = this.#manager.reviewRequest(requestId, officerId, comment);
          this.#log(`Request ${request.requestId} is now ${request.status}.`);
        }
      },
      {
        label: 'Set request priority (request must be Reviewed)',
        mutating: true,
        action: async () => {
          const requestId = await this.#ask('Request ID: ');
          const priority = await this.#choose('New priority', ServiceRequest.PRIORITIES);
          const comment = await this.#ask('Comment (optional): ');
          const request = this.#manager.setRequestPriority(requestId, officerId, priority, comment);
          this.#log(`Request ${request.requestId} priority is now ${request.priority}.`);
        }
      },
      {
        label: 'Assign a Technician (request must be Reviewed)',
        mutating: true,
        action: async () => {
          const technicians = this.#manager.getAllUsers().filter((u) => u instanceof Technician);
          this.#log('Registered Technicians:');
          technicians.forEach((t) => this.#log(`  ${t.userId} - ${t.getFullName()} (${t.technicalSpeciality})`));
          const requestId = await this.#ask('Request ID: ');
          const technicianId = await this.#ask('Technician user ID: ');
          const comment = await this.#ask('Comment (optional): ');
          const request = this.#manager.assignTechnician(requestId, officerId, technicianId, comment);
          this.#log(`Request ${request.requestId} is now ${request.status}, assigned to ${request.assignedTechnician.getFullName()}.`);
        }
      },
      {
        label: 'Verify and close a Resolved request',
        mutating: true,
        action: async () => {
          const requestId = await this.#ask('Request ID: ');
          const comment = await this.#ask('Comment (optional): ');
          const request = this.#manager.closeRequest(requestId, officerId, comment);
          this.#log(`Request ${request.requestId} is now ${request.status}.`);
        }
      }
    ]);
  }

  async #technicianMenu() {
    const technicianId = await this.#ask('Your Technician user ID: ');
    await this.#requireRole(technicianId, Technician, 'Technician');

    await this.#runMenu('TECHNICIAN MENU', [
      {
        label: 'View my assigned requests',
        action: () => this.#printRows(this.#manager.filterByTechnician(technicianId), 'No requests are assigned to you.')
      },
      {
        label: 'Start work on a request',
        mutating: true,
        action: async () => {
          const requestId = await this.#ask('Request ID: ');
          const comment = await this.#ask('Comment (optional): ');
          const request = this.#manager.startWork(requestId, technicianId, comment);
          this.#log(`Request ${request.requestId} is now ${request.status}.`);
        }
      },
      {
        label: 'Add a progress note',
        mutating: true,
        action: async () => {
          const requestId = await this.#ask('Request ID: ');
          const note = await this.#ask('Progress note: ');
          this.#manager.addProgressNote(requestId, technicianId, note);
          this.#log('Progress note recorded.');
        }
      },
      {
        label: 'Resolve a request',
        mutating: true,
        action: async () => {
          const requestId = await this.#ask('Request ID: ');
          const comment = await this.#ask('Comment (optional): ');
          const request = this.#manager.resolveRequest(requestId, technicianId, comment);
          this.#log(`Request ${request.requestId} is now ${request.status}.`);
        }
      }
    ]);
  }

  async #filterSortMenu() {
    const show = (requests) => this.#printRows(requests, 'No matching requests.');
    await this.#runMenu('FILTER AND SORT REQUESTS', [
      { label: 'Filter by category', action: async () => show(this.#manager.filterByCategory(await this.#choose('Category', ServiceRequest.CATEGORIES))) },
      { label: 'Filter by status', action: async () => show(this.#manager.filterByStatus(await this.#choose('Status', ServiceRequest.STATUSES))) },
      { label: 'Filter by priority', action: async () => show(this.#manager.filterByPriority(await this.#choose('Priority', ServiceRequest.PRIORITIES))) },
      { label: 'Filter by assigned Technician', action: async () => show(this.#manager.filterByTechnician(await this.#ask('Technician user ID: '))) },
      { label: 'Sort by date submitted (newest first)', action: () => show(this.#manager.sortByDateSubmitted(false)) },
      { label: 'Sort by date submitted (oldest first)', action: () => show(this.#manager.sortByDateSubmitted(true)) },
      { label: 'Sort by priority (highest first)', action: () => show(this.#manager.sortByPriority(true)) },
      { label: 'Sort by priority (lowest first)', action: () => show(this.#manager.sortByPriority(false)) }
    ]);
  }

  // ---------------- main loop ----------------

  async run() {
    while (this.#running) {
      this.#log(MENU);
      const choice = await this.#ask('Enter choice (1-13): ');
      if (!this.#running) break;
      switch (choice) {
        case '1': await this.#execute(() => this.#registerUser()); break;
        case '2': await this.#execute(() => this.#submitRequest()); break;
        case '3': await this.#execute(() => this.#viewById()); break;
        case '4': await this.#execute(() => this.#viewMine()); break;
        case '5': await this.#execute(() => this.#printList(this.#manager.getAllRequests(), 'No requests recorded yet.')); break;
        case '6': await this.#execute(() => this.#updateMine()); break;
        case '7': await this.#execute(() => this.#cancelMine()); break;
        case '8': await this.#execute(() => this.#search()); break;
        case '9': await this.#execute(() => this.#summary()); break;
        case '10': this.#running = false; this.#log('Goodbye.'); break;
        case '11': await this.#execute(() => this.#officerMenu()); break;
        case '12': await this.#execute(() => this.#technicianMenu()); break;
        case '13': await this.#execute(() => this.#filterSortMenu()); break;
        default: this.#log('Invalid choice. Please enter a number from 1 to 13.');
      }
    }
    process.stdin.pause();
  }
}

module.exports = { CampusServiceApp };

if (require.main === module) {
  new CampusServiceApp().run();
}
