type LoadingListener = (pending: number) => void;

let pending = 0;
const listeners = new Set<LoadingListener>();

function notify() {
  for (const listener of listeners) listener(pending);
}

export function beginGlobalLoading() {
  pending += 1;
  notify();
}

export function endGlobalLoading() {
  pending = Math.max(0, pending - 1);
  notify();
}

export function getGlobalLoadingPending() {
  return pending;
}

export function subscribeGlobalLoading(listener: LoadingListener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}
