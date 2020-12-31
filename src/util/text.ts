export default function transformText(text: string, ...styles: string[]) {
  let resText = text
  styles.forEach(style => {
    switch (typeof style === 'string' && style.toLowerCase()) {
      case 'capitalize': {
        resText = resText[0].toUpperCase() + resText.slice(1).toLowerCase()
        break
      }
      case 'uppercase': {
        resText = resText.toUpperCase()
        break
      }
      case 'em': {
        resText = `**${text}**`
        break
      }
      default: {
        break
      }
    }
  })
  return text
}
