'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * FileRepository - reads and writes ONE JSON file that holds an array of plain records.
 * The four specific repositories extend this class. Only repositories touch the file system.
 */
class FileRepository {
  #filePath;
  #idField;

  constructor(filePath, idField) {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('A data file path is required.');
    if (typeof idField !== 'string' || !idField.trim()) throw new Error('An ID field name is required.');
    this.#filePath = filePath;
    this.#idField = idField;
  }

  get filePath() { return this.#filePath; }
  get idField() { return this.#idField; }

  /** Reads every record. A missing or empty file gives an empty array. */
  async loadAll() {
    let text;
    try {
      text = await fs.readFile(this.#filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return []; // file does not exist yet
      throw new Error(`Cannot read ${this.#filePath}: ${error.message}`);
    }
    if (text.trim() === '') return [];

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Cannot read ${this.#filePath}: the file does not contain valid JSON.`);
    }
    if (!Array.isArray(data)) {
      throw new Error(`Cannot read ${this.#filePath}: expected a JSON array of records.`);
    }
    return data;
  }

  /** Creates the file containing an empty array when it does not exist. */
  async ensureFile() {
    try {
      await fs.access(this.#filePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Cannot access ${this.#filePath}: ${error.message}`);
      await this.saveAll([]);
    }
  }

  /** Replaces the file contents. Nothing is written if any record is incomplete or duplicated. */
  async saveAll(records) {
    this.#assertValidRecords(records);
    const temporaryPath = `${this.#filePath}.tmp`;
    try {
      await fs.mkdir(path.dirname(this.#filePath), { recursive: true });
      await fs.writeFile(temporaryPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
      await fs.rename(temporaryPath, this.#filePath); // write whole file, then swap: no half-written files
    } catch (error) {
      throw new Error(`Cannot write ${this.#filePath}: ${error.message}`);
    }
  }

  #assertValidRecords(records) {
    if (!Array.isArray(records)) throw new Error('Records to save must be an array.');
    const seen = new Set();
    for (const record of records) {
      if (record === null || typeof record !== 'object' || Array.isArray(record)) {
        throw new Error('Every record to save must be a plain object.');
      }
      const id = record[this.#idField];
      if (typeof id !== 'string' || !id.trim()) {
        throw new Error(`Cannot save an incomplete record: "${this.#idField}" is missing.`);
      }
      if (seen.has(id)) throw new Error(`Cannot save duplicate ${this.#idField} "${id}".`);
      seen.add(id);
    }
  }

  async create(record) {
    const records = await this.loadAll();
    const candidate = [...records, record];
    this.#assertValidRecords(candidate); // rejects incomplete and duplicate records
    await this.saveAll(candidate);
    return record;
  }

  async findById(id) {
    const records = await this.loadAll();
    return records.find((r) => String(r[this.#idField]) === String(id)) ?? null;
  }

  async update(id, changes) {
    if (changes && Object.hasOwn(changes, this.#idField)) {
      throw new Error(`The ${this.#idField} of a record cannot be changed.`);
    }
    const records = await this.loadAll();
    const index = records.findIndex((r) => String(r[this.#idField]) === String(id));
    if (index === -1) throw new Error(`No record with ${this.#idField} "${id}" was found.`);
    records[index] = { ...records[index], ...changes };
    await this.saveAll(records);
    return records[index];
  }
}

module.exports = { FileRepository };
