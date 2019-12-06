// @flow

export default class DragPayload {
  type: string
  data: any

  static newFromJSON(json: string): ?DragPayload {
    try {
      const payload = JSON.parse(json)
      if (payload.type && payload.data) {
        const dp = new DragPayload(payload.type)
        dp.data = payload.data
        return dp
      }
    } catch (e) {
      return null
    }
  }

  static newFromDataTransfer(data: DataTransfer): ?DragPayload {
    return DragPayload.newFromJSON(data.getData('application/json'))
  }

  constructor(type: string) {
    this.type = type
  }

  is(type: string): boolean {
    return this.type === type
  }

  setToDataTransfer(data: DataTransfer) {
    data.setData('application/json', JSON.stringify(this))
  }
}
