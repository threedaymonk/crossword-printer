const { DateTimeFormatter } = require("@js-joda/core");
const { Locale } = require("@js-joda/locale_en");
const { oneLineTrim } = require("common-tags");
const download = require("download");

const parseCrosswordXml = require("./crossword-xml-parser");

const downloadUrl = (fragment, date) => {
  const stamp = date.format(DateTimeFormatter.ofPattern("yyMMdd"));
  return oneLineTrim`
    https://ams.cdn.arkadiumhosted.com/assets/gamesfeed/${fragment}${stamp}.xml
  `;
};

const filename = (sourceName, date) => {
  const stamp = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
  return `${sourceName}-${stamp}.pdf`;
};

const title = (description, date) => {
  const formatted = date.format(
    DateTimeFormatter.ofPattern("EEEE d MMMM yyyy").withLocale(Locale.UK)
  );
  return `${description} for ${formatted}`;
};

class CrosswordNotAvailableError extends Error {
  constructor(...params) {
    super(...params);
    this.name = "CrosswordNotAvailableError";
  }
}

const fetch = async (date, nick, {description, fragment}) => {
  try {
    const xml = await download(downloadUrl(fragment, date));
    const crossword = { ...parseCrosswordXml(xml), title: title(description, date) };
    return crossword;
  } catch (err) {
    if (err.name == "HTTPError") {
      throw new CrosswordNotAvailableError()
    } else {
      throw err;
    }
  }
};

module.exports = fetch;
