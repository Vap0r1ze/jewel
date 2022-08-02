/* eslint-disable no-restricted-syntax */
export default function accessObjPath(
  obj: any,
  path: string,
  bindFunctionContext?: boolean,
): unknown {
  const keys = path.split('.').filter(Boolean)
  let value = obj
  let parentValue
  for (const key of keys) {
    if (value == null) return value
    parentValue = value
    value = value[key]
  }
  if (typeof value === 'function' && bindFunctionContext) return value.bind(parentValue)
  return value
}
