const fs = require('fs');

try {
    let out = "";
    let fd1 = fs.openSync('i:\\RLLT\\Webapp\\frontend\\public\\blank-scroll.png', 'r');
    let buf1 = Buffer.alloc(8);
    fs.readSync(fd1, buf1, 0, 8, null);
    out += "blank-scroll: " + buf1.toString('hex') + "\n";
    fs.closeSync(fd1);

    let fd2 = fs.openSync('i:\\RLLT\\Webapp\\frontend\\public\\player-mockup.png', 'r');
    let buf2 = Buffer.alloc(8);
    fs.readSync(fd2, buf2, 0, 8, null);
    out += "player-mockup: " + buf2.toString('hex') + "\n";
    fs.closeSync(fd2);

    fs.writeFileSync('i:\\RLLT\\Webapp\\frontend\\check-utf8.txt', out, 'utf8');
} catch (e) { }
