import * as Utils from 'lib/utils'

describe('lib/utils', function() {
  it('trimZero', function() {
    const tests0 = [
      [1, '1'], ['1', '1'],
      [1.2, '1'], ['1.2', '1'],
      [-1, '-1'], ['-1', '-1'],
      [-1.2, '-1'], ['-1.2', '-1'],
      [0.3, '0'], ['0.3', '0'],
      [4.909, '5'], ['4.909', '5'],
    ]
    const tests2 = [
      [1, '1'], ['1', '1'],
      [1.00, '1'], ['1.00', '1'],
      [1.10, '1.1'], ['1.10', '1.1'],
      [1.11, '1.11'], ['1.11', '1.11'],
      [1.111, '1.11'], ['1.111', '1.11'],
      [0.30, '0.3'], ['0.30', '0.3'],
      [1 / 3, '0.33'], ['0.333333333', '0.33'],
      [1.998, '2'], ['1.998', '2'],
      [-1.333, '-1.33'], ['-1.333', '-1.33'],
    ]

    for (const [input, output] of tests0) {
      expect(Utils.trimZero(input, 0)).to.be.equal(output)
    }
    for (const [input, output] of tests2) {
      expect(Utils.trimZero(input, 2)).to.equal(output)
    }
  })
})
