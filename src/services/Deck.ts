export default class Deck {
  static indexesOf(deckRef: any[]) {
    return Array(deckRef.length).fill(0).map((_, i) => i)
  }

  static fromIndexes(deckRef: any[], indexes: number[]) {
    const deck: any[] = []
    indexes.forEach(i => deck.push(deckRef[i]))
    return deck
  }

  static shuffleIndexes(deckRef: any[]) {
    const indexes = Deck.indexesOf(deckRef)
    for (let i = deckRef.length; i > 1; i -= 1) {
      const j = Math.floor(Math.random() * i)
      const [e] = indexes.splice(j, 1)
      indexes.push(e)
    }
    const lastIndex = indexes.shift()
    indexes.push(lastIndex == null ? -1 : lastIndex)
    return indexes
  }
}
