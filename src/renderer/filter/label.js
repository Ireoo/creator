import label from '@/static/label'

export default {
  labelify(value, type) {
    return label[type][value] || value
  },
}
