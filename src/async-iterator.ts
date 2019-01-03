import {
  peek,
  pop,
  isEmpty,
  isPromise,
  isIterableIterator,  
} from '@src/util';

let TASK_INSTANCE_ID = 0

export type AsyncResolver<T> = (p?: PromiseLike<T>, runContext?: { cancelled: boolean }) => PromiseLike<T>

export function asyncIteratorFactory<T>(
  baseIterator: IterableIterator<PromiseLike<T>>
): AsyncResolver<T> {
  const iteratorStack: IterableIterator<PromiseLike<T>>[] = [ baseIterator ];
  return function _asyncIteratorResolver (previousValue?: PromiseLike<T>, ctx = { cancelled: false }): PromiseLike<T> {
    if (ctx.cancelled) {
      throw new Error('cancelled');
    }

    if (isEmpty(iteratorStack)) {
      return previousValue!;
    }
  
    const currentIterator = peek(iteratorStack);
    const { value, done } = currentIterator.next(previousValue);
    
    if (done) {
      pop(iteratorStack);
    }

    if (isPromise<PromiseLike<T>>(value)) {
      return value.then((resolvedValue: PromiseLike<T>) => _asyncIteratorResolver(resolvedValue, ctx));
    }

    if (isIterableIterator<PromiseLike<T>>(value)) {
      iteratorStack.push(value());
      return _asyncIteratorResolver(previousValue, ctx);
    }

    return _asyncIteratorResolver(value, ctx);
  }
}

export type TaskInstance<T> = {
  _id: string,
  cancel(): void
} & PromiseLike<T>

export interface Task<T> {
  lastSuccessful: T | null,
  perform: (...args: any[]) => TaskInstance<T>
}

export function createTaskInstance<T>(
  baseGenerator: (...generatorArgs: any[]) => IterableIterator<any>
): Task<T> {
  return {
    lastSuccessful: null,
    perform (...args): TaskInstance<T> {
      const performContext = { cancelled: false }
      const taskClosure = asyncIteratorFactory(
        baseGenerator(...args)
      )

      const taskResolution = taskClosure(undefined, performContext)

      const chainedPromiseInstance = taskResolution.then((result: T) => {
        this.lastSuccessful = result;
        return result;
      })

      const taggedPromiseInstance: TaskInstance<T> = Object.assign(chainedPromiseInstance, {
        _id: `task_${++TASK_INSTANCE_ID}`,
        cancel () {
          performContext.cancelled = true;
        }
      })

      return taggedPromiseInstance
    }
  }

}