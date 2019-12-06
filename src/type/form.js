// @flow
export type FormField = {
  name: string,
  type: string,
  default: any,
  required?: boolean,
  hint?: string,
  rule?: string | string[],
  display?: (data: any) => boolean,
  suggestions?: (query: string, cb: Function, data: {}, vm: any) => void,
  selections?: any,
}

export type Form = FormField[]
export type FormMap = {
  [key: string]: FormField,
}
