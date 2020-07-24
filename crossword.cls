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
  {\noindent \LARGE \textbf \@title \par}%
  \vskip 1.5em}

% Set document font
\setmainfont{Lato}

% Use no leading between lines
\linespread{1.0}

% Leave less spacing around section titles (Across and Down)
\titlespacing*{\section}{0pt}{8pt}{8pt}

% Allocate less space for the puzzle number - we only use 2 digits
\setdefaultleftmargin{1.5em}{}{}{}{.5em}{.5em}

% Make non-letter cells grey by default, to save toner
\renewcommand\PuzzleBlackBox{\textcolor{gray}{\rule{\PuzzleUnitlength}{\PuzzleUnitlength}}}

% Eliminate page numbers
\pagenumbering{gobble}