import { isPromise, isFunction, isIterableIterator } from './type-of';

describe('type-of', () => {
  describe('is-promise', () => {
    it('is detected correctly', () => {
      expect(isPromise(new Promise(resolve => resolve))).toEqual(true);
      expect(isPromise(Promise.resolve(true))).toEqual(true);
    })
  });

  describe('is-function', () => {
    expect(isFunction(() => {})).toEqual(true);
    expect(isFunction(function () {})).toEqual(true);
    expect(isFunction(new Function('1 + 1'))).toEqual(true);
  });

  describe('is-iterator', () => {
    expect(isIterableIterator(function * () {})).toBe(true);
  });
})