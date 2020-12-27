const superagent = require('superagent')
const btoa = require('btoa')
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env

exports.dependencies = ['db', 'api']

function httpReq (method, url, headers, body, bodyType) {
  let request = superagent[method](url)
  if (headers) {
    for (const [k, v] of Object.entries(headers))
      request = request.set(k, v)
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
async function httpReqBody (method, url, headers, body, bodyType) {
  const response = await httpReq(method, url, headers, body, bodyType)
  return response.body
}
const cache = {
  spotifyToken: null
}

exports.init = function () {
  const db = this.getDB('scrobbles')

  this.api.get('/scrobbles', request => {
    const responses = []
    if (request.query.q === '*') {
      for (const { data } of db.all()) {
        responses.push(JSON.parse(data))
      }
    } else {
      const responses = []
      const userIds = request.query.q && request.query.q.split(',') || []
      for (const userId of userIds) {
        const data = db.get(userId)
        if (data) responses.push(data)
      }
    }
    return responses
  })

  this.api.get('/scrobbles/spotify-token', async () => {
    if (cache.spotifyToken) {
      if (cache.spotifyToken.expiresAt <= Date.now()) cache.spotifyToken = null
    }
    if (!cache.spotifyToken) {
      try {
        const data = await httpReqBody('post', 'https://accounts.spotify.com/api/token', {
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`
        }, {
          grant_type: 'client_credentials'
        }, 'form')
        const expiresAt = Date.now() + (data.expires_in - 5) * 1000
        cache.spotifyToken = {
          token: data.access_token,
          expiresAt
        }
      } catch (err) {
        if (err.response)
          console.error(err.response.body)
        else
          console.log(err)
        return { token: null, type: null }
      }
    }
    return { token: cache.spotifyToken.token, type: 'Bearer' }
  })
}
