import React from 'react';
import ReactDOM from 'react-dom/client';
import WordPuzzleGame from './WordPuzzleGame'; // or App
import './style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WordPuzzleGame />
  </React.StrictMode>
);

