const fs = require('fs');
async function run() {
    const fd = new FormData();
    const blob = new Blob(["test"], { type: "audio/mpeg" });
    fd.append('file', blob, "test.mp3");

    try {
        console.log("Posting to backend...");
        const res = await fetch("http://localhost:8000/api/contents/upload", {
            method: 'POST',
            body: fd
        });
        const text = await res.text();
        console.log("Status:", res.status, text);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}
run();
