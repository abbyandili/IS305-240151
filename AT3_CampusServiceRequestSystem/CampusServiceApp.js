'use strict';

const readline = require('node:readline');
const { User } = require('./User');
const { StudentRequester } = require('./StudentRequester');
const { StaffRequester } = require('./StaffRequester');
const { ServiceOfficer } = require('./ServiceOfficer');
const { Technician } = require('./Technician');
const { ServiceRequest } = require('./ServiceRequest');
const { ICTSupportRequest } = require('./ICTSupportRequest');
const { MaintenanceRequest } = require('./MaintenanceRequest');
const { CleaningRequest } = require('./CleaningRequest');
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

// Extra questions asked for each user type / request category.
const USER_PROMPTS = {
  Student: [{ key: 'programme', label: 'Programme' }, { key: 'yearLevel', label: 'Year level (1-6)' }],
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
  'General Campus Service': [] // no specialised class yet at Credit stage - the base ServiceRequest is used directly
};

// Which request class to build for each category. General Campus Service has
// no specialised class at Credit stage, so it uses the base ServiceRequest.
const REQUEST_CLASSES = {
  'ICT Support': ICTSupportRequest,
  'Facilities Maintenance': MaintenanceRequest,
  'Cleaning and Sanitation': CleaningRequest,
  'General Campus Service': ServiceRequest
};

/**
 * CampusServiceApp - console menu only. It asks questions, calls the manager,
 * and prints results. Business rules live in the domain classes and the manager.
 */
class CampusServiceApp {
  #manager;
  #lines;
  #running = true;

  constructor(manager = new ServiceRequestManager(), input = process.stdin) {
    this.#manager = manager;
    this.#lines = readline.createInterface({ input })[Symbol.asyncIterator]();
  }

  async #ask(question) {
    process.stdout.write(question);
    const { value, done } = await this.#lines.next();
    if (done) { this.#running = false; return ''; }
    return value.trim();
  }

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

  #log(text = '') { console.log(text); }

  #print(request) { this.#log('\n' + request.getRequestSummary()); }

  #printList(requests, emptyMessage) {
    if (requests.length === 0) return this.#log(emptyMessage);
    requests.forEach((r) => this.#print(r));
    this.#log(`\n${requests.length} request(s) shown.`);
  }

  #printRows(requests, emptyMessage) {
    if (requests.length === 0) return this.#log(emptyMessage);
    this.#log(`\n${'ID'.padEnd(8)} ${'Priority'.padEnd(8)} ${'Status'.padEnd(11)} ${'Category'.padEnd(24)} Title`);
    requests.forEach((r) => this.#log(`${r.requestId.padEnd(8)} ${r.priority.padEnd(8)} ${r.status.padEnd(11)} ${r.category.padEnd(24)} ${r.title}`));
    this.#log(`\n${requests.length} request(s) shown.`);
  }

  #nextRequestId() {
    let number = 1;
    const format = (n) => `REQ${String(n).padStart(3, '0')}`;
    while (this.#manager.findRequestById(format(number))) number++;
    return format(number);
  }

  async #execute(action) {
    try { await action(); } catch (error) { this.#log(`Error: ${error.message}`); }
  }

  // ---------------- menu actions ----------------

  /** Builds the correct User subclass for the chosen type, asking the extra question it needs. */
  async #registerUser() {
    const userId = await this.#ask('User ID: ');
    const firstName = await this.#ask('First name: ');
    const lastName = await this.#ask('Last name: ');
    const email = await this.#ask('Email: ');
    const userType = await this.#choose('User type', User.USER_TYPES, 'Student');
    const extra = await this.#askFields(USER_PROMPTS[userType] ?? []);

    let user;
    switch (userType) {
      case 'Student': user = new StudentRequester(userId, firstName, lastName, email, extra.programme, extra.yearLevel); break;
      case 'Staff': user = new StaffRequester(userId, firstName, lastName, email, extra.department); break;
      case 'Service Officer': user = new ServiceOfficer(userId, firstName, lastName, email, extra.serviceSection); break;
      case 'Technician': user = new Technician(userId, firstName, lastName, email, extra.technicalSpeciality); break;
      default: user = new User(userId, firstName, lastName, email, userType); // Administrator
    }
    this.#manager.registerUser(user);
    this.#log(`User registered: ${user.displayInfo()}`);
  }

  /** Builds the correct ServiceRequest subclass for the chosen category. */
  async #submitRequest() {
    const userId = await this.#ask('Your user ID: ');
    const requester = this.#manager.findUserById(userId);
    if (!requester) throw new Error(`User ${userId} is not registered. Register first (option 1).`);

    const title = await this.#ask('Title: ');
    const description = await this.#ask('Description: ');
    const location = await this.#ask('Campus location: ');
    const category = await this.#choose('Category', ServiceRequest.CATEGORIES);
    const RequestClass = REQUEST_CLASSES[category];
    if (!RequestClass) throw new Error(`Unsupported category "${category}".`);
    const priority = await this.#choose('Priority', ServiceRequest.PRIORITIES, 'Normal');
    const specialised = await this.#askFields(REQUEST_PROMPTS[category] ?? []);

    const commonData = { requestId: this.#nextRequestId(), requester, title, description, location, category, priority };
    const request = RequestClass === ServiceRequest ? new ServiceRequest(commonData) : new RequestClass(commonData, specialised);
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
    const entries = Object.entries(summary);
    if (entries.length === 0) return this.#log('No requests recorded yet.');
    this.#log('\nRequests by status:');
    entries.forEach(([status, count]) => this.#log(`  ${status.padEnd(12)} ${count}`));
  }

  // ---------------- sub-menus ----------------

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
      if (!item) { this.#log(`Invalid choice. Please enter a number from 1 to ${items.length + 1}.`); continue; }
      await this.#execute(item.action);
    }
  }

  async #requireRole(userId, RoleClass, roleName) {
    const user = this.#manager.findUserById(userId);
    if (!user) throw new Error(`User ${userId} is not registered.`);
    if (!(user instanceof RoleClass)) throw new Error(`Access denied: ${user.userId} is a ${user.userType}, not a ${roleName}.`);
    return user;
  }

  async #officerMenu() {
    const officerId = await this.#ask('Your Service Officer user ID: ');
    await this.#requireRole(officerId, ServiceOfficer, 'Service Officer');

    await this.#runMenu('SERVICE OFFICER MENU', [
      { label: 'List Submitted requests waiting for review', action: () => this.#printRows(this.#manager.filterByStatus('Submitted'), 'No requests are waiting for review.') },
      { label: 'Review a request', action: async () => {
        const requestId = await this.#ask('Request ID: ');
        const comment = await this.#ask('Comment (optional): ');
        const request = this.#manager.reviewRequest(requestId, officerId, comment);
        this.#log(`Request ${request.requestId} is now ${request.status}.`);
      }},
      { label: 'Set request priority (request must be Reviewed)', action: async () => {
        const requestId = await this.#ask('Request ID: ');
        const priority = await this.#choose('New priority', ServiceRequest.PRIORITIES);
        const comment = await this.#ask('Comment (optional): ');
        const request = this.#manager.setRequestPriority(requestId, officerId, priority, comment);
        this.#log(`Request ${request.requestId} priority is now ${request.priority}.`);
      }},
      { label: 'Assign a Technician (request must be Reviewed)', action: async () => {
        const technicians = this.#manager.getAllUsers().filter((u) => u instanceof Technician);
        this.#log('Registered Technicians:');
        technicians.forEach((t) => this.#log(`  ${t.userId} - ${t.getFullName()} (${t.technicalSpeciality})`));
        const requestId = await this.#ask('Request ID: ');
        const technicianId = await this.#ask('Technician user ID: ');
        const comment = await this.#ask('Comment (optional): ');
        const request = this.#manager.assignTechnician(requestId, officerId, technicianId, comment);
        this.#log(`Request ${request.requestId} is now ${request.status}, assigned to ${request.assignedTechnician.getFullName()}.`);
      }},
      { label: 'Verify and close a Resolved request', action: async () => {
        const requestId = await this.#ask('Request ID: ');
        const comment = await this.#ask('Comment (optional): ');
        const request = this.#manager.closeRequest(requestId, officerId, comment);
        this.#log(`Request ${request.requestId} is now ${request.status}.`);
      }}
    ]);
  }

  async #technicianMenu() {
    const technicianId = await this.#ask('Your Technician user ID: ');
    await this.#requireRole(technicianId, Technician, 'Technician');

    await this.#runMenu('TECHNICIAN MENU', [
      { label: 'View my assigned requests', action: () => this.#printRows(this.#manager.filterByTechnician(technicianId), 'No requests are assigned to you.') },
      { label: 'Start work on a request', action: async () => {
        const requestId = await this.#ask('Request ID: ');
        const comment = await this.#ask('Comment (optional): ');
        const request = this.#manager.startWork(requestId, technicianId, comment);
        this.#log(`Request ${request.requestId} is now ${request.status}.`);
      }},
      { label: 'Add a progress note', action: async () => {
        const requestId = await this.#ask('Request ID: ');
        const note = await this.#ask('Progress note: ');
        this.#manager.addProgressNote(requestId, technicianId, note);
        this.#log('Progress note recorded.');
      }},
      { label: 'Resolve a request', action: async () => {
        const requestId = await this.#ask('Request ID: ');
        const comment = await this.#ask('Comment (optional): ');
        const request = this.#manager.resolveRequest(requestId, technicianId, comment);
        this.#log(`Request ${request.requestId} is now ${request.status}.`);
      }}
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
