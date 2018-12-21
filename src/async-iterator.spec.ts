import { asyncIteratorFactory, createTaskInstance } from "@src/async-iterator";

const makeDummyRequest = () => new Promise(
  resolve => setTimeout(
    () => resolve({ body: 'success', code: 200 }),
    1
  )
)

describe('async-iterator', () => {
  it('handles async return values', async () => {
    function * _sampleIterator(a: number) { // 1
      const b = yield new Promise(
        resolve => setTimeout(
          () => resolve(a + 1), // 2
          1
        )
      );

      const c = yield function * () {
        const d = yield b + 1; // 3
        return d + 1; // 4
      }

      return c + 1; // 5
    }

    const asyncIterator = asyncIteratorFactory<number>(
      _sampleIterator(1)
    );

    const result = await asyncIterator();

    expect(result).toEqual(5);
  })

  it('handles sync', async () => {
    function * _sampleIterator(a: number) { // 1
      const b = yield function * () {
        const c = yield a + 1; // 2
        return c + 1; // 3
      }

      return b + 1; // 4
    }

    const asyncIterator = asyncIteratorFactory<number>(
      _sampleIterator(1)
    );

    const result = asyncIterator();

    expect(result).toEqual(4);
  })

  it('works with task instances', async () => {
    const expectedResult = {
      body: 'success',
      args: [1, 2, 3]
    }
    const taskInstance = createTaskInstance(function * (...args) {
      const { body } = yield makeDummyRequest()

      return {
        body,
        args
      };
    })

    const pendingResolve = taskInstance.perform(...expectedResult.args);
    expect(pendingResolve.id).toEqual('task_1');

    const result = await pendingResolve;

    expect(result).toEqual(expectedResult);
    expect(taskInstance.lastSuccessful).toEqual(expectedResult);
  })
});