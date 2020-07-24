const { stripIndents } = require("common-tags");
const lescape = require("escape-latex");

const MAX_GRID_HEIGHT = 14; // cm
const DEFAULT_CELL_SIZE = 1; // cm

const $l = (strings, ...substitutions) => {
  const escaped = substitutions.map(lescape);
  return strings.reduce((buf, str, i) => {
    return buf + str + (escaped[i] || "");
  }, "");
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

const renderCrosswordToTex = (crossword) => {
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

module.exports = renderCrosswordToTex;
