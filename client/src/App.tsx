import React, { useState } from 'react';
import './App.css';

import { Nonogram } from './nonograms/Nonogram';
// import { NonogramContext } from './nonograms/NonogramContext';
import { transposeArray } from './helpers/array';

function App() {
  const [nonogram, setNonogram] = useState(
    [
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    ].map((col) => col.map((box) => !!box))
  );

  return (
    <div className="App">
      {/* <NonogramContext.Provider value={{
        nonogram, setNonogram,
        solveAutomatically: true, setSolveAutomatically: () => {},
        highlightCorrect: true, setHighlightCorrect: () => {},
        showSolution: true, setShowSolution: () => {},
      }}> */}
        <header className="App-header">
        </header>
        <Nonogram
          width={15}
          height={15}
          imageMap={transposeArray(nonogram)}
          highlightCorrect={true}
          showSolution={true}
          solveAutomatically={true}
        />
      {/* </NonogramContext.Provider>   */}
    </div>
  );
}

export default App;
