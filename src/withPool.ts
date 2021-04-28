export function withPool<Args extends any[], R>(fn: (...args: Args) => R, LIMIT = 4) {
  let count = 0;
  const pendings: (() => void)[] = [];
  function release() {
    pendings.shift()?.();
    count--;
  }
  async function acquire() {
    if (count >= LIMIT) {
      await new Promise<void>((resolve) => {
        pendings.push(resolve);
      });
    }
    count++;
  }

  return async (...args: Args) => {
    try {
      await acquire();
      return await fn(...args); // The await is necessary, otherwise release() would be invoked before fn(...args) resolves.
    } finally {
      release();
    }
  };
}
