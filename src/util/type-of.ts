export const isPromise = <T>(v: any): v is Promise<T> => v instanceof Promise;
export const isFunction = (v: any): v is Function => typeof v === 'function';
export const isIterableIterator = <T>(v: any): v is () => IterableIterator<T> => isFunction(v) && v.constructor.name === 'GeneratorFunction';