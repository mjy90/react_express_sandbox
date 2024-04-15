import React, { useEffect, useRef, useState } from 'react';
// import PropTypes from 'prop-types';
import {
  drawLine,
  drawText,
  getContext,
} from './canvasHelper';
import {
  AxisHints,
  getInitialSolutionState,
  calculateHints,
} from './nonogramHelper';
// import NonogramSolver from './NonogramSolver';

export type NonogramProps = {
  width: number;
  height: number;
  imageMap: Array<Array<boolean>>;
  highlightCorrect?: boolean;
  showSolution?: boolean;
  solveAutomatically?: boolean;
};

export const Nonogram = ({width, height, imageMap, highlightCorrect = false, showSolution = false, solveAutomatically = false}: NonogramProps) => {
  const canvasRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  // Playable area state
  const [solutionState, setSolutionState] = useState(getInitialSolutionState(imageMap));
  const [colHints, setColHints] = useState({maxLength: 0, hints: []} as AxisHints);
  const [rowHints, setRowHints] = useState({maxLength: 0, hints: []} as AxisHints);
  // Dimensions
  const [dimensionsVersion, setDimensionsVersion] = useState(0); // Shorthand dependency to redraw canvas
  const [boxSize, setBoxSize] = useState(0);
  const [xOffset, setXOffset] = useState(0);
  const [yOffset, setYOffset] = useState(0);
  const [xPlaymatOffset, setXPlaymatOffset] = useState(0);
  const [yPlaymatOffset, setYPlaymatOffset] = useState(0);
  const [drawWidth, setDrawWidth] = useState(0);
  const [drawHeight, setDrawHeight] = useState(0);
  // // Solver
  // const [solver, setSolver] = useState(null as NonogramSolver | null);
  // const [solverProcess, setSolverProcess] = useState(null as NodeJS.Timer | null);

  // Style constants
  const fineLineWidth = 1;
  const boldLineWidth = 3;
  const margin = 5;

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
    setDimensionsVersion(dimensionsVersion + 1);

    return true;
  };

  const drawCanvas = () => {
    // Ensure the canvas is initialized
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    const ctx = getContext(canvas);
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set hint styles
    const font = `${boxSize * .6}px Arial`;

    // Draw column hints
    const hintXOffset = rowHints.maxLength * boxSize + xOffset;
    colHints.hints.forEach((hints, i) => {
      const hintYOffset = colHints.maxLength - hints.length + .3;
      const x = (i + .5) * boxSize + hintXOffset;
      hints.forEach((hint, j) => {
        const y = (j + hintYOffset) * boxSize + yOffset;
        drawText({ctx, text: `${hint.length}`, position: {x, y}, font, style: hint.color});
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
        drawText({ctx, text: `${hint.length}`, position: {x, y}, font, style: hint.color});
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

        // Draw background solution
        if (showSolution && box.shouldBeFilled) {
          ctx.fillStyle = 'grey';
          ctx.fillRect(x, y, boxSize, boxSize);
        }

        // Draw user solution
        if (box.filled && box.shouldBeFilled && highlightCorrect) {
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

    setSolutionState(newSolutionState);
  };

  // Recalculate hints onMounted or if the imageMap changes
  useEffect(() => {
    // Wait for the canvas DOM to be rendered
    if (isMounted) {
      const hints = calculateHints(imageMap);
      setColHints(hints.colHints);
      setRowHints(hints.rowHints);
      // // Create a new solver with the current hints
      // if (solveAutomatically) {
      //   setSolver(new NonogramSolver(solutionState, hints.colHints, hints.rowHints));
      // }
    } else {
      setIsMounted(true);
    }
  }, [isMounted, imageMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate dimensions when the hints change, thereby changing the borders
  useEffect(() => {
    if (isMounted) {
      calculateDimensions();
    }
  }, [colHints, rowHints]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Draw the canvas when clicks result in edits to the solution state,
  // or when the canvas dimensions change.
  useEffect(() => {
    if (isMounted) {
      drawCanvas();
    }
  }, [solutionState, dimensionsVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // // Solve the nonogram automatically
  // useEffect(() => {
  //   if (solverProcess) {
  //     clearInterval(solverProcess);
  //   }
  //   if (solver && solveAutomatically) {
  //     setSolverProcess(setInterval(() => {
  //       const changed = solver.solveStep();
  //       if (changed) {
  //         setSolutionState(solver.solutionState);
  //       }
  //     }, 60000))
  //   }
  // }, [solver, solveAutomatically]); // eslint-disable-line react-hooks/exhaustive-deps

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

// Nonogram.defaultProps = {
//   width: 15,
//   height: 15,
//   imageMap: Array(15).fill(Array(15).fill(false)),
//   highlightCorrect: false,
// };