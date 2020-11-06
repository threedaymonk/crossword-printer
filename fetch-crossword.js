#!/usr/bin/env node

const { createWriteStream, readFileSync } = require("fs");
const parseCrosswordXml = require("./lib/parser");
const renderCrosswordToTex = require("./lib/renderer");
const latex = require("node-latex");
const { Command } = require("commander");
const { DateTimeFormatter, LocalDate } = require("@js-joda/core");
const { Locale } = require("@js-joda/locale_en");
const {} = require("@js-joda/timezone");
const { oneLineTrim } = require("common-tags");
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

const main = async () => {
  const today = LocalDate.now();
  const program = new Command();

  const parseDate = (str) => LocalDate.parse(str);

  program
    .option("-f, --from <YYYY-MM-DD>", "download start date", parseDate, today)
    .option("-t, --to <YYYY-MM-DD>", "download end date", parseDate, today)
    .option(
      "-d, --date <YYYY-MM-DD>",
      "download for a specific date",
      parseDate,
      today
    )
    .option("-p, --print", "print crossword");

  program.parse(process.argv);

  if (program.date) {
    program.from = program.date;
    program.to = program.date;
  }

  let date = program.from;
  while (date <= program.to) {
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
