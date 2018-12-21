import {
  peek,
  pop,
  isEmpty,
  isPromise,
  isIterableIterator,  
} from '@src/util';

let TASK_INSTANCE_ID = 0

export function asyncIteratorFactory<T>(
  baseIterator: IterableIterator<PromiseLike<T>>
) {
  const iteratorStack: IterableIterator<PromiseLike<T>>[] = [ baseIterator ];
  return function _asyncIteratorResolver (previousValue?: PromiseLike<T>) {
    if (isEmpty(iteratorStack)) {
      return previousValue;
    }
  
    const currentIterator = peek(iteratorStack);
    const { value, done } = currentIterator.next(previousValue);
    
    if (done) {
      pop(iteratorStack);
      return _asyncIteratorResolver(value);
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

export type TaskInstance<T> = { id: string } & PromiseLike<T>

export interface Task<T> {
  lastSuccessful: T | null,
  perform: (...args: any) => TaskInstance<T>
}

export function createTaskInstance<T>(
  baseGenerator: (...generatorArgs) => IterableIterator<any>
): Task<T> {
  return {
    lastSuccessful: null,
    perform (...args): TaskInstance<T> {
      const taskClosure = asyncIteratorFactory(
        baseGenerator(...args)
      )

      const taskResolution = taskClosure()

      const chainedPromiseInstance = taskResolution.then(result => {
        this.lastSuccessful = result
        return result
      })

      chainedPromiseInstance.id = `task_${++TASK_INSTANCE_ID}`

      return chainedPromiseInstance
    }
  }

}