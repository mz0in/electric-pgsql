import { LIB_VERSION } from 'electric-sql/version'
import { makeElectricContext } from 'electric-sql/react'
import { uniqueTabId, genUUID } from 'electric-sql/util'
import { insecureAuthToken } from 'electric-sql/auth'
import { electrify, ElectricDatabase } from 'electric-sql/wa-sqlite'
import { Electric, schema } from './generated/client'
export type { Issue } from './generated/client'

export const { ElectricProvider, useElectric } = makeElectricContext<Electric>()

const discriminator = 'linearlite'

// import.meta.env is a special object that Vite provides for accessing
// environment variables at build time and runtime.
// They are replaced at build time with the actual values.
// https://vitejs.dev/guide/env-and-mode.html
const DEV_MODE = import.meta.env.DEV
const ELECTRIC_SERVICE =
  import.meta.env.ELECTRIC_SERVICE || import.meta.env.ELECTRIC_URL
const DEBUG_ENV = import.meta.env.DEBUG

// We can override the debug mode with a query param: ?debug=true or ?debug=false
const searchParams = new URLSearchParams(window.location.search)
const debugParam = searchParams.get('debug')

// DEBUG defaults to true in dev mode, false in prod mode
export const DEBUG = debugParam ? debugParam === 'true' : DEV_MODE || DEBUG_ENV

// We export dbName so that we can delete the database if the schema changes
export let dbName: string

export const initElectric = async () => {
  const { tabId } = uniqueTabId()
  const electricUrl = ELECTRIC_SERVICE ?? 'ws://localhost:5133'
  dbName = `${discriminator}-${LIB_VERSION}-${tabId}.db`

  const config = {
    url: electricUrl,
    debug: DEBUG,
  }

  let userId = window.sessionStorage.getItem('userId')
  if (!userId) {
    userId = genUUID()
    window.sessionStorage.setItem('userId', userId)
  }
  const authToken = insecureAuthToken({ sub: userId })

  const conn = await ElectricDatabase.init(dbName)
  if (DEBUG) {
    console.log('initElectric')
    console.log('dbName', dbName)
    console.log(conn)
    console.log(schema)
    console.log(config)
  }
  const electric = await electrify(conn, schema, config)
  await electric.connect(authToken)
  return electric
}
