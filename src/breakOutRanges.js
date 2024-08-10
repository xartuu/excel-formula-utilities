// This was Modified from a function at http://en.wikipedia.org/wiki/Hexavigesimal
// Pass in the base 26 string, get back integer
const fromBase26 = function (number) {
  number = number.toUpperCase()

  let s = 0
  let i = 0
  let dec = 0

  if (number !== null && typeof number !== 'undefined' && number.length > 0) {
    for (; i < number.length; i++) {
      s = number.charCodeAt(number.length - i - 1) - 'A'.charCodeAt(0)
      dec += Math.pow(26, i) * (s + 1)
    }
  }

  return dec - 1
}

// Modified from function at http://en.wikipedia.org/wiki/Hexavigesimal
const toBase26 = function (value) {
  value = Math.abs(value)

  let converted = ''
  let iteration = false
  let remainder

  // Repeatedly divide the number by 26 and convert the remainder into the appropriate letter
  do {
    remainder = value % 26

    // Compensate for the last letter of the series being corrected on 2 or more iterations
    if (iteration && value < 25) {
      remainder--
    }

    converted = String.fromCharCode(remainder + 'A'.charCodeAt(0)) + converted
    value = Math.floor((value - remainder) / 26)

    iteration = true
  } while (value > 0)

  return converted
}

// Pass a range such as A1:B2 along with a
// delimiter to get back a full list of ranges.
//
// Example:
// breakOutRanges("A1:B2", "+");
// Returns: A1+A2+B1+B2
export const breakOutRanges = (rangeStr, delimStr) => {
  // Quick Check to see if if rangeStr is a valid range
  if (!RegExp('[a-z]+[0-9]+:[a-z]+[0-9]+', 'gi').test(rangeStr)) {
    throw 'This is not a valid range: ' + rangeStr
  }

  // Make the rangeStr lowercase to deal with looping
  const range = rangeStr.split(':')
  let endRow
  let endCol
  let endColDec
  let totalRows
  let totalCols
  let curCol
  let curRow
  let curCell
  let retStr
  const startRow = parseInt(range[0].match(/[0-9]+/gi)[0])
  const startCol = range[0].match(/[A-Z]+/gi)[0]
  const startColDec = fromBase26(startCol)

  ;(endRow = parseInt(range[1].match(/[0-9]+/gi)[0])),
    (endCol = range[1].match(/[A-Z]+/gi)[0]),
    (endColDec = fromBase26(endCol)),
    // Total rows and cols
    (totalRows = endRow - startRow + 1),
    (totalCols = fromBase26(endCol) - fromBase26(startCol) + 1),
    // Loop vars
    (curCol = 0),
    (curRow = 1),
    (curCell = ''),
    // Return String
    (retStr = '')

  for (; curRow <= totalRows; curRow += 1) {
    for (; curCol < totalCols; curCol += 1) {
      // Get the current cell id
      curCell = toBase26(startColDec + curCol) + '' + (startRow + curRow - 1)
      retStr += curCell + (curRow === totalRows && curCol === totalCols - 1 ? '' : delimStr)
    }
    curCol = 0
  }

  return retStr
}
