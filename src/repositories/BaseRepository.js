class BaseRepository {
  constructor(supabaseStorage, jsonFileStorage, availabilityChecker) {
    this.supabase = supabaseStorage;
    this.localStore = jsonFileStorage;
    this.checkAvailability = availabilityChecker;
  }

  toClientFormat(row) { return row; }
  toDbFormat(data) { return data; }

  async getAll() {
    if (await this.checkAvailability()) {
      try {
        const data = await this.supabase.findAll();
        return data.map(row => this.toClientFormat(row));
      } catch (e) {
        console.warn(`[${this.constructor.name}] Supabase read failed:`, e.message);
      }
    }
    return this.localStore.readAll([]).map(row => this.toClientFormat(row));
  }

  async create(entityData) {
    const dbData = this.toDbFormat(entityData);

    const local = this.localStore.readAll([]);
    local.push(this.toClientFormat(dbData));
    this.localStore.writeAll(local);

    if (await this.checkAvailability()) {
      try {
        const result = await this.supabase.insert(dbData);
        return this.toClientFormat(result);
      } catch (e) {
        console.error(`[${this.constructor.name}] Supabase create failed:`, e.message);
      }
    }
    return this.toClientFormat(dbData);
  }

  async update(id, updates) {
    const local = this.localStore.readAll([]);
    const index = local.findIndex(item => item.id === id);
    let updated = null;

    if (index !== -1) {
      local[index] = { ...local[index], ...updates, id };
      this.localStore.writeAll(local);
      updated = local[index];
    }

    if (await this.checkAvailability()) {
      try {
        const dbUpdates = this.toDbFormat({ ...(updated || {}), ...updates, id });
        const result = await this.supabase.update(id, dbUpdates);
        return this.toClientFormat(result);
      } catch (e) {
        console.error(`[${this.constructor.name}] Supabase update failed:`, e.message);
      }
    }
    return updated ? this.toClientFormat(updated) : null;
  }

  async delete(id) {
    const local = this.localStore.readAll([]);
    this.localStore.writeAll(local.filter(item => item.id !== id));

    if (await this.checkAvailability()) {
      try {
        await this.supabase.remove(id);
      } catch (e) {
        console.error(`[${this.constructor.name}] Supabase delete failed:`, e.message);
      }
    }
    return true;
  }
}

module.exports = BaseRepository;
