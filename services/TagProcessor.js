const tags = require('./tags')

function compile (code) {
  if (!code)
    return []
  let block = ''
  let compiled = []
  let state = {
    tag: false,
    tagName: false,
    depth: -1
  }
  let s = {}
  function passchar (char) {
    switch (char) {
      case '{':
        state.depth++
        if (state.tag) {
          block += char
        } else {
          state.tag = true
          state.tagName = true
          s.tag = true
          s.name = ''
          s.args = []
          if (block) {
            compiled.push({text: true, value: block})
            block = ''
          }
        }
        break
      case '}':
        if (state.depth === 0) {
          if (state.tag) {
            if (state.tagName) {
              s.name = block
              block = ''
            } else {
              s.args.push(block)
              block = ''
            }
            compiled.push(s)
            s = {}
            state.tag = false
            state.tagName = false
          }
        } else {
          block += char
        }
        if (state.depth > -1)
          state.depth--
        break
      case ';':
        if (state.depth === 0) {
          if (state.tagName) {
            state.tagName = false
            s.name = block
            block = ''
          } else {
            s.args.push(block)
            block = ''
          }
        } else {
          block += char
        }
        break
      default:
        block += char
        break
    }
  }
  for (let i = 0; i < code.length; i++)
    passchar(code[i])
  if (block)
    compiled.push({text: true, value: block})
  block = ''
  return compiled
}

async function parse (d, self) {
  let ed = ''
  for (let block of d) {
    if (block.text) {
      ed += block.value
    } else if (block.tag) {
      let tn = await parse(compile(block.name))
      if (tn === 'break')
        break
      if (tags[tn])
        ed += await tags[tn].run.bind(Object.assign({}, self, {
          args: block.args.map(arg => /^\s+$/.test(arg) ? arg : arg.trim())
        }))()
      else
        ed += 'Invalid tag name'
    }
  }
  return ed
}

async function fProcess (t, self = {}) {
  if (self.process !== fProcess)
    self.process = fProcess
  return await parse(compile(t), self)
}

module.exports = { process: fProcess }
