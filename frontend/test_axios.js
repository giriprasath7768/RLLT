const axios = require('axios');
const FormData = require('form-data');

async function testAxios() {
    const formData = new FormData();
    formData.append('book_id', '6b1d2a96-070c-4a00-b6fe-efcc1a9230f5');
    formData.append('chapter_id', '3054a7b8-4bc4-4034-81c2-cf2914ace358');
    formData.append('audio_languages', JSON.stringify(['Tamil', 'English']));
    formData.append('existing_audios', '[]');

    formData.append('audios', Buffer.from("test1"), { filename: "test1.mp3", contentType: "audio/mpeg" });
    formData.append('audios', Buffer.from("test2"), { filename: "test2.mp3", contentType: "audio/mpeg" });

    try {
        const res = await axios.post('http://localhost:8000/api/contents/sync', formData, {
            headers: formData.getHeaders()
        });
        console.log(res.status, res.data);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
testAxios();
