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

    if (isEmpty(iteratorStack)) {
      return previousValue!;
    }
  
    const currentIterator = peek(iteratorStack);
    
    if (ctx.cancelled) {
      currentIterator.return!(previousValue)
      return previousValue!;
    }

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
  cancel(): void
} & PromiseLike<T>

export interface Task<T> {
  lastSuccessful: T | null,
  perform(...args: any[]): TaskInstance<T>
  cancelAll(): void
  restartable(): Task<T>
}

export interface TaskConfigurationContext {
  restartable: boolean
}

export type Opaque<T, V> = T & { __private__: V }

function nextTaskIdentifier () {
  return `task_${++TASK_INSTANCE_ID}` as Opaque<'taskIdentifier', string>;
}

export type TaskInstanceMapping<T> = {
  [taskId: string]: TaskInstance<T>
}

export function createTaskInstance<T>(
  baseGenerator: (...generatorArgs: any[]) => IterableIterator<any>
): Task<T> {
  let pendingTaskQueue: TaskInstance<T>[] = [];

  const scopedTaskLookup: TaskInstanceMapping<T> = {}
  const taskConfigurationContext: TaskConfigurationContext = {
    restartable: false
  }

  return {
    lastSuccessful: null,
    perform (...args): TaskInstance<T> {
      const taskPerformContext = { cancelled: false }

      if (taskConfigurationContext.restartable) {
        this.cancelAll()
      }

      const taskClosure = asyncIteratorFactory<T>(
        baseGenerator(...args)
      )

      const taskResolution = taskClosure(undefined, taskPerformContext)

      const chainedPromiseInstance = taskResolution.then((result: T) => {
        this.lastSuccessful = result;
        return result;
      })

      const pendingTaskInstance: TaskInstance<T> = Object.assign(chainedPromiseInstance, {
        cancel () {
          taskPerformContext.cancelled = true;
        }
      })

      scopedTaskLookup[nextTaskIdentifier()] = pendingTaskInstance
      pendingTaskQueue.push(pendingTaskInstance)

      return pendingTaskInstance
    },
    restartable () {
      taskConfigurationContext.restartable = true
      return this;
    },
    cancelAll () {
      pendingTaskQueue.forEach(
        taskInstance => taskInstance.cancel()
      )
      pendingTaskQueue = []
    }
  }

}