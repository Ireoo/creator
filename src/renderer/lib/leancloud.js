// @flow
import av from 'leancloud-storage'
import moment from 'moment'
import Store from 'electron-store'
import 'clientjs'
import { machineIdSync } from 'node-machine-id'
const store = new Store({ name: 'leancloud' })
const appId = '6mieen24wDVQ0TJ3yedGVdLe-MdYXbMMI'
const appKey = 'T5ci2pawlSNMqrEdT1Osfls5'
const client = new window.ClientJS()

// const fingerprint = client.getFingerprint().toString()
const fingerprint = machineIdSync()

av.init({
  appId,
  appKey,
})

export default av

export async function getInstallInfo(): Promise<av.Object> {
  console.log('fingerprint', fingerprint)
  const now = await getTime()
  const query = new av.Query('creator_Install')
  query.equalTo('fingerprint', fingerprint)
  query.greaterThan('endAt', now)
  return query.first()
}

async function getTime(): Promise<Date> {
  try {
    // $FlowFixMe
    if (getTime._time) return getTime._time
    const now = await av.Cloud.getServerDate()
    getTime._time = now
    return now
  } catch (err) {
    return new Date()
  }
}

export function isOnline(): Promise<boolean> {
  return new Promise(async(resolve, reject) => {
    try {
      setTimeout(() => resolve(true), 3000)
      await av.Cloud.getServerDate()
      resolve(true)
    } catch (err) {
      resolve(false)
    }
  })
}

export async function checkRegisteStatus(): Promise<boolean> {
  console.log('checkRegisteStatus')
  const online = await isOnline()
  console.log('online', online)
  const now = await getTime()
  console.log('now', now, store, store.get)
  const lastCheckAt = store.get('lastCheckAt')
  console.log('last check at', lastCheckAt)
  const checkFrequency = store.get('checkFrequency')
  const endAt = store.get('endAt')

  console.log('lastCheckAt && moment(lastCheckAt).isAfter(now)', lastCheckAt && moment(lastCheckAt).isAfter(now))
  // simply prevent users to modify the system time
  if (lastCheckAt && moment(lastCheckAt).isAfter(now)) return false

  // check every X days
  console.log(now)
  console.log("lastCheckAt && moment(lastCheckAt).add(checkFrequency, 'd').isAfter(now)", lastCheckAt && moment(lastCheckAt).add(checkFrequency, 'd').isAfter(now))
  if (lastCheckAt && moment(lastCheckAt).add(checkFrequency, 'd').isAfter(now)) {
    console.log('moment(endAt).isBefore(now)', moment(endAt).isBefore(now))
    if (moment(endAt).isBefore(now)) return false // exceed the time limit
    if (online) {
      let install
      try {
        install = await getInstallInfo()
      } catch (err) {
        // 服务端错误时允许使用
        install = true
      }
      console.log('install', install)
      if (!install) return false
      updateStore(install)
    }
    return true
  }

  if (online) {
    let install
    try {
      install = await getInstallInfo()
    } catch (err) {
      // 服务端错误时允许使用
      install = true
    }
    console.log('install', install)
    if (!install) return false
    updateStore(install)
    return true
  } else {
    return false
  }
}

export async function updateStore(install: av.Object): Promise<any> {
  const endAt = install.get('endAt')
  const checkFrequency = install.get('checkFrequency')
  const now = await getTime()
  store.set('lastCheckAt', now)
  store.set('checkFrequency', checkFrequency)
  store.set('endAt', endAt)
}

export const clearStore = () => store.clear()

export async function getInstallInfoByCode(code: string): Promise<av.Object> {
  const query = new av.Query('creator_Install')
  query.equalTo('authCode', code)
  return query.first()
}

/**
 * @param code
 * return {status,msg}; status:-1,the code does not exist;
 *                      status:0,the code has been used;
 *                      status:1,success
 *                      status:3,expiration
 *                      status:4,Unable to connect to server
 */
export async function register(code: string): Promise<{ status: number, msg: string }> {
  const online = await isOnline()
  if (await checkRegisteStatus()) return { status: 1, msg: 'The computer has been registered' }
  if (!online) return { status: 4, msg: 'Unable to connect to server' }

  const install = await getInstallInfoByCode(code)
  if (!install) return { status: -1, msg: 'The code does not exist.' }

  const serverDate = await av.Cloud.getServerDate()
  if (install.get('fingerprint') && install.get('fingerprint') !== fingerprint) {
    return { status: 0, msg: 'The code has been used.' }
  }
  if (!install.get('fingerprint')) {
    install.set('fingerprint', fingerprint)
    install.set('startAt', new Date())
  }

  return install.save().then(install => {
    if (moment(serverDate).isBefore(install.get('endAt'))) {
      updateStore(install)
      return { status: 1, msg: 'Register success' }
    } else return { status: 3, msg: 'Authorization code is expiration.' }
  }).catch(err => {
    return { status: 2, msg: err.message }
  })
}
