import {
  peek,
  pop,
  isEmpty,
  isPromise,
  isIterableIterator,  
} from '@src/util';

let TASK_INSTANCE_ID = 0

export type AsyncResolver<T> = (p?: PromiseLike<T>) => PromiseLike<T>

export function asyncIteratorFactory<T>(
  baseIterator: IterableIterator<PromiseLike<T>>
): AsyncResolver<T> {
  const iteratorStack: IterableIterator<PromiseLike<T>>[] = [ baseIterator ];
  return function _asyncIteratorResolver (previousValue?: PromiseLike<T>): PromiseLike<T> {
    if (isEmpty(iteratorStack)) {
      return previousValue!;
    }
  
    const currentIterator = peek(iteratorStack);
    const { value, done } = currentIterator.next(previousValue);
    
    if (done) {
      pop(iteratorStack);
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
  baseGenerator: (...generatorArgs: any[]) => IterableIterator<any>
): Task<T> {
  return {
    lastSuccessful: null,
    perform (...args): TaskInstance<T> {
      const taskClosure = asyncIteratorFactory(
        baseGenerator(...args)
      )

      const taskResolution = taskClosure()

      const chainedPromiseInstance = taskResolution.then((result: T) => {
        this.lastSuccessful = result
        return result
      })

      const taggedPromiseInstance: TaskInstance<T> = Object.assign(chainedPromiseInstance, {
        id: `task_${++TASK_INSTANCE_ID}`
      })

      return taggedPromiseInstance
    }
  }

}