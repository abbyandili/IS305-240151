'use strict';

const path = require('node:path');
const readline = require('node:readline');
const { User } = require('./User');
const { ServiceRequest } = require('./ServiceRequest');
const { ServiceOfficer } = require('./ServiceOfficer');
const { Technician } = require('./Technician');
const { ICTSupportRequest } = require('./ICTSupportRequest');
const { MaintenanceRequest } = require('./MaintenanceRequest');
const { CleaningRequest } = require('./CleaningRequest');
const { ServiceRequestManager } = require('./ServiceRequestManager');
const { ServiceRequestFactory } = require('./ServiceRequestFactory');
const { UserFactory } = require('./UserFactory');
const { PersistenceService } = require('./PersistenceService');
const { ReportService } = require('./ReportService');

// NOTE: this file never reads or writes JSON itself; PersistenceService does that.

const DEFAULT_DATA_DIRECTORY = path.join(__dirname, '..', 'data');

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
14. Administrator Menu
============================================`;

// Extra questions asked for each user type / request category.
const USER_PROMPTS = {
  Student: [
    { key: 'programme', label: 'Programme' },
    { key: 'yearLevel', label: 'Year level (1-6)' }
  ],
  Staff: [{ key: 'department', label: 'Department' }],
  'Service Officer': [{ key: 'serviceSection', label: 'Service section' }],
  Technician: [{ key: 'technicalSpeciality', label: 'Technical speciality' }],
  Administrator: []
};

const REQUEST_PROMPTS = {
  'ICT Support': [
    { key: 'deviceType', label: 'Device type' },
    { key: 'systemName', label: 'System name' },
    { key: 'faultType', label: 'Fault type' },
    { key: 'networkImpact', label: 'Network impact', options: ICTSupportRequest.NETWORK_IMPACTS, defaultValue: 'None' }
  ],
  'Facilities Maintenance': [
    { key: 'building', label: 'Building' },
    { key: 'roomNumber', label: 'Room number' },
    { key: 'hazardLevel', label: 'Hazard level', options: MaintenanceRequest.HAZARD_LEVELS, defaultValue: 'None' },
    { key: 'equipmentAffected', label: 'Equipment affected' }
  ],
  'Cleaning and Sanitation': [
    { key: 'cleaningArea', label: 'Cleaning area' },
    { key: 'hygieneRisk', label: 'Hygiene risk', options: CleaningRequest.HYGIENE_RISKS, defaultValue: 'Low' },
    { key: 'serviceType', label: 'Service type', options: CleaningRequest.SERVICE_TYPES },
    { key: 'preferredServiceTime', label: 'Preferred service time (HH:MM, 24-hour)' }
  ],
  'General Campus Service': [
    { key: 'serviceType', label: 'Service type' },
    { key: 'expectedOutcome', label: 'Expected outcome' }
  ]
};

/**
 * CampusServiceApp - the console menu only. It asks questions, calls the manager,
 * and prints results. Business rules live in the domain classes and the manager.
 */
class CampusServiceApp {
  #manager;
  #persistence;
  #reports;
  #readline;
  #lines;
  #output;
  #running = true;

  /**
   * @param {object} options
   * @param {ServiceRequestManager} [options.manager]
   * @param {PersistenceService|null} [options.persistence] null = keep everything in memory only
   * @param {ReportService} [options.reports]
   * @param {NodeJS.ReadableStream} [options.input]  where answers are read from
   * @param {{write: Function}} [options.output]     where text is printed (any object with write())
   */
  constructor({
    manager = new ServiceRequestManager(),
    persistence = null,
    reports = new ReportService(),
    input = process.stdin,
    output = process.stdout
  } = {}) {
    this.#manager = manager;
    this.#output = output;
    this.#persistence = persistence;
    this.#reports = reports;
    this.#readline = readline.createInterface({ input });
    // An async iterator over input lines works for typing AND piped input.
    this.#lines = this.#readline[Symbol.asyncIterator]();
  }

  // ---------------- input and output helpers ----------------

  #write(text) {
    this.#output.write(text);
  }

  #log(text = '') {
    this.#output.write(`${text}\n`);
  }

  async #ask(question) {
    this.#write(question);
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

  async #askFields(prompts) {
    const data = {};
    for (const prompt of prompts) {
      data[prompt.key] = prompt.options
        ? await this.#choose(prompt.label, prompt.options, prompt.defaultValue ?? '')
        : await this.#ask(`${prompt.label}: `);
    }
    return data;
  }

  // ---------------- output helpers ----------------

  #print(request) {
    this.#log('\n' + request.getRequestSummary()); // polymorphic: each request type prints its own details
  }

  #printHistory(request) {
    this.#log('\nHistory:');
    request.getHistory().forEach((h) => {
      const note = h.comment ? ` - ${h.comment}` : '';
      this.#log(`  [${h.timestamp.toLocaleString()}] ${h.action}: ${h.previousStatus} -> ${h.newStatus} by ${h.actorId} (${h.actorRole})${note}`);
    });
  }

  #printList(requests, emptyMessage) {
    if (requests.length === 0) return this.#log(emptyMessage);
    requests.forEach((r) => this.#print(r));
    this.#log(`\n${requests.length} request(s) shown.`);
  }

  #printRows(requests, emptyMessage) {
    if (requests.length === 0) return this.#log(emptyMessage);
    this.#log(`\n${'ID'.padEnd(8)} ${'Priority'.padEnd(8)} ${'Status'.padEnd(11)} ${'Category'.padEnd(24)} Title`);
    requests.forEach((r) => {
      this.#log(`${r.requestId.padEnd(8)} ${r.priority.padEnd(8)} ${r.status.padEnd(11)} ${r.category.padEnd(24)} ${r.title}`);
    });
    this.#log(`\n${requests.length} request(s) shown.`);
  }

  #printCounts(title, counts, emptyMessage = 'No data to report.') {
    const entries = Object.entries(counts);
    this.#log(`\n${title}`);
    if (entries.length === 0) return this.#log(`  ${emptyMessage}`);
    entries.forEach(([label, count]) => this.#log(`  ${label.padEnd(34)} ${count}`));
  }

  #nextRequestId() {
    let number = 1;
    const format = (n) => `REQ${String(n).padStart(3, '0')}`;
    while (this.#manager.findRequestById(format(number))) number++;
    return format(number);
  }

  async #save() {
    if (!this.#persistence) return;
    try {
      await this.#persistence.saveFrom(this.#manager);
    } catch (error) {
      this.#log(`Warning: your change is in memory but could not be saved. ${error.message}`);
    }
  }

  /** Runs one menu action; prints any error and keeps the program running; saves after changes. */
  async #execute(action, mutating = false) {
    try {
      await action();
    } catch (error) {
      this.#log(`Error: ${error.message}`);
    }
    if (mutating) await this.#save(); // rejected attempts are audited too, so save either way
  }

  // ---------------- Pass menu actions ----------------

  async #registerUser() {
    const userId = await this.#ask('User ID: ');
    const firstName = await this.#ask('First name: ');
    const lastName = await this.#ask('Last name: ');
    const email = await this.#ask('Email: ');
    const userType = await this.#choose('User type', User.USER_TYPES, 'Student');
    const extra = await this.#askFields(USER_PROMPTS[userType] ?? []);
    const user = UserFactory.createFromData({ userId, firstName, lastName, email, userType, ...extra });
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
    ServiceRequestFactory.requestClassFor(category); // reject an unsupported category before asking more
    const priority = await this.#choose('Priority', ServiceRequest.PRIORITIES, 'Normal');
    this.#log(`Details for ${category}:`);
    const specialised = await this.#askFields(REQUEST_PROMPTS[category]);

    const request = ServiceRequestFactory.createNew(category, {
      requestId: this.#nextRequestId(),
      requester, title, description, location, priority
    }, specialised);
    this.#manager.submitRequest(request);
    this.#log(`Request submitted with ID ${request.requestId} (status: ${request.status}).`);
  }

  async #viewById() {
    const id = await this.#ask('Request ID: ');
    const request = this.#manager.findRequestById(id);
    if (!request) throw new Error(`Request ${id} was not found.`);
    this.#print(request);
    this.#printHistory(request);
  }

  async #viewMine() {
    const userId = await this.#ask('Your user ID: ');
    if (!this.#manager.findUserById(userId)) throw new Error(`User ${userId} is not registered.`);
    this.#printList(this.#manager.getRequestsByUser(userId), 'You have no requests.');
  }

  async #updateMine() {
    const requestId = await this.#ask('Request ID to update: ');
    const userId = await this.#ask('Your user ID: ');
    this.#log('Press Enter to keep the current value. (The category cannot be changed.)');
    const changes = {};
    for (const field of ['title', 'description', 'location']) {
      const value = await this.#ask(`New ${field}: `);
      if (value) changes[field] = value;
    }
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
    if (Object.keys(summary).length === 0) return this.#log('No requests recorded yet.');
    this.#log('\nRequests by status:');
    Object.entries(summary).forEach(([status, count]) => this.#log(`  ${status.padEnd(12)} ${count}`));
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

  async #administratorMenu() {
    const adminId = await this.#ask('Your Administrator user ID: ');
    const admin = this.#manager.findUserById(adminId);
    if (!admin) throw new Error(`User ${adminId} is not registered.`);
    if (admin.userType !== 'Administrator') {
      throw new Error(`Access denied: ${admin.userId} is a ${admin.userType}, not an Administrator.`);
    }

    const requests = () => this.#manager.getAllRequests();
    await this.#runMenu('ADMINISTRATOR MENU', [
      { label: 'Report: requests by status', action: () => this.#printCounts('Requests by status', this.#reports.requestsByStatus(requests())) },
      { label: 'Report: requests by category', action: () => this.#printCounts('Requests by category', this.#reports.requestsByCategory(requests())) },
      { label: 'Report: requests by priority', action: () => this.#printCounts('Requests by priority', this.#reports.requestsByPriority(requests())) },
      { label: 'Report: urgent requests', action: () => this.#printRows(this.#reports.urgentRequests(requests()), 'No open urgent requests.') },
      {
        label: 'Report: overdue requests',
        action: () => {
          const overdue = this.#reports.overdueRequests(requests());
          if (overdue.length === 0) return this.#log('No overdue requests.');
          this.#log('\nOverdue requests (past their target resolution time):');
          overdue.forEach(({ request, hoursOverdue }) =>
            this.#log(`  ${request.requestId.padEnd(8)} ${request.status.padEnd(11)} ${String(hoursOverdue).padStart(8)} hours overdue - ${request.title}`));
        }
      },
      { label: 'Report: requests assigned to each Technician', action: () => this.#printCounts('Requests assigned to each Technician', this.#reports.requestsPerTechnician(requests())) },
      { label: 'Report: completed requests by Technician', action: () => this.#printCounts('Completed (Resolved or Closed) requests by Technician', this.#reports.completedByTechnician(requests())) },
      {
        label: 'Report: average resolution time',
        action: () => {
          const { count, averageHours } = this.#reports.averageResolutionHours(requests());
          this.#log(count === 0
            ? '\nNo resolved requests yet.'
            : `\nAverage resolution time: ${averageHours} hours (based on ${count} resolved request(s)).`);
        }
      },
      { label: 'Report: request volume by campus location', action: () => this.#printCounts('Request volume by campus location', this.#reports.volumeByLocation(requests())) },
      {
        label: 'Polymorphism: priority score and target time for every request',
        action: () => {
          const all = requests();
          if (all.length === 0) return this.#log('No requests recorded yet.');
          this.#log(`\n${'ID'.padEnd(8)} ${'Class'.padEnd(22)} ${'Score'.padEnd(6)} Target`);
          for (const request of all) {
            // The SAME calls work on every request type; each class answers in its own way.
            this.#log(`${request.requestId.padEnd(8)} ${request.constructor.name.padEnd(22)} ${String(request.calculatePriorityScore()).padEnd(6)} ${request.getTargetResolutionHours()} hours`);
          }
        }
      },
      {
        label: 'View audit log',
        action: () => {
          const entries = this.#manager.getAuditEntries();
          if (entries.length === 0) return this.#log('The audit log is empty.');
          this.#log('');
          entries.forEach((e) =>
            this.#log(`${e.auditId} | ${e.timestamp.toLocaleString()} | ${e.actorId} | ${e.action} | ${e.requestId ?? '-'} | ${e.outcome} | ${e.description}`));
        }
      },
      {
        label: 'View all users',
        action: () => {
          this.#log('');
          this.#manager.getAllUsers().forEach((u) => this.#log(u.displayInfo()));
        }
      }
    ]);
  }

  // ---------------- main loop ----------------

  async #loadSavedData() {
    if (!this.#persistence) return true;
    try {
      const counts = await this.#persistence.loadInto(this.#manager);
      this.#log(`Loaded ${counts.users} user(s), ${counts.requests} request(s) and ${counts.auditEntries} audit entr${counts.auditEntries === 1 ? 'y' : 'ies'} from ${this.#persistence.dataDirectory}`);
      return true;
    } catch (error) {
      this.#log(`Error: saved data could not be loaded. ${error.message}`);
      this.#log('The program is stopping so your data files are not overwritten. Fix or delete the file named above and start again.');
      return false;
    }
  }

  async run() {
    if (!(await this.#loadSavedData())) {
      this.#readline.close();
      return;
    }

    const actions = {
      1: { action: () => this.#registerUser(), mutating: true },
      2: { action: () => this.#submitRequest(), mutating: true },
      3: { action: () => this.#viewById() },
      4: { action: () => this.#viewMine() },
      5: { action: () => this.#printList(this.#manager.getAllRequests(), 'No requests recorded yet.') },
      6: { action: () => this.#updateMine(), mutating: true },
      7: { action: () => this.#cancelMine(), mutating: true },
      8: { action: () => this.#search() },
      9: { action: () => this.#summary() },
      11: { action: () => this.#officerMenu() },
      12: { action: () => this.#technicianMenu() },
      13: { action: () => this.#filterSortMenu() },
      14: { action: () => this.#administratorMenu() }
    };

    while (this.#running) {
      this.#log(MENU);
      const choice = await this.#ask('Enter choice (1-14): ');
      if (!this.#running) break;
      if (choice === '10') {
        this.#running = false;
        this.#log('Goodbye.');
        break;
      }
      const entry = Object.hasOwn(actions, choice) ? actions[choice] : undefined;
      if (!entry) {
        this.#log('Invalid choice. Please enter a number from 1 to 14.');
        continue;
      }
      await this.#execute(entry.action, entry.mutating);
    }
    this.#readline.close();
  }
}

module.exports = { CampusServiceApp, DEFAULT_DATA_DIRECTORY };

if (require.main === module) {
  new CampusServiceApp({ persistence: new PersistenceService(DEFAULT_DATA_DIRECTORY) }).run();
}
