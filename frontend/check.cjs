const fs = require('fs');

function checkFile(path) {
    try {
        const fd = fs.openSync(path, 'r');
        const buffer = Buffer.alloc(8);
        fs.readSync(fd, buffer, 0, 8, null);
        fs.closeSync(fd);
        console.log(path, "Magic Bytes:", buffer.toString('hex'));
    } catch (e) {
        console.error(path, "Error:", e.message);
    }
}

checkFile('i:\\RLLT\\Webapp\\frontend\\public\\blank-scroll.png');
checkFile('i:\\RLLT\\Webapp\\frontend\\public\\player-mockup.png');
