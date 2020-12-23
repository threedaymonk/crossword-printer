#!/usr/bin/env node

const { createWriteStream, readFileSync } = require("fs");
const parseCrosswordXml = require("./lib/parser");
const renderCrosswordToTex = require("./lib/renderer");
const latex = require("node-latex");
const { Command } = require("commander");
const { DateTimeFormatter, LocalDate } = require("@js-joda/core");
const { Locale } = require("@js-joda/locale_en");
const {} = require("@js-joda/timezone");
const { oneLineTrim, stripIndent } = require("common-tags");
const download = require("download");
const printer = require("pdf-to-printer");
const fs = require("fs");

const LATEX_OPTIONS = {
  cmd: "xelatex",
  errorLogs: "errors.log",
  inputs: __dirname
};

const downloadUrl = (date) => {
  const stamp = date.format(DateTimeFormatter.ofPattern("yyMMdd"));
  return oneLineTrim`
    https://ams.cdn.arkadiumhosted.com/assets/gamesfeed/evening-standard/
    daily-crossword/cryp_${stamp}.xml
  `;
};

const filename = (date) => {
  const stamp = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
  return `cryptic-${stamp}.pdf`;
};

const title = (date) => {
  const formatted = date.format(
    DateTimeFormatter.ofPattern("EEEE d MMMM yyyy").withLocale(Locale.UK)
  );
  return `Evening Standard Cryptic Crossword for ${formatted}`;
};

const parseDate = (str) => {
  if (str.match(/^y(esterday)?$/))
    return LocalDate.now().minusDays(1);
  if (str.match(/^t(oday)?$/))
    return LocalDate.now();
  if (str.match(/^-?\d+$/))
    return LocalDate.now().plusDays(parseInt(str, 10));
  return LocalDate.parse(str);
};

const main = async () => {
  const program = new Command();

  program
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
  });

  program.parse(process.argv);

  const startDate = parseDate(program.date || program.from);
  const endDate = parseDate(program.date || program.to);

  let date = startDate;
  while (date <= endDate) {
    const destPath = filename(date);
    try {
      const xml = await download(downloadUrl(date));
      const crossword = { ...parseCrosswordXml(xml), title: title(date) };
      const tex = renderCrosswordToTex(crossword);
      const output = createWriteStream(destPath);
      const pdf = latex(tex, LATEX_OPTIONS);
      pdf.on("error", (err) => {
        console.error(err);
        process.exit(1);
      });
      pdf.on("finish", async () => {
        if (program.print) {
          await printer.print(destPath);
          fs.unlinkSync(destPath);
          console.log(`Printed ${destPath}`);
        } else {
          console.log(`Generated ${destPath}`);
        }
      });
      pdf.pipe(output);
    } catch (err) {
      if (err.name == "HTTPError") {
        console.log(`No crossword available for ${date}`);
      } else {
        throw err;
      }
    }
    date = date.plusDays(1);
  }
};

main();
