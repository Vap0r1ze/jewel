import schedule, { Job } from 'node-schedule'
import chalk from 'chalk'
import moment, { Moment } from 'moment'
import Bot from '@/services/Bot'
import accessObjPath from '@/util/accessObjPath'
import logger from '@/util/logger'

const loadFromInfo = Symbol('loadFromInfo')
const unloadFromId = Symbol('unloadFromId')

export interface JobInfo {
  id: string;
  when: string;
  handlerPath: string;
  data: any;
}

export default function createJobManager(this: Bot) {
  const db = this.getDB('schedule')

  const checkIfLate = (when: string, threshhold: number) => {
    if (!Number.isNaN(new Date(when).getTime())) { return moment().diff(moment(when)) > threshhold }
    return false
  }
  const jobHandlerWrapper = (jobInfo: JobInfo, fromInit?: boolean) => () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    jobManager[unloadFromId](jobInfo.id)

    let isLate = +checkIfLate(jobInfo.when, 10000)
    if (isLate && fromInit) isLate += 1

    const handler = accessObjPath(this, jobInfo.handlerPath, true)
    try {
      if (typeof handler === 'function') { handler(jobInfo.data, isLate) }
      logger.error(`JOB:${jobInfo.handlerPath}`, 'Handler path does not exist')
    } catch (error) {
      logger.error(`JOB:${jobInfo.handlerPath}`, error)
    }
  }
  const jobManager = {
    store: {} as Dict<Job>,
    [loadFromInfo](jobInfo: JobInfo) {
      const job = schedule.scheduleJob(jobInfo.when, jobHandlerWrapper(jobInfo))
      db.set(`jobs.${jobInfo.id}`, jobInfo)
      this.store[jobInfo.id] = job
      return job
    },
    [unloadFromId](id: string) {
      if (this.store[id]) { delete this.store[id] }
      return db.delete(`jobs.${id}`)
    },
    create<T>(id: string, when: string | Date | Moment, handlerPath: string, data?: T) {
      let whenStr = when
      if (whenStr instanceof Date || moment.isMoment(whenStr)) { whenStr = whenStr.toISOString() }
      const jobInfo = {
        id, when: whenStr, handlerPath, data,
      }
      return this[loadFromInfo](jobInfo)
    },
    exists(id: string) {
      return Boolean(this.store[id])
    },
    cancel(id: string) {
      const job = this.store[id]
      if (job) {
        job.cancel()
        this[unloadFromId](id)
        return true
      }
      return false
    },
  }

  this.on('init', () => {
    const jobDict: Dict<JobInfo> = db.get('jobs') || {}
    const jobs = Object.values(jobDict)
    jobs.forEach(jobInfo => {
      if (!jobInfo) return
      if (checkIfLate(jobInfo.when, 2000)) {
        jobHandlerWrapper(jobInfo, true)()
      } else {
        jobManager[loadFromInfo](jobInfo)
      }
    })
    const j = jobs.length
    logger.log('JOBS', chalk`Scheduled and loaded {green.bold ${j.toString()}} job${j === 1 ? '' : 's'} from storage`)
  })

  return jobManager
}
