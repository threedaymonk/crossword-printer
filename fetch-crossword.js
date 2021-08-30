#!/usr/bin/env node

const { createWriteStream, readFileSync } = require("fs");
const latex = require("node-latex");
const { Command } = require("commander");
const { DateTimeFormatter } = require("@js-joda/core");
const { stripIndent } = require("common-tags");
const printer = require("pdf-to-printer");
const fs = require("fs");

const renderCrosswordToTex = require("./lib/renderer");
const parseDate = require("./lib/parse-date")
const sources = require("./lib/sources");

const providers = {
  arkadium: require("./lib/arkadium")
};

const LATEX_OPTIONS = {
  cmd: "xelatex",
  errorLogs: "errors.log",
  inputs: __dirname
};

const filename = (nick, date) => {
  const stamp = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
  return `${nick}-${stamp}.pdf`;
};

const main = async () => {
  const program = new Command();

  program
    .option("-s, --source <NAME>", "crossword source", "es")
    .option("-f, --from <DATE>", "download start date", "today")
    .option("-t, --to <DATE>", "download end date", "today")
    .option("-d, --date <DATE>", "download one day only")
    .option("-p, --print", "print crossword");
  program.on('--help', () => {
    console.log("");
    console.log(stripIndent`
      Date formats:
        - ISO 8601 date: 2020-12-25
        - relative date: -2 (= 2 days ago)
        - yesterday (or y)
        - today (or t)
    `);
    console.log("Sources:");
    for (const s in sources) {
      console.log(`  - ${s}: ${sources[s].description}`);
    }
  });

  program.parse(process.argv);

  const options = program.opts();
  const startDate = parseDate(options.date || options.from);
  const endDate = parseDate(options.date || options.to);
  const nick = options.source;
  const source = sources[nick];

  if (!source) {
    throw `Source ${nick} is not recognised`;
  }

  const fetch = providers[source.provider];

  let date = startDate;
  while (date <= endDate) {
    const destPath = filename(nick, date);
    try {
      const crossword = await fetch(date, nick, source);
      const tex = renderCrosswordToTex(crossword);
      const output = createWriteStream(destPath);
      const pdf = latex(tex, LATEX_OPTIONS);
      pdf.on("error", (err) => {
        console.error(err);
        process.exit(1);
      });
      pdf.on("finish", async () => {
        if (options.print) {
          await printer.print(destPath);
          fs.unlinkSync(destPath);
          console.log(`Printed ${destPath}`);
        } else {
          console.log(`Generated ${destPath}`);
        }
      });
      pdf.pipe(output);
    } catch (err) {
      if (err.name == "CrosswordNotAvailableError") {
        console.log(`No crossword available for ${date}`);
      } else {
        throw err;
      }
    }
    date = date.plusDays(1);
  }
};

main();
