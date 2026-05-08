// App.js
// Fully Functional Greek Gematria Calculator

import React, { useState, useMemo } from "react";
import "./App.css";

const greekLetters = [
    { upper: "Α", lower: "α", name: "Alpha", value: 1, color: "blue" },
    { upper: "Β", lower: "β", name: "Beta", value: 2, color: "blue" },
    { upper: "Γ", lower: "γ", name: "Gamma", value: 3, color: "blue" },
    { upper: "Δ", lower: "δ", name: "Delta", value: 4, color: "blue" },
    { upper: "Ε", lower: "ε", name: "Epsilon", value: 5, color: "teal" },
    { upper: "Ζ", lower: "ζ", name: "Zeta", value: 7, color: "teal" },

    { upper: "Η", lower: "η", name: "Eta", value: 8, color: "green" },
    { upper: "Θ", lower: "θ", name: "Theta", value: 9, color: "green" },
    { upper: "Ι", lower: "ι", name: "Iota", value: 10, color: "gold" },
    { upper: "Κ", lower: "κ", name: "Kappa", value: 20, color: "gold" },
    { upper: "Λ", lower: "λ", name: "Lambda", value: 30, color: "orange" },
    { upper: "Μ", lower: "μ", name: "Mu", value: 40, color: "orange" },

    { upper: "Ν", lower: "ν", name: "Nu", value: 50, color: "red" },
    { upper: "Ξ", lower: "ξ", name: "Xi", value: 60, color: "red" },
    { upper: "Ο", lower: "ο", name: "Omicron", value: 70, color: "pink" },
    { upper: "Π", lower: "π", name: "Pi", value: 80, color: "purple" },
    { upper: "Ρ", lower: "ρ", name: "Rho", value: 100, color: "purple" },
    { upper: "Σ", lower: "σ", alt: "ς", name: "Sigma", value: 200, color: "indigo" },

    { upper: "Τ", lower: "τ", name: "Tau", value: 300, color: "blue" },
    { upper: "Υ", lower: "υ", name: "Upsilon", value: 400, color: "blue" },
    { upper: "Φ", lower: "φ", name: "Phi", value: 500, color: "green" },
    { upper: "Χ", lower: "χ", name: "Chi", value: 600, color: "green" },
    { upper: "Ψ", lower: "ψ", name: "Psi", value: 700, color: "gold" },
    { upper: "Ω", lower: "ω", name: "Omega", value: 800, color: "gold" },
];

const popularExamples = [
    { word: "Ιησούς", meaning: "Jesus", value: 888 },
    { word: "χάρις", meaning: "Grace", value: 548 },
    { word: "εἰρήνη", meaning: "Peace", value: 373 },
];

function App() {
    const [input, setInput] = useState("λόγος");
    const [history, setHistory] = useState([]);

    const letterMap = useMemo(() => {
        const map = {};

        greekLetters.forEach((item) => {
            map[item.upper] = item;
            map[item.lower] = item;

            if (item.alt) {
                map[item.alt] = item;
            }
        });

        return map;
    }, []);

    const normalizeGreek = (text) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    const breakdown = input
        .split("")
        .map((char) => {
            const normalized = normalizeGreek(char);
            return letterMap[char] || letterMap[normalized];
        })
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
            `${input} = ${total}`
        );

        alert("Copied Successfully");
    };

    const handleSave = () => {
        const item = {
            word: input,
            value: total,
            time: new Date().toLocaleString(),
        };

        setHistory((prev) => [item, ...prev]);
    };

    const handleShare = async () => {
        const shareData = {
            title: "Greek Gematria Calculator",
            text: `${input} = ${total}`,
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            alert("Share not supported");
        }
    };

    const handleVoiceInput = () => {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice Recognition not supported");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "el-GR";

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;

            setInput(transcript);
        };
    };

    return (
        <div className="app">
            {/* HEADER */}
            <div className="header">
                <div>
                    <h1>Greek Gematria Calculator</h1>

                    <p>Greek Alphabet Numeric Values Calculator</p>
                </div>
            </div>

            <div className="main-layout">
                {/* LEFT PANEL */}
                <div className="left-panel">
                    <div className="panel-card">
                        <h2>Greek Alphabet Table</h2>

                        <div className="alphabet-grid">
                            {greekLetters.map((item, index) => (
                                <div
                                    key={index}
                                    className={`alphabet-card ${item.color}`}
                                    onClick={() =>
                                        handleLetterClick(item.lower)
                                    }
                                >
                                    <div className="symbol">
                                        {item.upper} {item.lower}
                                    </div>

                                    <div className="name">
                                        {item.name}
                                    </div>

                                    <div className="value">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel-card about-card">
                        <h2>About Greek Gematria</h2>

                        <p>
                            Greek Gematria is a system where letters
                            of the Greek alphabet are assigned
                            numeric values for spiritual, symbolic,
                            and analytical interpretation.
                        </p>
                    </div>

                    <div className="bottom-info">
                        <div className="panel-card small-card">
                            <h3>Reduced Value</h3>

                            <div className="reduced-value">
                                {reduced}
                            </div>
                        </div>

                        <div className="panel-card small-card">
                            <h3>Word Information</h3>

                            <p>Letters: {breakdown.length}</p>

                            <p>Total Value: {total}</p>

                            <p>Reduced Value: {reduced}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="right-panel">
                    <div className="panel-card">
                        <h2>Enter Greek Word or Phrase</h2>

                        <div className="input-row">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) =>
                                    setInput(e.target.value)
                                }
                                placeholder="λόγος"
                            />

                            <button className="calculate-btn">
                                Calculate
                            </button>
                        </div>

                        <div className="action-row">
                            <button onClick={handleCopy}>
                                Paste
                            </button>

                            <button onClick={handleClear}>
                                Clear
                            </button>

                            <select>
                                <option>Greek</option>
                            </select>
                        </div>
                    </div>

                    {/* LETTER BREAKDOWN */}
                    <div className="panel-card">
                        <h2>Letter Breakdown</h2>

                        <div className="breakdown-grid">
                            {breakdown.map((item, index) => (
                                <React.Fragment key={index}>
                                    <div
                                        className={`breakdown-card ${item.color}`}
                                    >
                                        <div className="symbol">
                                            {item.lower}
                                        </div>

                                        <div>{item.name}</div>

                                        <div className="value">
                                            {item.value}
                                        </div>
                                    </div>

                                    {index < breakdown.length - 1 && (
                                        <div className="plus">+</div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* RESULT SECTION */}
                    <div className="result-layout">
                        <div className="panel-card result-card">
                            <h2>Total Gematria Value</h2>

                            <div className="main-total">
                                {total}
                            </div>
                        </div>

                        <div className="panel-card result-card">
                            <h2>Calculation Breakdown</h2>

                            <div className="formula">
                                {breakdown
                                    .map((b) => b.value)
                                    .join(" + ")}
                            </div>

                            <div className="formula-total">
                                = {total}
                            </div>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="action-buttons">
                        <button onClick={handleCopy}>
                            Copy Result
                        </button>

                        <button onClick={handleSave}>
                            Save Result
                        </button>

                        <button onClick={handleVoiceInput}>
                            Voice Input
                        </button>

                        <button onClick={handleShare}>
                            Share
                        </button>
                    </div>

                    {/* BOTTOM SECTION */}
                    <div className="bottom-layout">
                        <div className="panel-card">
                            <h2>History</h2>

                            {history.length === 0 && (
                                <p>No history available</p>
                            )}

                            {history.map((item, index) => (
                                <div
                                    className="history-item"
                                    key={index}
                                >
                                    <span>{item.word}</span>

                                    <span>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="panel-card">
                            <h2>Popular Examples</h2>

                            {popularExamples.map(
                                (item, index) => (
                                    <div
                                        className="history-item"
                                        key={index}
                                    >
                                        <span>
                                            {item.word} ({item.meaning})
                                        </span>

                                        <span>{item.value}</span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;