// App.js
// Fully Functional Hebrew Gematria Calculator
// React + CSS only (No external UI library required)

import React, { useState, useMemo } from "react";
import "./App.css";

const hebrewLetters = [
    { letter: "א", name: "Aleph", value: 1, color: "red" },
    { letter: "ב", name: "Bet", value: 2, color: "orange" },
    { letter: "ג", name: "Gimel", value: 3, color: "yellow" },
    { letter: "ד", name: "Dalet", value: 4, color: "green" },
    { letter: "ה", name: "He", value: 5, color: "teal" },

    { letter: "ו", name: "Vav", value: 6, color: "blue" },
    { letter: "ז", name: "Zayin", value: 7, color: "blue" },
    { letter: "ח", name: "Chet", value: 8, color: "purple" },
    { letter: "ט", name: "Tet", value: 9, color: "pink" },
    { letter: "י", name: "Yod", value: 10, color: "magenta" },

    { letter: "כ", name: "Kaf", value: 20, color: "gold" },
    { letter: "ך", name: "Final Kaf", value: 20, color: "gold" },
    { letter: "ל", name: "Lamed", value: 30, color: "green" },
    { letter: "מ", name: "Mem", value: 40, color: "cyan" },
    { letter: "ם", name: "Final Mem", value: 40, color: "cyan" },

    { letter: "נ", name: "Nun", value: 50, color: "blue" },
    { letter: "ן", name: "Final Nun", value: 50, color: "blue" },
    { letter: "ס", name: "Samekh", value: 60, color: "purple" },
    { letter: "ע", name: "Ayin", value: 70, color: "pink" },
    { letter: "פ", name: "Pe", value: 80, color: "orange" },

    { letter: "ף", name: "Final Pe", value: 80, color: "orange" },
    { letter: "צ", name: "Tsadi", value: 90, color: "gold" },
    { letter: "ץ", name: "Final Tsadi", value: 90, color: "gold" },
    { letter: "ק", name: "Qof", value: 100, color: "green" },

    { letter: "ר", name: "Resh", value: 200, color: "teal" },
    { letter: "ש", name: "Shin", value: 300, color: "purple" },
    { letter: "ת", name: "Tav", value: 400, color: "indigo" },
];

const meanings = {
    1: "Unity",
    3: "Divine completeness",
    7: "Perfection",
    13: "Love",
    18: "Life",
    26: "Sacred Name",
    40: "Transformation",
    73: "Wisdom (Chokmah)",
};

function App() {
    const [input, setInput] = useState("");
    const [history, setHistory] = useState([]);

    const letterMap = useMemo(() => {
        const map = {};
        hebrewLetters.forEach((l) => {
            map[l.letter] = l;
        });
        return map;
    }, []);

    const breakdown = input
        .split("")
        .map((char) => letterMap[char])
        .filter(Boolean);

    const total = breakdown.reduce((sum, item) => sum + item.value, 0);

    const digitalRoot = (num) => {
        while (num > 9) {
            num = num
                .toString()
                .split("")
                .reduce((a, b) => a + Number(b), 0);
        }
        return num;
    };

    const reduced = digitalRoot(total);

    const handleLetterClick = (letter) => {
        setInput((prev) => prev + letter);
    };

    const handleClear = () => {
        setInput("");
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(
            `Word: ${input} | Total: ${total}`
        );
        alert("Copied to clipboard");
    };

    const handleSave = () => {
        const item = {
            word: input,
            total,
            time: new Date().toLocaleString(),
        };

        setHistory((prev) => [item, ...prev]);
    };

    const handleVoiceInput = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Speech Recognition not supported");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "he-IL";

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
    };

    return (
        <div className="app">
            <div className="header">
                <h1>Hebrew Gematria Calculator</h1>
            </div>

            <div className="container">
                {/* LEFT PANEL */}
                <div className="left-panel">
                    <h2>Hebrew Alphabet Table</h2>

                    <div className="letters-grid">
                        {hebrewLetters.map((item, index) => (
                            <div
                                key={index}
                                className={`letter-card ${item.color}`}
                                onClick={() => handleLetterClick(item.letter)}
                            >
                                <div className="letter">{item.letter}</div>

                                <div className="name">{item.name}</div>

                                <div className="value">{item.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="right-panel">
                    <div className="input-section">
                        <h2>Enter Hebrew Word or Phrase</h2>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="הכנס מילה"
                            dir="rtl"
                        />
                    </div>

                    {/* LETTER BREAKDOWN */}
                    <div className="breakdown-grid">
                        {breakdown.map((item, index) => (
                            <div
                                key={index}
                                className={`breakdown-card ${item.color}`}
                            >
                                <div className="letter">{item.letter}</div>

                                <div>{item.name}</div>

                                <div className="value">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* TOTAL */}
                    <div className="result-grid">
                        <div className="result-card">
                            <h3>Total Gematria Value</h3>
                            <div className="total">{total}</div>
                        </div>

                        <div className="result-card">
                            <h3>Calculation Breakdown</h3>

                            <div className="formula">
                                {breakdown.map((b) => b.value).join(" + ")}
                            </div>

                            <div className="equals">= {total}</div>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="button-row">
                        <button onClick={handleCopy}>Copy Result</button>

                        <button onClick={handleClear}>Clear</button>

                        <button onClick={handleVoiceInput}>Voice Input</button>

                        <button onClick={handleSave}>Save History</button>
                    </div>

                    {/* EXTRA INFO */}
                    <div className="info-grid">
                        <div className="info-card">
                            <h3>Reduced Value</h3>

                            <div className="reduced">
                                {reduced}
                            </div>
                        </div>

                        <div className="info-card">
                            <h3>Hebrew Word Information</h3>

                            <p>Letters: {breakdown.length}</p>

                            <p>Total Value: {total}</p>

                            <p>Reduced Value: {reduced}</p>
                        </div>

                        <div className="info-card">
                            <h3>Meaning</h3>

                            <p>{meanings[total] || "No meaning found"}</p>
                        </div>
                    </div>

                    {/* HISTORY */}
                    <div className="history-section">
                        <h2>History</h2>

                        {history.length === 0 && (
                            <p>No history available</p>
                        )}

                        {history.map((item, index) => (
                            <div className="history-item" key={index}>
                                <span>{item.word}</span>

                                <span>{item.total}</span>

                                <span>{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;