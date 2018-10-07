import {
  peek,
  pop,
  isEmpty,
  isPromise,
  isIterableIterator,  
} from '@src/util';

export function asyncIteratorFactory<T>(
  baseIterator: IterableIterator<PromiseLike<T>>
) {
  const iteratorStack: IterableIterator<PromiseLike<T>>[] = [ baseIterator ];
  return function _asyncIteratorResolver(previousValue?: PromiseLike<T>) {
    if (isEmpty(iteratorStack)) {
      return previousValue;
    }
  
    const currentIterator = peek(iteratorStack);
    const { value, done } = currentIterator.next(previousValue);
    
    if (done) {
      pop(iteratorStack);
      return _asyncIteratorResolver(previousValue);
    }

    if (isPromise<PromiseLike<T>>(value)) {
      return value.then(_asyncIteratorResolver);
    }

    if (isIterableIterator<PromiseLike<T>>(value)) {
      iteratorStack.push(value());
      return _asyncIteratorResolver(previousValue);
    }

    return _asyncIteratorResolver(value);
  }
}