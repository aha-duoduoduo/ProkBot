import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { JsonStore } from "./storage.mjs";
import { check } from "./security.mjs";

const slowClientLimit = 256 * 1024;
const event = (item) => `id: ${item.id}\nevent: notification\ndata: ${JSON.stringify(item)}\n\n`;

export class Notifications {
  constructor(dataDir, { retain = 1000, onPublish } = {}) {
    this.store = new JsonStore(join(dataDir, "notifications.json"), {
      version: 1,
      items: [],
    });
    this.retain = retain;
    this.onPublish = onPublish;
    this.clients = new Set();
    this.backlogs = new WeakMap();
  }
  async load() {
    await this.store.load();
    return this;
  }
  list(after) {
    const items = this.store.value.items;
    const index = after ? items.findIndex((item) => item.id === after) : -1;
    return items.slice(index + 1);
  }
  async publish(input) {
    check(
      ["message", "completed", "attention", "failed", "test"].includes(input.type),
      400,
      "不支持的通知类型",
    );
    check(
      typeof input.agentId === "string" &&
        /^[A-Za-z0-9_-]{1,128}$/.test(input.agentId),
      400,
      "会话 ID 无效",
    );
    check(
      typeof input.title === "string" &&
        input.title.trim().length > 0 &&
        input.title.length <= 160,
      400,
      "通知标题需要 1–160 个字符",
    );
    check(
      typeof input.body === "string" && input.body.length <= 2000,
      400,
      "通知正文过长",
    );
    const id = input.id ?? randomUUID();
    check(
      typeof id === "string" && /^[A-Za-z0-9_.:-]{1,160}$/.test(id),
      400,
      "通知 ID 无效",
    );
    const item = {
      id,
      type: input.type,
      agentId: input.agentId,
      title: input.title.trim(),
      body: input.body,
      createdAt: new Date().toISOString(),
      deepLink: `grokbot-local://agent/${input.agentId}`,
    };
    const result = await this.store.mutate((state) => {
      const existing = state.items.find((value) => value.id === id);
      if (existing) return { item: existing, created: false };
      state.items.push(item);
      state.items = state.items.slice(-this.retain);
      return { item, created: true };
    });
    // The Host can retry an identical ID after an interrupted enqueue.
    await this.onPublish?.(result.item);
    if (result.created)
      for (const response of this.clients) this.send(response, result.item);
    return result;
  }
  send(response, item) {
    if (response.destroyed || response.writableEnded) return;
    if (response.writableLength > this.limit(response)) return response.destroy();
    response.write(event(item));
  }
  limit(response) {
    return slowClientLimit + (this.backlogs.get(response) ?? 0);
  }
  subscribe(request, response) {
    response.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    });
    response.flushHeaders();
    // The retained backlog is bounded. Replay it whole so a client that was
    // offline for a long time can advance its cursor; only later unflushed
    // output counts as a slow client.
    const backlog = this.list(request.headers["last-event-id"]).map(event).join("") + ": connected\n\n";
    this.backlogs.set(response, Buffer.byteLength(backlog));
    this.clients.add(response);
    response.write(backlog);
    const heartbeat = setInterval(() => {
      if (response.writableLength > this.limit(response)) response.destroy();
      else response.write(": heartbeat\n\n");
    }, 15_000);
    heartbeat.unref();
    response.on("close", () => {
      clearInterval(heartbeat);
      this.clients.delete(response);
    });
  }
  close() {
    for (const response of this.clients) response.destroy();
  }
}
