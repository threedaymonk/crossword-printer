const { LocalDate } = require("@js-joda/core");

const parseDate = (str) => {
  if (str.match(/^y(esterday)?$/))
    return LocalDate.now().minusDays(1);
  if (str.match(/^t(oday)?$/))
    return LocalDate.now();
  if (str.match(/^-?\d+$/))
    return LocalDate.now().plusDays(parseInt(str, 10));
  return LocalDate.parse(str);
};

module.exports = parseDate;
