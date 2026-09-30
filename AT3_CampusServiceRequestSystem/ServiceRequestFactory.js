'use strict';

const { ServiceRequest } = require('./ServiceRequest');
const { HistoryEntry } = require('./HistoryEntry');
const { ICTSupportRequest } = require('./ICTSupportRequest');
const { MaintenanceRequest } = require('./MaintenanceRequest');
const { CleaningRequest } = require('./CleaningRequest');
const { GeneralServiceRequest } = require('./GeneralServiceRequest');

const REQUEST_CLASSES = [ICTSupportRequest, MaintenanceRequest, CleaningRequest, GeneralServiceRequest];
const CLASS_BY_CATEGORY = new Map(REQUEST_CLASSES.map((c) => [c.CATEGORY, c]));
const CLASS_BY_TYPE = new Map(REQUEST_CLASSES.map((c) => [c.name, c]));

/**
 * ServiceRequestFactory - the one place that decides WHICH request class to create.
 *  - createNew():      a brand-new request from a category chosen by the user.
 *  - createFromData(): rebuilds a request from plain data loaded from JSON.
 */
class ServiceRequestFactory {
  static requestClassFor(category) {
    const RequestClass = CLASS_BY_CATEGORY.get(String(category ?? '').trim());
    if (!RequestClass) {
      throw new Error(`Unsupported category "${category}". Allowed: ${ServiceRequest.CATEGORIES.join(', ')}.`);
    }
    return RequestClass;
  }

  static createNew(category, commonData, specialisedData = {}) {
    const RequestClass = ServiceRequestFactory.requestClassFor(category);
    return new RequestClass({ ...commonData, category: RequestClass.CATEGORY }, specialisedData);
  }

  /**
   * @param {object} savedData   one record from serviceRequests.json
   * @param {User} requester     the already restored requester object
   * @param {Technician|null} technician  the already restored assigned Technician, if any
   * @param {object[]} history   saved history rows for this request
   */
  static createFromData(savedData, requester, technician = null, history = []) {
    const RequestClass = CLASS_BY_TYPE.get(savedData?.requestType);
    if (!RequestClass) {
      throw new Error(`Unknown request type "${savedData?.requestType}". Known types: ${[...CLASS_BY_TYPE.keys()].join(', ')}.`);
    }
    if (!requester || requester.userId !== savedData.requesterId) {
      throw new Error(`Saved request ${savedData.requestId} does not match its requester.`);
    }

    const request = new RequestClass({
      requestId: savedData.requestId,
      requester,
      title: savedData.title,
      description: savedData.description,
      location: savedData.location,
      category: savedData.category,
      priority: savedData.priority
    }, savedData.details ?? {});

    request.restoreState({
      status: savedData.status,
      assignedTechnician: technician,
      dateSubmitted: savedData.dateSubmitted,
      dateUpdated: savedData.dateUpdated,
      history: history.map((row) => HistoryEntry.fromData(row))
    });
    return request;
  }
}

module.exports = { ServiceRequestFactory };
