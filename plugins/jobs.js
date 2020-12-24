const schedule = require('node-schedule')
const chalk = require('chalk')
const moment = require('moment')

exports.dependencies = ['db']

exports.init = function () {
  const db = this.getDB('schedule')

  const checkIfLate = (when, threshhold) => {
    if (!isNaN(new Date(when).getTime()))
      return moment().diff(moment(when)) > threshhold
    return false
  }
  const jobHandlerWrapper = (jobInfo, fromInit) => {
    return () => {
      this.jobs._unloadFromId(jobInfo.id)

      let isLate = +checkIfLate(jobInfo.when, 10000)
      if (isLate && fromInit)
        isLate++

      const handler = this.util.accessObjPath(this, jobInfo.handlerPath, true)
      try {
        handler(jobInfo.data, isLate)
      } catch (error) {
        this.util.logger.error(`JOB:${jobInfo.handlerPath}`, error)
      }
    }
  }
  this.jobs = {
    store: {},
    _loadFromInfo (jobInfo) {
      const job = schedule.scheduleJob(jobInfo.when, jobHandlerWrapper(jobInfo))
      db.set(`jobs.${jobInfo.id}`, jobInfo)
      this.store[jobInfo.id] = job
      return job
    },
    _unloadFromId (id) {
      if (id in this.store)
        delete this.store[id]
      return db.delete(`jobs.${id}`)
    },
    create (id, when, handlerPath, data) {
      if (when instanceof Date || when._isAMomentObject)
        when = when.toISOString()
      const jobInfo = { id, when, handlerPath, data }
      return this._loadFromInfo(jobInfo)
    },
    exists (id) {
      return id in this.store
    },
    cancel (id) {
      if (this.store[id]) {
        this.store[id].cancel()
        this._unloadFromId(id)
        return true
      } else {
        return false
      }
    }
  }

  this.on('init', () => {
    const jobs = db.get('jobs') || {}
    for (const jobInfo of Object.values(jobs)) {
      if (checkIfLate(jobInfo.when, 2000)) {
        jobHandlerWrapper(jobInfo, true)()
      } else {
        this.jobs._loadFromInfo(jobInfo)
      }
    }
    const j = Object.values(jobs).length
    this.util.logger.log('JOBS', chalk`Scheduled and loaded {green.bold ${j}} job${j===1?'':'s'} from storage`)
  })
}
