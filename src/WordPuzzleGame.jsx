import React, { useState, useEffect, useRef } from "react";
import wordLevels from "./word_levels.json";
import clickSound from "./sounds/click.mp3";
import correctSound from "./sounds/correct.mp3";
import wrongSound from "./sounds/wrong.mp3";

const MAX_HEARTS = 5;
const HEART_REGEN_TIME = 300; // 5 minutes
const MAX_HINTS_PER_LEVEL = 3;

export default function WordPuzzleGame() {
  const [level, setLevel] = useState(Number(localStorage.getItem("level")) || 0);
  const [coins, setCoins] = useState(Number(localStorage.getItem("coins")) || 0);
  const [hearts, setHearts] = useState(Number(localStorage.getItem("hearts")) || MAX_HEARTS);
  const [puzzleWord, setPuzzleWord] = useState("");
  const [shuffled, setShuffled] = useState([]);
  const [userGuess, setUserGuess] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [topTime, setTopTime] = useState(Number(localStorage.getItem("topTime")) || null);
  const [usedHints, setUsedHints] = useState(JSON.parse(localStorage.getItem("usedHints")) || {});
  const [hintsUsedCount, setHintsUsedCount] = useState((usedHints[level]?.count) || 0);
  const [heartRegenSeconds, setHeartRegenSeconds] = useState(Number(localStorage.getItem("heartRegenSeconds")) || 0);
  const lastHeartUsedAtRef = useRef(Number(localStorage.getItem("lastHeartUsedAt")) || null);
  const [randomHintIndex, setRandomHintIndex] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const [showPopup, setShowPopup] = useState(true); // modal control

  // Sounds
  const click = useRef(new Audio(clickSound)).current;
  const correct = useRef(new Audio(correctSound)).current;
  const wrong = useRef(new Audio(wrongSound)).current;
  const getShuffledWord = (word) => {
  let shuffled = shuffleArray(word.split(""));

  // Keep reshuffling if:
  // - It matches original
  // - OR more than 2 letters are in original positions
  while (
    shuffled.join("") === word ||
    shuffled.filter((ch, i) => ch === word[i]).length > 2
  ) {
    shuffled = shuffleArray(word.split(""));
  }

  return shuffled;
  };
  const shuffleArray = (arr) => arr.slice().sort(() => Math.random() - 0.5);

  const pickRandomWord = () => {
    const words = wordLevels[level] || ["error"];
    const randomIndex = Math.floor(Math.random() * words.length);
    
    return words[randomIndex];
  };

  // Setup new puzzle word
  useEffect(() => {
    const word = pickRandomWord();
    setPuzzleWord(word);
    setShuffled(getShuffledWord(word));
    setUserGuess([]);
    setStartTime(Date.now());
    setHintsUsedCount(usedHints[level]?.count || 0);
    setFadeIn(true);
    if (word.length > 3) {
      setRandomHintIndex(Math.floor(Math.random() * (word.length - 2)) + 1);
    } else {
      setRandomHintIndex(1);
    }
  }, [level]);

  // Save state in localStorage
  useEffect(() => {
    localStorage.setItem("level", level);
    localStorage.setItem("coins", coins);
    localStorage.setItem("hearts", hearts);
    localStorage.setItem("usedHints", JSON.stringify(usedHints));
    localStorage.setItem("heartRegenSeconds", heartRegenSeconds);
    if (lastHeartUsedAtRef.current) localStorage.setItem("lastHeartUsedAt", lastHeartUsedAtRef.current);
  }, [level, coins, hearts, usedHints, heartRegenSeconds]);

  useEffect(() => {
  const timeout = setTimeout(() => setFadeIn(false), 1000); // remove fade-in after 1 second
  return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
  const wordList = wordLevels[level];
  const word = wordList ? wordList[Math.floor(Math.random() * wordList.length)] : "ERROR";
  setPuzzleWord(word);
  setShuffled(getShuffledWord(word)); // This ensures it's always jumbled
  setUserGuess([]);
  setStartTime(Date.now());
  setHintsUsedCount((usedHints[level] && usedHints[level].count) || 0);
  setFadeIn(true);

  if (word.length > 3) {
    const randIndex = Math.floor(Math.random() * (word.length - 2)) + 1;
    setRandomHintIndex(randIndex);
  } else {
    setRandomHintIndex(1);
  }
  }, [level]);
 
  // Heart regeneration timer
  useEffect(() => {
    if (hearts >= MAX_HEARTS) {
      setHeartRegenSeconds(0);
      lastHeartUsedAtRef.current = null;
      localStorage.removeItem("lastHeartUsedAt");
      return;
    }

    const now = Date.now();
    if (!lastHeartUsedAtRef.current) {
      lastHeartUsedAtRef.current = now;
      setHeartRegenSeconds(HEART_REGEN_TIME);
    } else {
      const elapsed = Math.floor((now - lastHeartUsedAtRef.current) / 1000);
      setHeartRegenSeconds(Math.max(HEART_REGEN_TIME - elapsed, 0));
    }

    const timer = setInterval(() => {
      setHeartRegenSeconds((sec) => {
        if (sec <= 1) {
          if (hearts < MAX_HEARTS) {
            setHearts((h) => h + 1);
            lastHeartUsedAtRef.current = Date.now();
            return HEART_REGEN_TIME;
          } else {
            return 0;
          }
        }
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hearts]);

  // Handle letter click, disabled if no hearts
  const handleLetterClick = (letter, index) => {
    if (hearts === 0) return; // Block input
    setUserGuess([...userGuess, letter]);
    setShuffled(shuffled.filter((_, i) => i !== index));
  };

  // Undo last letter
  const handleUndo = () => {
    if (!userGuess.length) return;
    click.play();
    const last = userGuess[userGuess.length - 1];
    setUserGuess(userGuess.slice(0, -1));
    setShuffled([...shuffled, last]);
  };

  // Check answer with random new word on fail
  const checkAnswer = () => {
  // 🔔 Show alert if user has not selected full word
  if (userGuess.length < puzzleWord.length) {
    alert(`❗ You selected only ${userGuess.length} letters. Please select all ${puzzleWord.length} letters before submitting.`);
    return;
  }

  if (userGuess.join("") === puzzleWord) {
    correct.play();
    const finish = Date.now();
    const time = Math.floor((finish - startTime) / 1000);
    if (!topTime || time < topTime) {
      setTopTime(time);
      localStorage.setItem("topTime", time);
    }
    setCoins(coins + 100);
    setLevel(level + 1);
  } else {
    wrong.play();
    if (hearts <= 1) {
      setHearts(0);
      lastHeartUsedAtRef.current = Date.now();
    } else {
      setHearts(hearts - 1);
      lastHeartUsedAtRef.current = Date.now();
    }

    // Pick new random word from current level on fail
    const newWord = pickRandomWord();
    setPuzzleWord(newWord);
    setShuffled(shuffleArray(newWord.split("")));
    setUserGuess([]);
  }
};


  // Buy heart
  const buyHeart = () => {
    if (coins >= 100 && hearts < MAX_HEARTS) {
      click.play();
      setCoins(coins - 100);
      setHearts(hearts + 1);
      lastHeartUsedAtRef.current = Date.now();
      setHeartRegenSeconds(HEART_REGEN_TIME);
    }
  };

  // Buy hint
  const buyHint = () => {
    if (coins >= 100 && hintsUsedCount < MAX_HINTS_PER_LEVEL) {
      click.play();
      const newCount = hintsUsedCount + 1;
      setHintsUsedCount(newCount);
      setCoins(coins - 100);
      setUsedHints((prev) => ({
        ...prev,
        [level]: { count: newCount },
      }));
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`game-container ${fadeIn ? "fade-in" : ""}`}>
      <h1 className="game-title">🔤 Word Jumble</h1>

      <div className="info-bar">
        <span>Level {level + 1}</span>
        <span>❤️ {hearts}/{MAX_HEARTS}</span>
        <span>💰 {coins}</span>
      </div>

      {topTime !== null && <div className="fastest-time">⏱ Fastest: {topTime}s</div>}

      <div className="guess-container">
        {userGuess.map((l, i) => (
          <span key={i} className="guess-letter">{l}</span>
        ))}
      </div>
      

      {showPopup && (
  <div className="popup-overlay">
    <div className="popup-box">
      <h2>🚧 Site Under Development</h2>
      <p>This game is currently in development. Some features may change or be unstable.</p>
      <p>~shaik arshad hussain</p>
      <button onClick={() => setShowPopup(false)} className="popup-button">Okay, Continue</button>
    </div>
  </div>
  )}
  
  


      <div className="shuffled-letters">
        {shuffled.map((l, i) => (
          <button
            key={i}
            className="letter-button"
            onClick={() => handleLetterClick(l, i)}
            disabled={hearts === 0}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="control-buttons">
        <button onClick={checkAnswer} className="control-button" disabled={hearts === 0}>Submit</button>
        <button onClick={handleUndo} className="control-button">Undo</button>
        <button onClick={buyHint} className="control-button" disabled={coins < 100 || hintsUsedCount >= MAX_HINTS_PER_LEVEL}>
          Hint ({hintsUsedCount}/{MAX_HINTS_PER_LEVEL}) - 100💰
        </button>
        <button onClick={buyHeart} className="control-button" disabled={coins < 100 || hearts >= MAX_HEARTS}>
          Buy Heart - 100💰
        </button>
      </div>

      {hintsUsedCount > 0 && (
        <div className="hint-text">
          <strong>Hint:</strong>
          {hintsUsedCount >= 1 && <span> First letter is <b>{puzzleWord[0]}</b></span>}
          {hintsUsedCount >= 2 && randomHintIndex !== null && (
            <span>, letter at position {randomHintIndex + 1} is <b>{puzzleWord[randomHintIndex]}</b></span>
          )}
          {hintsUsedCount >= 3 && <span>, last letter is <b>{puzzleWord[puzzleWord.length - 1]}</b></span>}
        </div>
      )}

      {hearts < MAX_HEARTS && (
        <div className="hint-text" style={{ fontSize: "0.95rem" }}>
          Hearts regenerate in: {formatTime(heartRegenSeconds)}
        </div>
      )}

      {hearts === 0 && (
        <div className="no-hearts-warning" style={{ color: "red", fontWeight: "bold", marginTop: "10px" }}>
          💔 No hearts left. Please wait for refill.
        </div>
      )}
    </div>
  );
}
