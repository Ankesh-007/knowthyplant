class SupabaseStorage {
  constructor(supabaseClient, tableName) {
    this.client = supabaseClient;
    this.table = tableName;
  }

  async findAll(options = {}) {
    const { orderBy = 'id', ascending = true, limit } = options;
    let query = this.client.from(this.table).select('*').order(orderBy, { ascending });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findByField(field, value) {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq(field, value);
    if (error) throw error;
    return data;
  }

  async insert(record) {
    const { data, error } = await this.client
      .from(this.table)
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id, updates) {
    const { data, error } = await this.client
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id) {
    const { error } = await this.client
      .from(this.table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async upsert(records, conflictKeys) {
    const { error } = await this.client
      .from(this.table)
      .upsert(records, { onConflict: conflictKeys });
    if (error) throw error;
  }
}

module.exports = SupabaseStorage;
