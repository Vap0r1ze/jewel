const { bind } = require("bluebird")

module.exports = function accessObjPath(obj, path, bindFunctionContext) {
  const keys = path.split('.').filter(Boolean)
  let value = obj
  let parentValue
  for (const key of keys) {
    if (value == null) return value
    parentValue = value
    value = value[key]
  }
  if (typeof value === 'function' && bindFunctionContext)
    return value.bind(parentValue)
  return value
}
