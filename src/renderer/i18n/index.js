import VueI18n from 'vue-i18n'
import electronStore from 'electron-store'
import path from 'path'
import { merge } from 'lodash'
import getter from './getter'
import fs from 'fs'
import { readJsonSync } from 'fs-extra'

const langPath = path.join(__static, 'language')
export const files = fs.readdirSync(langPath)
export const languages = files.map(filename => path.basename(filename, '.json'))
export const messages = merge(...languages.map(language => {
  const filePath = path.join(langPath, language + '.json')
  return {
    [language]: readJsonSync(filePath),
  }
}))

export default function install(Vue) {
  Vue.use(VueI18n)
  Vue.mixin(getter)

  const setting = new electronStore({ name: 'setting' })
  const locale = setting.get('language')
  const ENGLISH = 'English'
  const i18n = new VueI18n({
    locale: locale || ENGLISH,
    fallbackLocale: ENGLISH,
    messages,
  })
  return i18n
}
