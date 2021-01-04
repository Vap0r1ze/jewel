type ValueOf<T> = T[keyof T]
type Dict<T> = Record<string | number, T | undefined>

// unions are distributive over conditionals https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types
type DistributiveOmit<T, K extends string> = T extends T ? Omit<T, K> : never
