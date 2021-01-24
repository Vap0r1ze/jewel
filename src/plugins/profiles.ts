import Bot from '@/services/Bot'
import Profile from '@/services/Profile'
import chalk from 'chalk'

export interface ProfileData {
  id: string;
  birthday: [number, number] | null;
  birthdayLastUsed: number;
}

export const createDefaultProfile = (): ProfileData => ({
  id: '0',
  birthday: null,
  birthdayLastUsed: 0,
})

export default function createProfileManager(this: Bot) {
  const db = this.getDB('profiles')

  const profileMgr = {
    store: {} as Dict<Profile>,
    getProfile: (userId: string): Profile => {
      const storedProfile = profileMgr.store[userId]
      if (storedProfile) return storedProfile
      const freshProfile = new Profile(this, {
        ...createDefaultProfile(),
        id: userId,
      })
      profileMgr.store[userId] = freshProfile
      return freshProfile
    },
  }

  db.all().forEach(({ data }) => {
    const d = JSON.parse(data)
    if (d ?? typeof d.id === 'string') {
      const profile: Profile = new Profile(this, { ...createDefaultProfile(), ...d })
      profileMgr.store[d.id] = profile
    }
  })

  const p = Object.keys(profileMgr.store).length
  this.logger.log('PRF', chalk`Loaded {green.bold ${p.toString()}} profile${p === 1 ? '' : 's'} from storage`)

  return profileMgr
}
