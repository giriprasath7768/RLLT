const fs = require('fs');
async function run() {
    const str = fs.readFileSync('ids.txt', 'utf16le');
    const match = str.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\s*\|\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (!match) {
        console.error("No valid UUIDs found in ids.txt!");
        return;
    }
    const book_id = match[1];
    const chapter_id = match[2];

    const fd = new FormData();
    fd.append('book_id', book_id);
    fd.append('chapter_id', chapter_id);
    fd.append('ref_link', JSON.stringify(['https://example.com']));
    fd.append('existing_audios', JSON.stringify([{ url: '/api/uploads/fake.mp3', language: 'Tamil' }]));
    fd.append('existing_videos', JSON.stringify(['/api/uploads/fake_vid.mp4']));
    fd.append('existing_pdfs', JSON.stringify(['/api/uploads/fake_pdf.pdf']));

    try {
        console.log(`Posting to backend /sync with Book=${book_id}, Chapter=${chapter_id}...`);
        const res = await fetch("http://localhost:8000/api/contents/sync", {
            method: 'POST',
            body: fd
        });
        const text = await res.text();
        console.log("Status:", res.status, text);

        // Also verify the database physically updated
        const { execSync } = require('child_process');
        console.log("DB VERIFICATION:");
        console.log(execSync(`docker exec media_platform_db psql -U postgres -d media_platform -t -c "SELECT audio_url, video_url, pdf_url FROM contents WHERE chapter_id='${chapter_id}';"`).toString());
    } catch (err) {
        console.error("Fetch failed:", err);
    }
}
run();
