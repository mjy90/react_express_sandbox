export type BoxState = {
  empty: boolean;
  filled: boolean;
  possiblyFilledBy: Array<{
    direction: 'row' | 'col',
    segment: number,
    alignment: 'start' | 'end',
  }>;
  shouldBeFilled: boolean;
}

export type SolutionState = Array<Array<BoxState>>;

export type Hint = {
  length: number;
  color: string;
  done: boolean;
};

export type AxisHints = {
  maxLength: number;
  hints: Array<Array<Hint>>;
};

export type NonogramHints = {
  colHints: AxisHints;
  rowHints: AxisHints;
};

export function getInitialSolutionState(imageMap: Array<Array<boolean>>): SolutionState {
  const solutionState: SolutionState = [];

  imageMap.forEach((col, i) => {
    solutionState.push([]);
    col.forEach((row, j) => {
      solutionState[i].push({
        empty: false,
        filled: false,
        possiblyFilledBy: [],
        shouldBeFilled: imageMap[i][j],
      });
    });
  });

  return solutionState;
};

export function calculateHints(imageMap: Array<Array<boolean>>): NonogramHints {
  const colHints: AxisHints = {maxLength: 0, hints: []};
  const rowHints: AxisHints = {maxLength: 0, hints: []};

  // Calculate column hints
  imageMap.forEach((col, i) => {
    const hints: Array<Hint> = [];
    let currentHint = 0;
    col.forEach((box) => {
      if (box) {
        currentHint++;
      } else if (currentHint > 0) {
        hints.push({length: currentHint, color: 'black', done: false});
        currentHint = 0;
      }
    });
    if (currentHint > 0) {
      hints.push({length: currentHint, color: 'black', done: false});
    }
    if (hints.length > colHints.maxLength) {
      colHints.maxLength = hints.length;
    }
    colHints.hints.push(hints);
  });

  // Calculate row hints
  imageMap[0].forEach((row, j) => {
    const hints: Array<Hint> = [];
    let currentHint = 0;
    imageMap.forEach((col) => {
      if (col[j]) {
        currentHint++;
      } else if (currentHint > 0) {
        hints.push({length: currentHint, color: 'black', done: false});
        currentHint = 0;
      }
    });
    if (currentHint > 0) {
      hints.push({length: currentHint, color: 'black', done: false});
    }
    if (hints.length > rowHints.maxLength) {
      rowHints.maxLength = hints.length;
    }
    rowHints.hints.push(hints);
  });

  return {colHints, rowHints};
};