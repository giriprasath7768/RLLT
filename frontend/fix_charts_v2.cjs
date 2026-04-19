const fs = require('fs');
const path = require('path');

const targetFiles = [
    'MainChartView.jsx',
    'MorningEveningChart.jsx',
    'DLSizeChart.jsx',
    'CChart.jsx',
    'OilChart.jsx',
    'WeeklyChart.jsx',
    'TwentyFourSevenChartView.jsx',
    'TwentyFourSevenMorningEveningChart.jsx',
    'TwentyFourSevenDLSizeChart.jsx',
];

const basePath = path.join(__dirname, 'src', 'pages', 'admin');

for (const fileName of targetFiles) {
    const filePath = path.join(basePath, fileName);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    // 1: Fix the undefined preloadData by utilizing a fresh variable __fixedPreload directly before use
    const undefPattern1 = /const fetchPromise = preloadData/g;
    const undefPattern2 = /\? Promise\.resolve\(\{ data: preloadData \}\)/g;

    if (content.match(undefPattern1)) {
        content = content.replace(undefPattern1, "const __fixedPreload = location.state?.chartData;\n        const fetchPromise = __fixedPreload");
        content = content.replace(undefPattern2, "? Promise.resolve({ data: __fixedPreload })");
    }

    // 2: Clean up the broken Action Buttons block
    // We will extract all the buttons we care about by regex
    const shareRx = /<Button icon="pi pi-share-alt"[^>]+onClick=\{handleShare\}[^>]*\/>/;
    const pencilRx = /<Button icon="pi pi-pencil"[^>]+onClick=\{handleEdit\}[^>]*\/>/;
    const trashRx = /<Button icon="pi pi-trash"[^>]+onClick=\{confirmDelete\}[^>]*\/>/;

    let mShare = content.match(shareRx);
    let mPencil = content.match(pencilRx);
    let mTrash = content.match(trashRx);

    if (mShare && mPencil && mTrash) {
        let strShare = mShare[0];
        let strPencil = mPencil[0];
        let strTrash = mTrash[0];

        // Remove them all entirely first to clean the file of duplicates/malformed wrappers
        content = content.replace(shareRx, "");
        content = content.replace(pencilRx, "");
        content = content.replace(trashRx, "");

        // Remove empty wrappers we might have left behind
        content = content.replace(/\{\!\(location\.state\?\.chartData\) && \(\s*<>\s*<\/>\s*\)\}/g, "");
        // Remove any floating empty <> </>
        content = content.replace(/<>\s*<\/>/g, "");

        // Now, find the print button and insert the proper wrapper right below it
        const printRx = /<Button icon="pi pi-print"[^>]+onClick=\{handlePrint\}[^>]*\/>/;
        const mPrint = content.match(printRx);

        if (mPrint) {
            const correctBlock = `${mPrint[0]}
                                {!(location.state?.chartData) && (
                                    <>
                                        ${strShare}
                                        ${strPencil}
                                        ${strTrash}
                                    </>
                                )}`;
            content = content.replace(printRx, correctBlock);
        }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated successfully: ${fileName}`);
}

console.log('All charts fixed v2.');
