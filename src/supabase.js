
class SupabaseClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
  }

  async query(sql, values = []) {
    const response = await fetch(`${this.url}/rest/v1/rpc/exec_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.anonKey,
        'Authorization': `Bearer ${this.anonKey}`,
      },
      body: JSON.stringify({ sql, values }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase query error: ${error}`);
    }

    return await response.json();
  }

  async insert(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');
    const columnList = columns.join(',');

    const sql = `
      INSERT INTO ${table} (${columnList})
      VALUES (${placeholders})
      RETURNING *
    `;

    return this.query(sql, values);
  }

  async select(table, where = {}) {
    let sql = `SELECT * FROM ${table}`;
    const values = [];

    if (Object.keys(where).length > 0) {
      const conditions = Object.entries(where)
        .map(([key, value], index) => {
          values.push(value);
          return `${key} = $${index + 1}`;
        })
        .join(' AND ');
      sql += ` WHERE ${conditions}`;
    }

    return this.query(sql, values);
  }

  async update(table, data, where) {
    const updates = Object.entries(data)
      .map(([key, value], index) => {
        return `${key} = $${index + 1}`;
      })
      .join(',');

    const values = Object.values(data);
    const whereIndex = values.length;
    const whereConditions = Object.entries(where)
      .map(([key, value], index) => {
        values.push(value);
        return `${key} = $${whereIndex + index + 1}`;
      })
      .join(' AND ');

    const sql = `
      UPDATE ${table}
      SET ${updates}, updated_at = NOW()
      WHERE ${whereConditions}
      RETURNING *
    `;

    return this.query(sql, values);
  }

  async getUnsentArticles() {
    return this.select('meshtastic_articles', { sent_to_telegram: false });
  }

  async articleExists(url) {
    const result = await this.select('meshtastic_articles', { url });
    return result && result.length > 0;
  }

  async markAsSent(id) {
    return this.update('meshtastic_articles', { sent_to_telegram: true }, { id });
  }
}

export default SupabaseClient;
