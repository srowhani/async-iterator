export const peek = <T>(items: T[]): T => items[items.length - 1];
export const pop = <T>(items: T[]): T | undefined => items.pop();
export const isEmpty = <T>(items: T[]): boolean => items.length < 1;
