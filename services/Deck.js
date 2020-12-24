class Deck extends Array {
  get indexes () {
    return Array(this.length).fill().map((_,i) => i)
  }
  fromIndexes (indexes) {
    const deck = []
    for (const i of indexes)
      deck.push(this[i])
    return deck
  }
  shuffleIndexes () {
    const indexes = this.indexes
    for (let i = this.length; i > 1; i--) {
      const j = Math.floor(Math.random() * i)
      const e = indexes.splice(j, 1)[0]
      indexes.push(e)
    }
    indexes.push(indexes.shift())
    return indexes
  }
}

module.exports = Deck
