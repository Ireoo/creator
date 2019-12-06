import form from '@/static/form'
import parameter from '@/static/parameter'
import label from '@/static/label'
import instruction from '@/static/instruction'
import setting from '@/static/setting'
import info from '@/static/info'
import condition from '@/static/condition'

const state = {
  form,
  parameter,
  label,
  instruction,
  setting,
  info,
  condition,
}

// this module is store the static data, no mutation, no action, only have state
// freeze state for speed up
export default {
  name: 'static',
  state: Object.freeze(state),
}
