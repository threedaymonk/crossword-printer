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
  for (const srcPath of process.argv.slice(2)) {
    const xml = readFileSync(srcPath);
    const crossword = parseCrosswordXml(xml);
    const tex = renderDocument(crossword);
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
  const pCrossword = doc.get("//p:crossword", NAMESPACES);
  const pGrid = pCrossword.get("p:grid", NAMESPACES);
  const clues = parseClues(pCrossword);
  const grid = parseGrid(pGrid);
  return {
    ...grid,
    ...clues
  };
};

const parseGrid = (pGrid) => {
  const width = parseInt(pGrid.attr("width").value(), 10);
  const height = parseInt(pGrid.attr("height").value(), 10);
  const grid = range(height).map((y) => {
    return range(width).map((x) => {
      const pCell = pGrid.get(
        `p:cell[@x=${x + 1} and @y=${y + 1}]`,
        NAMESPACES
      );
      let result = {};
      if (pCell.attr("type")) {
        result.type = pCell.attr("type").value();
      } else {
        result.type = "letter";
      }
      if (pCell.attr("number")) {
        result.number = parseInt(pCell.attr("number").value(), 10);
      }
      if (pCell.attr("solution")) {
        result.solution = pCell.attr("solution").value();
      }
      return result;
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
        const format = pClue.attr("format").value();
        return [...words, [number, clue, format]];
      }, []);
      const title = pClues.get("p:title", NAMESPACES).text().trim();
      return [...result, [title, clues]];
    }, []);
  return { clues: result };
};

const renderGrid = (crossword) => {
  let output = $l`\\begin{Puzzle}{${crossword.width}}{${crossword.height}}%\n`;
  crossword.grid.forEach((row) => {
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

const renderClueList = (crossword) => {
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

const renderDocument = (crossword) => {
  return stripIndents`
    \\documentclass{crossword}
    \\begin{document}
    \\title{Crossword}
    \\maketitle
    \\renewcommand\\PuzzleUnitlength{${14 / crossword.width}cm}

    ${renderGrid(crossword)}

    ${renderClueList(crossword)}

    \\end{document}
  `;
};

main();
