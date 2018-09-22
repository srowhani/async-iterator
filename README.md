# Async Iterators

## Usage

```ts
function * _sampleIterator(a: number) {
  const b = yield new Promise(
    r => setTimeout(() => r(a + 1), 1000)
  );

  const c = yield function * () {
    const d = yield b + 1;
    yield d + 1;
  }

  const e = yield () => {
    return c + 1
  }

  return e + 1;
}

const taskInstance = asyncIteratorFactory(_sampleIterator(1));

const result = await taskInstance();
// result = 5
```
