const { parseXml } = require("libxmljs");
const { range } = require("lodash");
const { take } = require("pipe-operator");

const NAMESPACES = {
  c: "http://crossword.info/xml/crossword-compiler",
  p: "http://crossword.info/xml/rectangular-puzzle"
};

const parseCrosswordXml = (xml) => {
  const doc = parseXml(xml);
  const pCrossword = doc.get("//p:crossword", NAMESPACES);
  const pGrid = pCrossword.get("p:grid", NAMESPACES);
  const clues = parseClues(pCrossword);
  const grid = parseGrid(pGrid);
  return {
    ...grid,
    ...clues
  };
};

const mergeCond = (obj, key, entity, process) => {
  if (entity) {
    return { ...obj, [key]: process(entity) };
  } else {
    return obj;
  }
}

const textValue = (attr) => attr.value();
const numericValue = (attr) => parseInt(attr.value(), 10);
const textContent = (node) => node.text().trim();

const parseGrid = (pGrid) => {
  const width = numericValue(pGrid.attr("width"));
  const height = numericValue(pGrid.attr("height"));
  const grid = range(height).map((y) => {
    return range(width).map((x) => {
      const pCell = pGrid.get(
        `p:cell[@x=${x + 1} and @y=${y + 1}]`,
        NAMESPACES
      );
      return take({ type: "letter" })
        .pipe(mergeCond, "type", pCell.attr("type"), textValue)
        .pipe(mergeCond, "number", pCell.attr("number"), numericValue)
        .pipe(mergeCond, "solution", pCell.attr("solution"), textValue)
        .result();
    });
  });
  return {
    width: width,
    height: height,
    grid: grid
  };
};

const parseClues = (crossword) => {
  const result = crossword
    .find("p:clues", NAMESPACES)
    .reduce((result, pClues) => {
      const clues = pClues.find("p:clue", NAMESPACES).reduce((words, pClue) => {
        const number = numericValue(pClue.attr("number"));
        const clue = textContent(pClue);
        let format;
        if (pClue.attr("format")) {
          format = textValue(pClue.attr("format"));
        }
        return [...words, [number, clue, format]];
      }, []);
      const title = textContent(pClues.get("p:title", NAMESPACES));
      return [...result, [title, clues]];
    }, []);
  return { clues: result };
};

module.exports = parseCrosswordXml;
