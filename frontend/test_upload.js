const axios = require('axios');
const FormData = require('form-data');

async function testUpload() {
    const fd = new FormData();
    fd.append('file', Buffer.from("test audio content"), { filename: "test.mp3", contentType: "audio/mpeg" });

    try {
        const res = await axios.post('http://localhost:8000/api/contents/upload', fd, {
            headers: fd.getHeaders()
        });
        console.log("SUCCESS:", res.status, res.data);
    } catch (e) {
        console.log("FAILED WITH name=file:", e.response ? e.response.status : e.message);
        if (e.response) console.log(e.response.data);
    }
}
testUpload();
