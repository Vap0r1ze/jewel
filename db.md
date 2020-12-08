- schedule
  - jobs: []Job

- games
  - sessions: []Session

Job
  - id: String
  - when: String - can be cron format, or an ISO formatted date
  - handlerPath: String - path to job handler from bot context
  - data: Object - data to pass to the handler upon execution

Session
  - id: ShortId
  - poolMsgId: Snowflake - message for pre-game player pool and game controls
  - poolChannelId: Snowflake - pool message channel
  - gameName: String - internal game name
  - gameState: GameState
  - gameConfig: Object - game specific config
  - host: Snowflake
  - players: []Snowflake
  - data: Object - game specific session data

GameState: 'PREGAME' | 'INPROGRESS' | 'PAUSED' | 'POSTGAME'
