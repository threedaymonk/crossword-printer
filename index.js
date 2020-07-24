const { createWriteStream, readFileSync } = require("fs");
const parseCrosswordXml = require("./lib/parser");
const renderCrosswordToTex = require("./lib/renderer");
const latex = require("node-latex");

const LATEX_OPTIONS = {
  cmd: "xelatex",
  errorLogs: "errors.log",
  inputs: "."
};

for (const srcPath of process.argv.slice(2)) {
  const xml = readFileSync(srcPath);
  const crossword = parseCrosswordXml(xml);
  const tex = renderCrosswordToTex(crossword);
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
