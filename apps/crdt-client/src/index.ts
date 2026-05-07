import * as Y from "yjs";
import { syncedStore } from "@syncedstore/core";

const STORAGE_PREFIX = "crdt:";
const COMPACT_THRESHOLD = 50;
const SAVE_DEBOUNCE_MS = 500;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

const encodeBase64 = (bytes: Uint8Array): string => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));

const decodeBase64 = (str: string): Uint8Array => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

const isLocalHost = (host: string): boolean => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);

type YDocEventName = Parameters<Y.Doc["on"]>[0];

export class Document<T extends Record<string, unknown> = Record<string, unknown>> {
	readonly yDoc: Y.Doc;
	private ws: WebSocket | null = null;
	private destroyed = false;
	private reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private saveTimer: ReturnType<typeof setTimeout> | null = null;
	private updateCount = 0;
	private readonly storageKey: string;
	private readonly listenerMap = new Map<
		(store: T, document: Document<T>, ...args: any[]) => void,
		Map<YDocEventName, (...args: any[]) => void>
	>();

	public store: T;

	constructor(
		private readonly host: string,
		private readonly id: string,
		initialStore: T = {} as T,
	) {
		this.storageKey = `${STORAGE_PREFIX}${id}`;
		this.yDoc = new Y.Doc();
		this.load();
		this.yDoc.on("update", this.handleUpdate.bind(this));
		this.connect();
		this.store = syncedStore(initialStore as any, this.yDoc) as T;
	}

	private load(): void {
		const stored = localStorage.getItem(this.storageKey);
		if (!stored) return;
		try {
			Y.applyUpdate(this.yDoc, decodeBase64(stored));
		} catch {
			localStorage.removeItem(this.storageKey);
		}
	}

	private save(): void {
		localStorage.setItem(this.storageKey, encodeBase64(Y.encodeStateAsUpdate(this.yDoc)));
	}

	private handleUpdate(update: Uint8Array, origin: unknown): void {
		if (origin !== this.ws && this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(update);
		}

		this.updateCount++;
		if (this.updateCount >= COMPACT_THRESHOLD) {
			// Compact: flush a full state snapshot immediately, clearing accumulated updates
			this.updateCount = 0;
			if (this.saveTimer !== null) {
				clearTimeout(this.saveTimer);
				this.saveTimer = null;
			}
			this.save();
		} else {
			if (this.saveTimer !== null) clearTimeout(this.saveTimer);
			this.saveTimer = setTimeout(() => {
				this.saveTimer = null;
				this.save();
			}, SAVE_DEBOUNCE_MS);
		}
	}

	private connect(): void {
		if (this.destroyed) return;

		const sv = encodeBase64(Y.encodeStateVector(this.yDoc));
		const protocol = isLocalHost(this.host) ? "ws" : "wss";
		const url = `${protocol}://${this.host}/crdt/ws/${encodeURIComponent(this.id)}?sv=${encodeURIComponent(sv)}`;

		const ws = new WebSocket(url);
		ws.binaryType = "arraybuffer";
		this.ws = ws;

		ws.addEventListener("open", () => {
			this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
			// Push local state so the server gets any offline edits we accumulated
			ws.send(Y.encodeStateAsUpdate(this.yDoc));
		});

		ws.addEventListener("message", (event: MessageEvent<ArrayBuffer>) => {
			Y.applyUpdate(this.yDoc, new Uint8Array(event.data), ws);
		});

		ws.addEventListener("close", () => {
			if (this.ws === ws) this.ws = null;
			if (!this.destroyed) this.scheduleReconnect();
		});

		ws.addEventListener("error", () => ws.close());
	}

	private scheduleReconnect(): void {
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, this.reconnectDelay);
		this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
	}

	on(name: YDocEventName, callback: (store: T, document: Document<T>, ...args: any[]) => void): this {
		const wrapped = (...args: any[]) => callback(this.store, this, ...args);
		let eventMap = this.listenerMap.get(callback);
		if (!eventMap) {
			eventMap = new Map();
			this.listenerMap.set(callback, eventMap);
		}
		eventMap.set(name, wrapped);
		this.yDoc.on(name as any, wrapped);
		return this;
	}

	once(name: YDocEventName, callback: (store: T, document: Document<T>, ...args: any[]) => void): this {
		const wrapped = (...args: any[]) => {
			const eventMap = this.listenerMap.get(callback);
			eventMap?.delete(name);
			if (eventMap?.size === 0) this.listenerMap.delete(callback);
			callback(this.store, this, ...args);
		};
		let eventMap = this.listenerMap.get(callback);
		if (!eventMap) {
			eventMap = new Map();
			this.listenerMap.set(callback, eventMap);
		}
		eventMap.set(name, wrapped);
		this.yDoc.once(name as any, wrapped);
		return this;
	}

	off(name: YDocEventName, callback: (store: T, document: Document<T>, ...args: any[]) => void): this {
		const eventMap = this.listenerMap.get(callback);
		const wrapped = eventMap?.get(name);
		if (wrapped) {
			eventMap!.delete(name);
			if (eventMap!.size === 0) this.listenerMap.delete(callback);
			this.yDoc.off(name as any, wrapped);
		}
		return this;
	}

	[Symbol.dispose](): void {
		this.destroy();
	}

	destroy(): void {
		this.destroyed = true;
		if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
		if (this.saveTimer !== null) {
			clearTimeout(this.saveTimer);
			this.save();
		}
		this.yDoc.off("update", this.handleUpdate);
		this.ws?.close();
		this.yDoc.destroy();
	}
}
