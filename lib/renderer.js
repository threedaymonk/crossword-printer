const { stripIndents } = require("common-tags");
const latexEscape = require("escape-latex");
const smartquotes = require("smartquotes");

const MAX_GRID_HEIGHT = 13.5; // cm
const DEFAULT_CELL_SIZE = 0.8; // cm

const lescape = (v) => {
  if (typeof v === "string") {
    return latexEscape(smartquotes(v));
  } else {
    return v;
  }
};

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
      let formatStr = "";
      if (format) {
        formatStr = ` (${format})`;
      }
      output += $l`\\item[${number}]{${clue}${formatStr}}\n`;
    });
    output += `\\end{compactitem}\n`;
  });
  output += "\\end{multicols}\n";
  return output;
};

const cellSize = (crossword) => {
  return Math.min(DEFAULT_CELL_SIZE, MAX_GRID_HEIGHT / crossword.height);
};

const byline = (crossword) => {
  if (crossword.creator) {
    return `\\author{${lescape(crossword.creator)}}`
  } else {
    return "";
  }
};

const renderCrosswordToTex = (crossword) => {
  return stripIndents`
    \\documentclass{crossword}
    \\begin{document}
    \\title{${lescape(crossword.title || "Crossword")}}
    ${byline(crossword)}
    \\maketitle
    \\renewcommand\\PuzzleUnitlength{${cellSize(crossword)}cm}

    ${renderGrid(crossword)}

    ${renderClueList(crossword)}

    \\end{document}
  `;
};

module.exports = renderCrosswordToTex;
