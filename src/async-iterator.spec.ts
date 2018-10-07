import { asyncIteratorFactory } from "@src/async-iterator";

describe('async-iterator', () => {
  it('works', async () => {
    function * _sampleIterator(a: number) {
      const b = yield new Promise(
        resolve => setTimeout(
          () => resolve(a + 1),
          1000
        )
      );

      const c = yield function * () {
        const d = yield b + 1;
        yield d + 1;
      }

      return c + 1;
    }

    const asyncIterator = asyncIteratorFactory<number>(
      _sampleIterator(1)
    );

    const result = await asyncIterator();

    expect(result).toEqual(4);
  })
});