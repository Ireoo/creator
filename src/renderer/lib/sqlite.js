// @flow
import SQL from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs-extra'
import path from 'path'
import { get, toLower } from 'lodash'

type QueryResults = {
  columns: string[];
  values: (any)[][];
}

const dbPath = path.join(process.env.LOCALAPPDATA || '', 'Integem iPlayer', 'data', 'db.sqlite')
export let DB = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : null

/**
 * check if the projectPath is in thb DB
 * @param {string} projectPath
 */
export function isProjectInDB(projectPath: string): boolean {
  if (!DB) return false
  const count = find('themes', { location: projectPath })
  const exist = count && !!get(count, '0.values.0.0')
  return exist
}

export function exportToDB({ projectName, thumbnail = '', projectPath, description = '', tag }: { [key: string]: string }): boolean {
  if (!DB) return false
  DB.close()
  DB = new SQL.Database(readFileSync(dbPath))
  const exist = isProjectInDB(projectPath)
  const time = (new Date()).toISOString()
  const tagString = tag ? '["' + tag.split(',').map(t => t.trim()).join('","') + '"]' : ''
  const commonPairs = {
    name: projectName,
    location: projectPath,
    thumbnail,
    description,
    tag: tagString,
    updatedAt: time,
  }
  if (exist) {
    const updateResult = updateToDB('themes', commonPairs, { location: projectPath })
  } else {
    const insertResult = insertToDB('themes', {
      ...commonPairs,
      createdAt: time,
    })
  }
  if (tag) {
    const tags = tag.split(',').map(s => s.trim())
    const isExist = tag => find('tags', { value: tag }).length
    const insertTag = (tag: string) => !isExist(tag) && insertToDB('tags', { value: tag, use: 1, createdAt: time, updatedAt: time })
    tags.forEach(insertTag)
  }
  // update file
  const DBBuffer = new Buffer(DB.export())
  writeFileSync(dbPath, DBBuffer)
  return true
}

type Pairs = { [key: string]: string | number }

/**
 *
 * @param {string} table - table name
 * @param {string} pairs - * if the value is a array,which should like:`'["arr1","arr2"]'` or `''`
 */
function insertToDB(table: string, pairs: Pairs): QueryResults {
  Object.keys(pairs).forEach(key => pairs[key] = toLower(pairs[key]))
  const fields = Object.keys(pairs).join(',')
  const values = pairs ? '\'' + Object.values(pairs).join('\',\'') + '\'' : ''
  const query = `INSERT INTO ${table} (${fields}) VALUES (${values})`
  return (DB: SQL.Database).exec(query)
}

function updateToDB(table: string, pairs: Pairs, wheres: Pairs): QueryResults {
  Object.keys(pairs).forEach(key => pairs[key] = toLower(pairs[key]))
  const fields = Object.keys(pairs).join(',')
  const values = pairs ? '\'' + Object.values(pairs).join('\',\'') + '\'' : ''
  const condition = wheres ? Object.keys(wheres).map(key => `lower(${key}) = lower('${wheres[key]}')`).join(', ') : ''
  const query = `UPDATE ${table} SET (${fields}) = (${values}) WHERE ${condition}`
  return (DB: SQL.Database).exec(query)
}

function find(table: string, wheres?: Pairs): QueryResults[] {
  // $FlowFixMe
  const condition = wheres ? 'where ' + Object.keys(wheres).map(key => `lower(${key}) = lower('${(wheres)[key]}')`).join(', ') : ''
  const query = `SELECT * FROM ${table} ${condition}`
  return (DB: SQL.Database).exec(query)
}

export function getProjectInfo(projectPath: string): { [key: string]: string } | null {
  const result = find('themes', { location: projectPath })[0]
  if (!result) return null
  const pairs = result.columns.map((field, index) => {
    return {
      [field]: result.values[0][index],
    }
  })
  return Object.assign({}, ...pairs)
}

export function getTags(): string[] {
  const result = find('tags')[0]
  return result.values.map(value => value[1])
}
