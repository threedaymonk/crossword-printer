# Crossword Printer

This is:

- Some code to parse XML format Crossword Compiler files into JSON
- Some code to render that JSON into TeX syntax
- Glue to render a PDF using XeLaTeX and the `crossword` package

## Tools

- `ccxml-to-pdf` will take a list of XML files and render them as PDFs.
- `fetch-crossword` will fetch today's (or a range of dates')
  cryptic crossword and render it to a PDF. With the `-p` flag, it will print it
  directly to the default printer.

## Supported sources

- `es` - Evening Standard Cryptic Crossword
- `indy` - Independent Cryptic Crossword

## Installation

    npm install -g threedaymonk/crossword-printer

You'll also need a working LaTeX installation including XeTeX and the crossword
package; installing [TeX Live](http://tug.org/texlive/) for your operating
system will probably be enough.

## Why?

We used to pick up the free paper every evening and do the cryptic crossword
over a cup of tea before cooking. Now that the physical paper is hard to get
hold of, we've been printing off the online version instead. However, that
requires many clicks and the result is quite hard to read - especially on the
larger weekend grid.
