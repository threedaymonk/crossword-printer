\ProvidesClass{crossword}[Cryptic Crossword]
\PassOptionsToClass{a4paper}{article}
\LoadClass{article}

\usepackage{fontspec}
\usepackage[large]{cwpuzzle}
\usepackage[margin=1cm]{geometry}
\usepackage{multicol}
\usepackage{paralist}
\usepackage{titlesec}
\usepackage{xcolor}
\usepackage{xunicode}

% Redefine maketitle to print just the title
\def\@maketitle{%
  \newpage
  \noindent\LARGE\textbf\@title\par
  \noindent\@author\par
  \vskip 1.5em
  }

\definecolor{filled}{gray}{0.6}

% Set document font
\setmainfont{Lato}

% Use no leading between lines
\linespread{1.0}

% Leave less spacing around section titles (Across and Down)
\titlespacing*{\section}{0em}{.5em}{.5em}

% Allocate less space for the puzzle number - we only use 2 digits
\setdefaultleftmargin{1.5em}{}{}{}{.5em}{.5em}

% Make non-letter cells grey by default, to save toner
\renewcommand\PuzzleBlackBox{\textcolor{filled}{\rule{\PuzzleUnitlength}{\PuzzleUnitlength}}}

% Eliminate page numbers
\pagenumbering{gobble}
