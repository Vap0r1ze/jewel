import superagent from 'superagent'
import btoa from 'btoa'
import Bot from '@/services/Bot'
import chalk from 'chalk'
import moment from 'moment'
import logger from '@/util/logger'

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env

function httpReq(
  method: string,
  url: string,
  headers?: Dict<string>,
  body?: Dict<any>,
  bodyType?: string,
): Promise<superagent.Response> {
  let request = superagent(method, url)
  if (headers) {
    Array.from(Object.entries(headers)).forEach(([k, v]) => {
      request = request.set(k, v || '')
    })
  }
  if (bodyType) request = request.type(bodyType)
  if (body) request = request.send(body)
  return new Promise((resolve, reject) => {
    request.end((error, response) => {
      if (error) reject(error)
      else resolve(response)
    })
  })
}
async function httpReqBody(
  method: string,
  url: string,
  headers?: Dict<string>,
  body?: Dict<any>,
  bodyType?: string,
) {
  const response = await httpReq(method, url, headers, body, bodyType)
  return response.body
}
const cache = {
  spotifyToken: null as SpotifyTokenData | null,
}

export interface SpotifyTokenData {
  token: string;
  expiresAt: number;
}
export interface Scrobble {
  id: string; // spotify track id
  startTime: number;
  endTime: number | null;
}
export interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}
export interface ScrobbleData {
  user: User;
  scrobbles: Scrobble[];
}

export default function initScrobbles(this: Bot) {
  const db = this.getDB('scrobbles')
  const maxHistory = 100

  this.api.get('/scrobbles', async (request, reply) => {
    const now = Date.now()
    reply.type('application/json').code(200)
    const responses: ScrobbleData[] = []
    if (typeof request.query !== 'object' || !request.query) return []
    const query = (request.query as Dict<string>).q
    if (query === '*') {
      db.all().forEach(({ data }) => {
        const pData = JSON.parse(data)
        pData.scrobbles.splice(maxHistory, Math.max(0, pData.scrobbles.length - maxHistory))
        responses.push(pData)
      })
    } else {
      const userIds = (query?.split(',')) || []
      userIds.forEach(userId => {
        const data = db.get(userId)
        if (data) {
          data.scrobbles.splice(maxHistory, Math.max(0, data.scrobbles.length - maxHistory))
          responses.push(data)
        }
      })
    }

    return responses.filter(data => {
      if (data.scrobbles[0].endTime) {
        return moment(now).diff(data.scrobbles[0].endTime, 'days') <= 7
      }
      return moment(now).diff(data.scrobbles[0].startTime, 'hours') <= 24
    })
  })

  this.api.get('/scrobbles/spotify-token', async (request, reply) => {
    const now = Date.now()
    reply.type('application/json').code(200)
    if (cache.spotifyToken) {
      if (cache.spotifyToken.expiresAt <= now) cache.spotifyToken = null
    }
    if (!cache.spotifyToken) {
      try {
        const data = await httpReqBody('post', 'https://accounts.spotify.com/api/token', {
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        }, {
          // eslint-disable-next-line @typescript-eslint/camelcase
          grant_type: 'client_credentials',
        }, 'form')
        const expiresAt = now + (data.expires_in - 5) * 1000
        cache.spotifyToken = {
          token: data.access_token,
          expiresAt,
        }
      } catch (err) {
        if (err.response) { console.error(err.response.body) } else { console.log(err) }
        return { token: null, type: null }
      }
    }
    return { token: cache.spotifyToken.token, type: 'Bearer' }
  })

  this.client.once('ready', () => {
    const scrobbleGuild = this.client.guilds.get(process.env.SCROBBLE_GUILD)
    if (scrobbleGuild) {
      scrobbleGuild.fetchAllMembers(20000).then(n => {
        const s = n === 1 ? '' : 's'
        logger.log('SCROBBLE', chalk`Requested and received {green.bold ${n.toString()}} guild member${s}`)
      })
    }
  })
}
