import Bot from '@/services/Bot'
import { Message } from 'eris'
import { Priority } from './msgq'

// TODO: make these type names more digestable

export interface ConfigRangeWithValue {
  type: 'range';
  value: number;
  range: [number, number];
  step?: number;
}
export interface ConfigRadioWithValue {
  type: 'radio';
  value: number;
  choices: number[];
}
export interface ConfigCheckboxWithValue {
  type: 'checkbox';
  value: number[];
  choices: number[];
  minChoices?: number;
  maxChoices?: number;
}
export interface ConfigTextWithValue {
  type: 'text';
  value: string;
  pattern: RegExp;
  transforms?: string[];
}

export type ConfigWithValue = ConfigRangeWithValue
| ConfigRadioWithValue
| ConfigCheckboxWithValue
| ConfigTextWithValue
export type ConfigValue = ConfigWithValue['value']

export interface ConfigMenu {
  id: string;
  config: ConfigWithValue;
  currentValue: ConfigValue;
  user: string;
  channel: string;
  reactMenu?: string;
}

type ConfigValueListener<ConfigValueType> = (value: ConfigValueType | null) => void

const openMenus = Symbol('openMenus')

export default function createConfigManager(this: Bot) {
  const db = this.getDB('config')

  const configManager = {
    [openMenus]: {} as Dict<ConfigMenu>,
    storeConfig(key: string, configs: Dict<ConfigWithValue>) {
      const values: Dict<ConfigValue> = {}
      Object.keys(configs).forEach(field => {
        values[field] = configs[field]?.value
      })
      db.set(key, values)
    },
    getConfig<T extends Dict<ConfigWithValue>>(
      key: string,
      defaultValues: T,
    ): T {
      return db.get(key) || defaultValues
    },
    queryConfigValue: <ConfigWithValueType extends ConfigWithValue>(
      msg: Message,
      config: ConfigWithValueType,
      timeoutMs: number,
    ): Promise<ConfigWithValueType['value'] | null> => new Promise(resolve => {
      const key = `${msg.author.id}:${msg.channel.id}`
      if (key in configManager[openMenus]) {
        this.logger.warn('CFG', 'ConfigValue query attempted with pre-existing key')
        throw new Error('Cannot create new query for user being queried')
      }
      const event = `cfg:${key}`
      configManager[openMenus][key] = {
        id: key,
        config,
        channel: msg.channel.id,
        user: msg.author.id,
        currentValue: config.value,
        // reactMenu: oh fuck,
      }
      msg.channel.createMessage({
        embed: {
          description: 'lol ok',
        },
      })

      const cleanup = () => {
        if (key in configManager[openMenus]) {
          delete configManager[openMenus][key]
        } else {
          this.logger.warn('CFG', 'Post-cleanup could not find key')
        }
      }
      let timeout: NodeJS.Timeout
      const valueHandler: ConfigValueListener<ConfigWithValueType['value']> = value => {
        clearTimeout(timeout)
        cleanup()
        resolve(value)
      }
      timeout = setTimeout(() => {
        this.off(event, valueHandler)
        cleanup()
        resolve(null)
      }, timeoutMs)
      this.once(event, valueHandler)
    }),
    handleInteraction: (oldMenu: ConfigMenu, q: string) => {
      const menu = configManager[openMenus][oldMenu.id]
      if (!menu) return
      const { config } = menu
      switch (config.type) {
        case 'checkbox': {
          break
        }
        case 'radio': {
          break
        }
        case 'range': {
          break
        }
        case 'text': {
          if (config.pattern.test(q)) {
            menu.currentValue = q
            this.emit(menu.id, q)
          }
          break
        }
        default: {
          break
        }
      }
    },
  }

  this.msgq.registerConsumer('config', Priority.Config, (msg, next) => {
    const key = `${msg.author.id}:${msg.channel.id}`
    const menu = configManager[openMenus][key]
    if (menu) {
      configManager.handleInteraction(menu, msg.content)
    } else {
      next()
    }
  })

  return configManager
}
