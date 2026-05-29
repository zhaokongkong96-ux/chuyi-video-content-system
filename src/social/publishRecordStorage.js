export class MockPublishRecordStorage {
  constructor() {
    this.records = new Map();
  }

  async createPublishRecord(data) {
    const now = new Date().toISOString();
    const record = {
      topic: data.topic,
      mode: data.mode || "manual",
      status: data.status || "manual_publish_ready",
      platforms: data.platforms || {
        xiaohongshu: { status: "pending_manual_publish" },
        douyin: { status: "pending_manual_publish" },
      },
      image_count: data.image_count || 0,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
    };
    this.records.set(record.topic, record);
    return record;
  }

  async updatePublishStatus(topic, updates) {
    const existing = this.records.get(topic);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      platforms: {
        ...existing.platforms,
        ...(updates.platforms || {}),
      },
      updated_at: new Date().toISOString(),
    };
    this.records.set(topic, updated);
    return updated;
  }

  async getPublishRecord(topic) {
    return this.records.get(topic) || null;
  }
}

export function createPublishRecordStorage() {
  return new MockPublishRecordStorage();
}
