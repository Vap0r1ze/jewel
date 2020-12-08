module.exports = function transform (text, ...styles) {
  for (const style of styles) {
    switch (typeof style === 'string' && style.toLowerCase()) {
      case 'capitalize': {
        text = text[0].toUpperCase() + text.slice(1).toLowerCase()
        break
      }
      case 'uppercase': {
        text = text.toUpperCase()
        break
      }
      case 'em': {
        text = `**${text}**`
        break
      }
    }
  }
  return text
}
