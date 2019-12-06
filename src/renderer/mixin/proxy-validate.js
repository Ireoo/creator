import {isArray, isFunction} from 'lib/utils'

export default {
  methods: {
    validate(cb) {
      if (isArray(this.$refs.form)) {
        const validForms = this.$refs.form.filter(form => isFunction(form.validate))
        if (!validForms.length) {
          console.warn('forms length is 0')
          cb(true) // eslint-disable-line
          return
        }
        validForms.reduce((fn, form) => {
          return result => form.validate(valid => fn(result && valid))
        }, cb)(true)
        return
      }

      if (!isFunction(this.$refs.form.validate)) {
        console.warn('form reference no validate function')
        cb(true) // eslint-disable-line
        return
      }

      return this.$refs.form.validate(cb)
    },
  },
}
