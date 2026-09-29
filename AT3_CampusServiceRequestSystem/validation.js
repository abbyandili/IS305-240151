'use strict';

/** Trims a string; anything that is not a string becomes an empty string. */
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Returns a new Date for a Date or date string, or null when it is not a real date. */
function toValidDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

module.exports = { clean, toValidDate };
