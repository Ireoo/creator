// @flow
import { clone, flatten, omit } from 'ramda'
import { isArray } from './utils'

import type { FormMap, Form, FormField } from 'type/form'

/**
 * create a object base on form blueprint
 * @param {Form} form
 * @returns {{}}
 */
export function createFormObject(form: Form = []): Object {
  const res = {}
  for (let item of form) {
    // item.default must be exist
    res[item.name] = clone(item.default)
  }
  return res
}

/**
 * create a form object instead of array
 * @param form
 * @returns {{}}
 */
export function createFormMap(form: Form = []): FormMap {
  const res = {}
  for (let prop of form) {
    res[prop.name] = prop
  }
  return res
}

export function getFormNames(form: Form = []): string[] {
  return form.map(field => field.name)
}

export function createFormRules(form: Form = [], rulesList: any = {}) {
  return form.reduce((rules, field) => {
    let rule = []

    if (field.rule) {
      if (typeof field.rule === 'string') {
        rule.push(rulesList[field.rule])
      } else if (isArray(field.rule)) {
        rule.push(...field.rule.map(r => {
          // r is string or object, if object, push into array
          if (typeof r === 'string') return rulesList[r]
          return r
        }))
      } else {
        rule.push(field.rule)
      }
    }

    if (field.required) {
      rule.push({
        required: !!field.required,
      })
    }

    rules[field.name] = flatten(rule).filter(v => !!v)
    return rules
  }, {})
}

export function createFormWithAdditional(form: Form = [], additional: Form = []) {
  // if additional is empty, direct return form for keep reference for cache
  if (!additional.length) return form

  form = clone(form)
  form.forEach(field => {
    const add = additional.find(add => add.name === field.name)
    if (!add) return

    if (add.rule) {
      field.rule = flatten([field.rule, add.rule]).filter(n => n)
    }

    // TODO: form selection
    // if (add.selections) {
    //   if (field.type === 'file-select') {
    //     const originSelections = field.selections
    //     field.selections = (cb, data, vm) => originSelections(file => add.selections(file, cb, data, vm), data, vm)
    //   } else if (!isFunction(add.selections)) {
    //     field.selections = add.selections
    //   } else {
    //     const originSelections = field.selections
    //     field.selections = (data, vm) => {
    //       return add.selections(doData(originSelections, data, vm), data, vm)
    //     }
    //   }
    // }

    // TODO: form suggestion
    // if (add.suggestions && isFunction(add.suggestions)) {
    //   const originSuggestions = field.suggestions || ((data, cb) => cb())
    //   field.suggestions = (query, cb, data, vm) => {
    //     originSuggestions(query, value => {
    //       add.suggestions(value, query, cb, data, vm)
    //     }, data, vm)
    //   }
    // }

    Object.assign(field, omit(['rule', 'suggestions', 'selections'], add))
  })

  return form
}

export function value2Label(field: FormField, value: any, containChild?: boolean = false) {
  switch (field.type) {
    case 'cascader':
      if (field.selections) {
        const selection = field.selections.find(selection => selection.value === value[0])
        let label = selection.label
        if (containChild) { label += '>' + selection.children.find(selection => selection.value === value[1]).label }
        return label
      }
      return ''
  }
}

export function labelI18n(form: FormField[], format: Function): FormField[] {
  form = clone(form)
  const labelI18n = (arr: Array<any>) => {
    arr.forEach(item => {
      if (item.label) item.label = format(item.label)
      if (item.children) labelI18n(item.children)
    })
  }
  [form.action, form.transition]
    .forEach(t => t.filter(f => f.selections instanceof Array)
      .forEach(f => labelI18n(f.selections || [])))
  return form
}
