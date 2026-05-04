export type ApiClientEventType = 'duplicate-login' | 'blocked-user';

type ApiClientEventHandler = () => void;

const listeners = new Map<ApiClientEventType, Set<ApiClientEventHandler>>();

export const emitApiClientEvent = (eventType: ApiClientEventType) => {
  listeners.get(eventType)?.forEach((handler) => {
    handler();
  });
};

export const subscribeApiClientEvent = (
  eventType: ApiClientEventType,
  handler: ApiClientEventHandler,
) => {
  const eventListeners = listeners.get(eventType) ?? new Set<ApiClientEventHandler>();
  eventListeners.add(handler);
  listeners.set(eventType, eventListeners);

  return () => {
    eventListeners.delete(handler);
    if (eventListeners.size === 0) {
      listeners.delete(eventType);
    }
  };
};
