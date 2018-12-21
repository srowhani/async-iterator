import { pop, peek, isEmpty } from "./stack";

describe('stack-utils', () => {
  it('pops', () => {
    const testArray = [1, 2, 3]

    expect(pop(testArray)).toBe(3);
    expect(testArray.length).toBe(2)
    expect(pop([])).toBeFalsy();
  });

  it('peeks', () => {
    const testArray = [1, 2, 3]
    expect(peek(testArray)).toBe(3)
    expect(testArray.length).toBe(3)
  });

  it('is-empty', () => {
    expect(isEmpty([])).toBeTruthy()
    expect(isEmpty([1, 2, 3])).toBeFalsy()
  });
});