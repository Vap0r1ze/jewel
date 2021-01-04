import { ConfigWithValue } from '@/plugins/config'
import { Message } from 'eris'
import Command, { CommandArgs } from '../services/Command'

type ConfigValues<ConfigsWithValue extends { [key: string]: ConfigWithValue }> = {
  [K in keyof ConfigsWithValue]: ConfigsWithValue[K]['value'];
}

export default class ConfigCommand extends Command {
  get name() {
    return 'config'
  }

  get aliases() {
    return ['cfg']
  }

  get description() {
    return 'Test config stuff'
  }

  get config() {
    return {
      color: {
        type: 'text',
        value: 'ff0000',
        pattern: /^#?[0-9a-f]{6}$/,
      },
    }
  }

  isConfigField(key: string | number): key is keyof ConfigCommand['config'] {
    return key in this.config
  }

  handle(msg: Message, args: CommandArgs) {
    const cmd = args.shift()
    const configMgr = this.ctx.config
    switch (cmd) {
      case 'show': {
        const cfg = configMgr
          .getConfig(`test:${msg.author.id}`, this.config as Dict<ConfigWithValue>) as ConfigCommand['config']
        msg.channel.createMessage({
          embed: {
            color: parseInt(cfg.color, 16),
            description: `\`\`\`json\n${JSON.stringify(cfg, null, 2)}\n\`\`\``,
          },
        })
        break
      }
      case 'change': {
        const field = args.shift()
        if (field && this.isConfigField(field)) {
          const config = this.config[field]
          if (config) {
            configMgr.queryConfigValue(msg, config, 60000).then(value => {
              if (value) {

              } else {
                msg.channel.createMessage('LOOOOOOOOOOL u took too long')
              }
            })
          }
        }
        break
      }
      default: {
        break
      }
    }
  }
}
