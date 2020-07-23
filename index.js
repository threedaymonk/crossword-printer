const libxmljs = require("libxmljs");
const fs = require("fs");
const _ = require("lodash");

const NAMESPACES = {
  c: "http://crossword.info/xml/crossword-compiler",
  p: "http://crossword.info/xml/rectangular-puzzle"
};

const main = () => {
  for (const path of process.argv.slice(2)) {
    const xml = fs.readFileSync(path);
    console.log(JSON.stringify(parseXml(xml), null, 2));
  }
};

const parseXml = (xml) => {
  const doc = libxmljs.parseXml(xml);
  const crossword = doc.get("//p:crossword", NAMESPACES);
  const grid = crossword.get("p:grid", NAMESPACES);
  const clues = extractClues(crossword);
  const cells = extractCells(grid);
  return {
    cells: cells,
    clues: clues
  };
};

const extractCells = (grid) => {
  const width = parseInt(grid.attr("width").value(), 10);
  const height = parseInt(grid.attr("height").value(), 10);
  return _.range(height).map((y) => {
    return _.range(width).map((x) => {
      const cell = grid.get(`p:cell[@x=${x + 1} and @y=${y + 1}]`, NAMESPACES);
      let result = {};
      if (cell.attr("type")) {
        result.type = cell.attr("type").value();
      } else {
        result.type = "letter";
      }
      if (cell.attr("number")) {
        result.number = parseInt(cell.attr("number").value(), 10);
      }
      if (cell.attr("solution")) {
        result.solution = cell.attr("solution").value();
      }
      return result;
    });
  });
};

const extractClues = (crossword) => {
  return crossword.find("p:clues", NAMESPACES).reduce((result, clues) => {
    const words = clues.find("p:clue", NAMESPACES).reduce((words, clue) => {
      const number = parseInt(clue.attr("number").value(), 10);
      const text = `${clue.text().trim()} (${clue.attr("format").value()})`;
      return { ...words, [number]: text };
    }, {});
    const title = clues.get("p:title", NAMESPACES).text().trim();
    return { ...result, [title]: words };
  }, {});
};

main();
