const libxmljs = require("libxmljs");
const fs = require("fs");
const _ = require("lodash");
const { stripIndents } = require("common-tags");

const NAMESPACES = {
  c: "http://crossword.info/xml/crossword-compiler",
  p: "http://crossword.info/xml/rectangular-puzzle"
};

const main = () => {
  for (const path of process.argv.slice(2)) {
    const xml = fs.readFileSync(path);
    const crossword = parseXml(xml);
    console.log(generateTex(crossword));
  }
};

const parseXml = (xml) => {
  const doc = libxmljs.parseXml(xml);
  const crossword = doc.get("//p:crossword", NAMESPACES);
  const grid = crossword.get("p:grid", NAMESPACES);
  const clues = extractClues(crossword);
  const cells = extractCells(grid);
  return {
    ...cells,
    ...clues
  };
};

const extractCells = (grid) => {
  const width = parseInt(grid.attr("width").value(), 10);
  const height = parseInt(grid.attr("height").value(), 10);
  const cells = _.range(height).map((y) => {
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
  return {
    width: width,
    height: height,
    cells: cells
  };
};

const extractClues = (crossword) => {
  const result = crossword
    .find("p:clues", NAMESPACES)
    .reduce((result, clues) => {
      const words = clues.find("p:clue", NAMESPACES).reduce((words, clue) => {
        const number = parseInt(clue.attr("number").value(), 10);
        const text = clue.text().trim();
        const format = clue.attr("format").value();
        return [...words, [number, text, format]];
      }, []);
      const title = clues.get("p:title", NAMESPACES).text().trim();
      return [...result, [title, words]];
    }, []);
  return { clues: result };
};

const generatePuzzle = (crossword) => {
  let output = `\\begin{Puzzle}{${crossword.width}}{${crossword.height}}%\n`;
  crossword.cells.forEach((row) => {
    row.forEach((cell) => {
      let buf = "|";
      if (cell.type == "letter") {
        if (cell.number) buf += `[${cell.number}]`;
        buf += cell.solution;
      } else {
        buf += "*";
      }
      output += buf.padEnd(7, " ");
    });
    output += "|.\n";
  });
  output += "\\end{Puzzle}\n";
  return output;
};

const generateClues = (crossword) => {
  let output = "";
  crossword.clues.forEach(([dir, clues]) => {
    output += `\\section*{${dir}}\n\n\\begin{itemize}\n`;
    clues.forEach(([number, clue, format]) => {
      output += `\\item [${number}] ${clue} (${format})\n\n`;
    });
    output += `\\end{itemize}\n`;
  });
  return output;
};

const generateTex = (crossword) => {
  return stripIndents`
    \\documentclass{article}
    \\usepackage{fontspec}
    \\usepackage{xunicode}
    \\setmainfont{Lato}
    \\usepackage[margin=1in]{geometry}
    \\usepackage[large]{cwpuzzle}
    \\begin{document}

    ${generatePuzzle(crossword)}

    ${generateClues(crossword)}

    \\end{document}
  `;
};

main();
