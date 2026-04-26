const fs = require('fs');

async function testFetch() {
    const formData = new FormData();
    formData.append('book_id', '6b1d2a96-070c-4a00-b6fe-efcc1a9230f5');
    formData.append('chapter_id', '3054a7b8-4bc4-4034-81c2-cf2914ace358');
    formData.append('audio_languages', JSON.stringify(['Lang1', 'Lang2']));
    formData.append('existing_audios', '[]');

    const blob1 = new Blob(["file1data"], { type: "audio/mpeg" });
    const blob2 = new Blob(["file2data"], { type: "audio/mpeg" });

    formData.append('audios', blob1, 'file1.mp3');
    formData.append('audios', blob2, 'file2.mp3');

    try {
        const res = await fetch('http://localhost:8000/api/contents/sync', {
            method: 'POST',
            body: formData
        });
        const text = await res.text();
        console.log(res.status, text);
    } catch (e) {
        console.error(e);
    }
}

testFetch();
