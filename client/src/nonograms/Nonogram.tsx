import React, { useEffect, useRef, useState } from 'react';
// import PropTypes from 'prop-types';
import { drawLine, getContext } from './CanvasHelper';

export type NonogramProps = {
  width: number;
  height: number;
  imageMap: Array<Array<boolean>>;
  highlightCorrect: boolean;
};

type SolutionState = Array<Array<{
  empty: boolean;
  filled: boolean;
  possiblyFilledBy: Array<{
    direction: 'row' | 'col',
    segment: number,
    alignment: 'start' | 'end',
  }>;
  isCorrect: boolean;
}>>;

type Hint = {
  length: number;
  color: string;
  done: boolean;
};

type AxisHints = {
  maxLength: number;
  hints: Array<Array<Hint>>;
}

const initialSolutionState = (imageMap: Array<Array<boolean>>): SolutionState => {
  const solutionState: SolutionState = [];
  imageMap.forEach((col, i) => {
    solutionState.push([]);
    col.forEach((row, j) => {
      solutionState[i].push({
        empty: false,
        filled: imageMap[i][j],
        possiblyFilledBy: [],
        isCorrect: false,
      });
    });
  });

  return solutionState;
};

export const Nonogram = ({width, height, imageMap, highlightCorrect}: NonogramProps) => {
  const canvasRef = useRef(null)
  const [solutionState, setSolutionState] = useState(initialSolutionState(imageMap));
  const [colHints, setColHints] = useState({maxLength: 0, hints: []} as AxisHints);
  const [rowHints, setRowHints] = useState({maxLength: 0, hints: []} as AxisHints);
  const [canvasInitialized, setCanvasInitialized] = useState(false);
  const [boxSize, setBoxSize] = useState(0);
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [xPlaymatOffset, setXPlaymatOffset] = useState(0);
  const [yPlaymatOffset, setYPlaymatOffset] = useState(0);
  const [drawWidth, setDrawWidth] = useState(0);
  const [drawHeight, setDrawHeight] = useState(0);

  // Style constants
  const fineLineWidth = 1;
  const boldLineWidth = 3;
  const margin = 5;

  const calculateHints = () => {
    const newColHints: AxisHints = {maxLength: 0, hints: []};
    const newRowHints: AxisHints = {maxLength: 0, hints: []};

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
      if (hints.length > newColHints.maxLength) {
        newColHints.maxLength = hints.length;
      }
      newColHints.hints.push(hints);
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
      if (hints.length > newRowHints.maxLength) {
        newRowHints.maxLength = hints.length;
      }
      newRowHints.hints.push(hints);
    });

    setColHints(newColHints);
    setRowHints(newRowHints);
  };

  const calculateDimensions = () => {
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    const ctx = getContext(canvas);
    if (!canvas || !ctx) return false;

    const nonogramWidth = width + rowHints.maxLength;
    const nonogramHeight = height + colHints.maxLength;
    const largestNonogramAxis = nonogramWidth > nonogramHeight ? nonogramWidth : nonogramHeight;
    const smallestCanvasDimension = canvas.width > canvas.height ? canvas.height : canvas.width;
    const newBoxSize = Math.floor((smallestCanvasDimension - margin * 2) / largestNonogramAxis);
    const newDrawWidth = nonogramWidth * newBoxSize;
    const newDrawHeight = nonogramHeight * newBoxSize;
    const newXOffset = Math.floor((canvas.width - newDrawWidth) / 2);
    const newYOffset = Math.floor((canvas.height - newDrawHeight) / 2);
    const newXPlaymatOffset = newXOffset + rowHints.maxLength * newBoxSize;
    const newYPlaymatOffset = newYOffset + colHints.maxLength * newBoxSize;

    setBoxSize(newBoxSize);
    setDrawWidth(newDrawWidth);
    setDrawHeight(newDrawHeight);
    setXOffset(newXOffset);
    setYOffset(newYOffset);
    setXPlaymatOffset(newXPlaymatOffset);
    setYPlaymatOffset(newYPlaymatOffset);

    return true;
  };

  const drawCanvas = () => {
    // Ensure the canvas is initialized
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    const ctx = getContext(canvas);
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, window.innerHeight, window.innerWidth);

    // Set hint styles
    ctx.font = `${boxSize * .6}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.setLineDash([3, 3])

    // Draw column hints
    const hintXOffset = rowHints.maxLength * boxSize + xOffset;
    colHints.hints.forEach((hints, i) => {
      const hintYOffset = colHints.maxLength - hints.length + .3;
      const x = (i + .5) * boxSize + hintXOffset;
      hints.forEach((hint, j) => {
        const y = (j + hintYOffset) * boxSize + yOffset;
        ctx.fillStyle = hint.color;
        ctx.fillText(`${hint.length}`, x, y);
      });
    });
    // Dividing lines
    for (let i = 1; i < colHints.maxLength; i++) {
      const y = i * boxSize + yOffset;
      drawLine({
        ctx,
        from: {x: hintXOffset, y},
        to: {x: xOffset + drawWidth, y},
        width: fineLineWidth,
      });
    }

    // Draw row hints
    const hintYOffset = (colHints.maxLength + .3) * boxSize + yOffset;
    rowHints.hints.forEach((hints, j) => {
      const hintXOffset = rowHints.maxLength - hints.length + .5;
      const y = j * boxSize + hintYOffset;
      hints.forEach((hint, i) => {
        const x = (i + hintXOffset) * boxSize + xOffset;
        ctx.fillStyle = hint.color;
        ctx.fillText(`${hint.length}`, x, y);
      });
    });
    // Dividing lines
    for (let i = 1; i < rowHints.maxLength; i++) {
      const x = i * boxSize + xOffset;
      drawLine({
        ctx,
        from: {x, y: hintYOffset - (boxSize * .3)},
        to: {x, y: yOffset + drawHeight},
        width: fineLineWidth,
      });
    }

    // Reset line dash
    ctx.setLineDash([])

    // Fill playmat boxes
    solutionState.forEach((col, i) => {
      col.forEach((box, j) => {
        const x = i * boxSize + xPlaymatOffset;
        const y = j * boxSize + yPlaymatOffset;
        if (box.isCorrect && highlightCorrect) {
          ctx.fillStyle = 'green';
          ctx.fillRect(x, y, boxSize, boxSize);
        } else if (box.filled) {
          ctx.fillStyle = 'black';
          ctx.fillRect(x, y, boxSize, boxSize);
        } else if (box.empty) {
          drawLine({ctx, from: {x, y}, to: {x: x + boxSize, y: y + boxSize}, width: fineLineWidth});
          drawLine({ctx, from: {x: x + boxSize, y}, to: {x, y: y + boxSize}, width: fineLineWidth});
        } else if (box.possiblyFilledBy.length > 0) {
          box.possiblyFilledBy.forEach((guess, k) => {
            const guessXStart = x + (guess.direction === 'row' ? 0 : (.33 + (guess.alignment === 'start' ? 0 : .33)) * boxSize);
            const guessYStart = y + (guess.direction === 'col' ? 0 : (.33 + (guess.alignment === 'start' ? 0 : .33)) * boxSize);
            const guessXEnd = guessXStart + (guess.direction === 'row' ? boxSize : 0);
            const guessYEnd = guessYStart + (guess.direction === 'col' ? boxSize : 0);
            drawLine({
              ctx,
              from: {x: guessXStart, y: guessYStart},
              to: {x: guessXEnd, y: guessYEnd},
              width: fineLineWidth,
              style: 'blue'
            });
          });
        }
      });
    });

    // Draw vertical lines
    imageMap.forEach((col, i) => {
      const x = i * boxSize + xPlaymatOffset;
      const lineWidth = i % 5 === 0 ? boldLineWidth : fineLineWidth;
      drawLine({ctx, from: {x, y: yOffset}, to: {x, y: yOffset + drawHeight}, width: lineWidth});
    });
    const lastLineX = width * boxSize + xPlaymatOffset;
    drawLine({ctx, from: {x: lastLineX, y: yOffset}, to: {x: lastLineX, y: yOffset + drawHeight}, width: boldLineWidth});

    // Draw horizontal lines
    imageMap[0].forEach((row, j) => {
      const y = j * boxSize + yPlaymatOffset;
      const lineWidth = j % 5 === 0 ? boldLineWidth : fineLineWidth;
      drawLine({ctx, from: {x: xOffset, y}, to: {x: xOffset + drawWidth, y}, width: lineWidth});
    });
    const lastLineY = height * boxSize + yPlaymatOffset;
    drawLine({ctx, from: {x: xOffset, y: lastLineY}, to: {x: xOffset + drawWidth, y: lastLineY}, width: boldLineWidth});
  };
  
  const onCanvasClick = (e: React.MouseEvent) => {
    // Figure out which box was clicked
    const {clientX, clientY} = e;
    const canvas = e.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < xPlaymatOffset || x > xOffset + drawWidth || y < yPlaymatOffset || y > yOffset + drawHeight) return;
    const boxX = Math.floor((x - xPlaymatOffset) / boxSize);
    const boxY = Math.floor((y - yPlaymatOffset) / boxSize);

    // Cycle the box's state between empty, filled, and undefined
    const currentBoxState = solutionState[boxX][boxY];
    const newSolutionState = [...solutionState];
    if (!currentBoxState.empty && !currentBoxState.filled && !currentBoxState.possiblyFilledBy.length) {
      newSolutionState[boxX][boxY].empty = true;
    } else if (currentBoxState.empty) {
      newSolutionState[boxX][boxY].empty = false;
      newSolutionState[boxX][boxY].filled = true;
    } else if (currentBoxState.filled) {
      newSolutionState[boxX][boxY].empty = false;
      newSolutionState[boxX][boxY].filled = false;
      newSolutionState[boxX][boxY].possiblyFilledBy = [
        // {direction: 'row', segment: 0, alignment: 'start'},
        {direction: 'row', segment: 0, alignment: 'end'},
        // {direction: 'col', segment: 0, alignment: 'start'},
        // {direction: 'col', segment: 0, alignment: 'end'},
      ];
    } else if (currentBoxState.possiblyFilledBy.length > 0) {
      newSolutionState[boxX][boxY].possiblyFilledBy = [];
    }

    if (newSolutionState[boxX][boxY].filled && imageMap[boxX][boxY]) {
      newSolutionState[boxX][boxY].isCorrect = true;
    } else {
      newSolutionState[boxX][boxY].isCorrect = false;
    }

    setSolutionState(newSolutionState);

    // Draw
    drawCanvas();
  };

  if (!canvasInitialized) {
    // Wait for the canvas to be initialized
    setTimeout(() => {
      if (calculateDimensions()) {
        setCanvasInitialized(true);
      }
    }, 200);
  }
  
  useEffect(() => {
    if (canvasInitialized) {
      drawCanvas();
    }
  }, [canvasInitialized, solutionState]);

  useEffect(() => {
    calculateHints();
  }, [imageMap]);

  return (
    <div
      className='nonogram-container'
    >
      <canvas
        ref={canvasRef}
        width={Math.floor((window.visualViewport?.width ?? window.innerWidth) * .8)}
        height={Math.floor((window.visualViewport?.height ?? window.innerHeight) * .8)}
        onClick={onCanvasClick}
      />
    </div>
  );
};

// const imageMapSizedCorrectly = (props, propName, componentName) => {
//   const imageMap = props[propName]

// };

// Nonogram.propTypes = {
//   width: PropTypes.number.isRequired,
//   height: PropTypes.number.isRequired,
//   imageMap: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.bool)),
// }

Nonogram.defaultProps = {
  width: 15,
  height: 15,
  imageMap: Array(15).fill(Array(15).fill(false)),
  highlightCorrect: false,
};