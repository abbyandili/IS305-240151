'use strict';

/** Trims a string; anything that is not a string becomes an empty string. */
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

module.exports = { clean };
