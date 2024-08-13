const fromBase26 = function(number) {
  number = number.toUpperCase();
  let s = 0;
  let i = 0;
  let dec = 0;
  if (number !== null && typeof number !== "undefined" && number.length > 0) {
    for (; i < number.length; i++) {
      s = number.charCodeAt(number.length - i - 1) - "A".charCodeAt(0);
      dec += Math.pow(26, i) * (s + 1);
    }
  }
  return dec - 1;
};
const toBase26 = function(value) {
  value = Math.abs(value);
  let converted = "";
  let iteration = false;
  let remainder;
  do {
    remainder = value % 26;
    if (iteration && value < 25) {
      remainder--;
    }
    converted = String.fromCharCode(remainder + "A".charCodeAt(0)) + converted;
    value = Math.floor((value - remainder) / 26);
    iteration = true;
  } while (value > 0);
  return converted;
};
const breakOutRanges = (rangeStr, delimStr) => {
  if (!RegExp("[a-z]+[0-9]+:[a-z]+[0-9]+", "gi").test(rangeStr)) {
    throw "This is not a valid range: " + rangeStr;
  }
  const range = rangeStr.split(":");
  let endRow;
  let endCol;
  let totalRows;
  let totalCols;
  let curCol;
  let curRow;
  let curCell;
  let retStr;
  const startRow = parseInt(range[0].match(/[0-9]+/gi)[0]);
  const startCol = range[0].match(/[A-Z]+/gi)[0];
  const startColDec = fromBase26(startCol);
  endRow = parseInt(range[1].match(/[0-9]+/gi)[0]), endCol = range[1].match(/[A-Z]+/gi)[0], fromBase26(endCol), // Total rows and cols
  totalRows = endRow - startRow + 1, totalCols = fromBase26(endCol) - fromBase26(startCol) + 1, // Loop vars
  curCol = 0, curRow = 1, curCell = "", // Return String
  retStr = "";
  for (; curRow <= totalRows; curRow += 1) {
    for (; curCol < totalCols; curCol += 1) {
      curCell = toBase26(startColDec + curCol) + "" + (startRow + curRow - 1);
      retStr += curCell + (curRow === totalRows && curCol === totalCols - 1 ? "" : delimStr);
    }
    curCol = 0;
  }
  return retStr;
};
export {
  breakOutRanges
};
