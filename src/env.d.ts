declare namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: string;

        PREFIX: string;
        BOT_TOKEN: string;
        DEVELOPERS: string;
        CHANNEL_WHITELIST: string;
        GAME_JOIN_EMOJI: string;
        GAME_LEAVE_EMOJI: string;
        GAME_START_EMOJI: string;
        GAME_CONFIG_EMOJI: string;
        GAME_SPECTATE_EMOJI: string;
        GAME_CHANNEL_WHITELIST: string;
        API_PORT: string;
        SPOTIFY_CLIENT_ID: string;
        SPOTIFY_CLIENT_SECRET: string;
        SCROBBLE_GUILD: string;
        SCROBBLE_ROLES: string;
        BDAY_CHANNEL: string;
        BDAY_GUILD: string;
        BDAY_MESSAGES: string;
        BDAY_ROLES: string;
        WELCOME_ROLES: string;
        WELCOME_CHANNELS: string;
        WELCOME_MESSAGE: string;
        WELCOME_EMBED: string;
        SENTRY_DSN: string;
    }
}
