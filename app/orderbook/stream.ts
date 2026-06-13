import { parseApiEvent, type ApiEvent } from "./schemas";

export type OrderbookStreamOptions = Readonly<{
  url: string;
  lastSequence?: number;
}>;

export class OrderbookStream implements AsyncIterable<ApiEvent> {
  private readonly url: string;
  private readonly lastSequence?: number;

  constructor(options: OrderbookStreamOptions) {
    this.url = options.url;
    this.lastSequence = options.lastSequence;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<ApiEvent> {
    const url = new URL(this.url);
    if (this.lastSequence !== undefined) {
      url.searchParams.set("last_sequence", this.lastSequence.toString());
    }

    const socket = new WebSocket(url);
    const queue: ApiEvent[] = [];
    let done = false;
    let pendingResolve: (() => void) | null = null;
    let pendingReject: ((error: Error) => void) | null = null;

    const wake = () => {
      pendingResolve?.();
      pendingResolve = null;
    };

    socket.addEventListener("message", (event) => {
      queue.push(parseApiEvent(JSON.parse(String(event.data))));
      wake();
    });
    socket.addEventListener("error", () => {
      pendingReject?.(new Error("Orderbook WebSocket failed."));
      pendingReject = null;
    });
    socket.addEventListener("close", () => {
      done = true;
      wake();
    });

    try {
      while (!done || queue.length > 0) {
        if (queue.length === 0) {
          await new Promise<void>((resolve, reject) => {
            pendingResolve = resolve;
            pendingReject = reject;
          });
          continue;
        }

        const event = queue.shift();
        if (event) yield event;
      }
    } finally {
      socket.close();
    }
  }
}
