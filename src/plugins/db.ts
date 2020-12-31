import db from 'quick.db'

export default function getDB(table: string) {
  // eslint-disable-next-line new-cap
  return new db.table(table)
}
