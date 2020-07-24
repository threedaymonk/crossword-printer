const { parseXml } = require("libxmljs");
const { createWriteStream, readFileSync } = require("fs");
const { range } = require("lodash");
const { stripIndents } = require("common-tags");
const lescape = require("escape-latex");
const latex = require("node-latex");

const NAMESPACES = {
  c: "http://crossword.info/xml/crossword-compiler",
  p: "http://crossword.info/xml/rectangular-puzzle"
};

const LATEX_OPTIONS = {
  cmd: "xelatex",
  errorLogs: "errors.log",
  inputs: "."
};

const MAX_GRID_HEIGHT = 14; // cm
const DEFAULT_CELL_SIZE = 1; // cm

const $l = (strings, ...substitutions) => {
  const escaped = substitutions.map(lescape);
  return strings.reduce((buf, str, i) => {
    return buf + str + (escaped[i] || "");
  }, "");
};

const main = () => {
  for (const path of process.argv.slice(2)) {
    const xml = readFileSync(path);
    const crossword = parseCrosswordXml(xml);
    const tex = generateTex(crossword);
    console.log(tex);
    const output = createWriteStream("output.pdf");
    const pdf = latex(tex, LATEX_OPTIONS);
    pdf.on("error", (err) => {
      console.error(err);
      process.exit(1);
    });
    pdf.on("finish", () => console.log("PDF generated!"));
    pdf.pipe(output);
  }
};

const parseCrosswordXml = (xml) => {
  const doc = parseXml(xml);
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
  const cells = range(height).map((y) => {
    return range(width).map((x) => {
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
  let output = $l`\\begin{Puzzle}{${crossword.width}}{${crossword.height}}%\n`;
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
  output += "\\begin{multicols}{4}\n";
  crossword.clues.forEach(([dir, clues]) => {
    output += $l`\\section*{${dir}}\n\n`;
    output += "\\begin{compactitem}\n";
    clues.forEach(([number, clue, format]) => {
      output += $l`\\item[${number}]{${clue} (${format})}\n`;
    });
    output += `\\end{compactitem}\n`;
  });
  output += "\\end{multicols}\n";
  return output;
};

const cellSize = (crossword) => {
  Math.min(DEFAULT_CELL_SIZE, MAX_GRID_HEIGHT / crossword.height);
};

const generateTex = (crossword) => {
  return stripIndents`
    \\documentclass{crossword}
    \\begin{document}
    \\title{Crossword}
    \\maketitle
    \\renewcommand\\PuzzleUnitlength{${14 / crossword.width}cm}

    ${generatePuzzle(crossword)}

    ${generateClues(crossword)}

    \\end{document}
  `;
};

main();
