import React from 'react';
import ReactDOM from 'react-dom/client';
import WordPuzzleGame from './WordPuzzleGame'; // or App
import './style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WordPuzzleGame />
  </React.StrictMode>
);
<div id="incomplete-popup" className="popup-backdrop">
  <div className="popup-box">
    <h2>Incomplete Selection</h2>
    <p>Please select all letters before submitting.</p>
    <button onClick={() => document.getElementById("incomplete-popup").style.display = "none"}>
      OK
    </button>
  </div>
</div>

