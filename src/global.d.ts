type ValueOf<T> = T[keyof T]
type Dict<T> = {
  [key: string]: T | undefined;
  [key: number]: T | undefined;
}
