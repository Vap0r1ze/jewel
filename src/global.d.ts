type ValueOf<T> = T[keyof T]
type Dict<T> = Record<string | number, T | undefined>
