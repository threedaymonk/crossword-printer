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

const parseGrid = (pGrid) => {
  const width = parseInt(pGrid.attr("width").value(), 10);
  const height = parseInt(pGrid.attr("height").value(), 10);
  const grid = range(height).map((y) => {
    return range(width).map((x) => {
      const pCell = pGrid.get(
        `p:cell[@x=${x + 1} and @y=${y + 1}]`,
        NAMESPACES
      );
      return take({ type: "letter" })
        .pipe(mergeCond, "type", pCell.attr("type"), a => a.value())
        .pipe(mergeCond, "number", pCell.attr("number"), a => parseInt(a.value(), 10))
        .pipe(mergeCond, "solution", pCell.attr("solution"), a => a.value())
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
        const number = parseInt(pClue.attr("number").value(), 10);
        const clue = pClue.text().trim();
        let format;
        if (pClue.attr("format")) {
          format = pClue.attr("format").value();
        }
        return [...words, [number, clue, format]];
      }, []);
      const title = pClues.get("p:title", NAMESPACES).text().trim();
      return [...result, [title, clues]];
    }, []);
  return { clues: result };
};

module.exports = parseCrosswordXml;
