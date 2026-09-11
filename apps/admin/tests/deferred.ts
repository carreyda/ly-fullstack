/**
 * 可由测试用例手动完成或拒绝的 Promise
 */
export interface Deferred<TValue> {
  /**
   * 供被测代码等待的 Promise
   */
  promise: Promise<TValue>;

  /**
   * 完成 Promise
   */
  resolve: (value: TValue) => void;

  /**
   * 拒绝 Promise
   */
  reject: (reason?: unknown) => void;
}

/**
 * 创建一个由测试用例控制完成时机的 Promise
 *
 * @returns Promise 及其 resolve、reject 控制函数
 */
export const createDeferred = <TValue>(): Deferred<TValue> => {
  let resolve!: (value: TValue) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<TValue>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
};
