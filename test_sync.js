const fs = require('fs');
async function run() {
    const fd = new FormData();
    fd.append('book_id', 'a0f9a2e8-466d-472e-8488-84224c5bb20d'); // Random UUIDs
    fd.append('chapter_id', '5e1ee791-030f-48d6-95af-725916ca198d');
    fd.append('ref_link', JSON.stringify(['https://example.com']));
    fd.append('existing_audios', JSON.stringify([{ url: '/api/uploads/fake.mp3', language: 'Tamil' }]));
    fd.append('existing_videos', JSON.stringify(['/api/uploads/fake_vid.mp4']));
    fd.append('existing_pdfs', JSON.stringify(['/api/uploads/fake_pdf.pdf']));

    try {
        console.log("Posting to backend /sync...");
        const res = await fetch("http://localhost:8000/api/contents/sync", {
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
