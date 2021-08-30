#!/usr/bin/env node

const { createWriteStream, readFileSync } = require("fs");
const parseCrosswordXml = require("./lib/crossword-xml-parser");
const renderCrosswordToTex = require("./lib/renderer");
const latex = require("node-latex");

const LATEX_OPTIONS = {
  cmd: "xelatex",
  errorLogs: "errors.log",
  inputs: __dirname
};

process.argv.slice(2).forEach((srcPath) => {
  const destPath = srcPath.replace(/\.xml$/i, ".pdf");
  const xml = readFileSync(srcPath);
  const crossword = parseCrosswordXml(xml);
  const tex = renderCrosswordToTex(crossword);
  const output = createWriteStream(destPath);
  const pdf = latex(tex, LATEX_OPTIONS);
  pdf.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  pdf.on("finish", () => console.log(`Generated ${destPath}`));
  pdf.pipe(output);
});
