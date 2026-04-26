async function dump() {
    const res = await fetch('http://localhost:8000/api/contents/list');
    const data = await res.json();
    const audios = data.filter(c => c.audio_url);
    for (let c of audios.slice(0, 5)) {
        console.log(c.audio_url);
        console.log("LANG:", c.audio_language);
        console.log("---");
    }
}
dump();
