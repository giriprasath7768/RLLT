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

    // 1: Fix the early return suppressing booksDB/chaptersDB fetches
    content = content.replace(/if \(location\.state\?\.chartData\) return;\n/, "");

    // 2: Hide Share, Edit, and Delete action buttons if location.state.chartData is present
    const shareButtonStr = '<Button icon="pi pi-share-alt"';
    const pencilButtonStr = '<Button icon="pi pi-pencil"';
    const trashButtonStr = '<Button icon="pi pi-trash"';

    if (content.includes(shareButtonStr) && content.includes(pencilButtonStr) && content.includes(trashButtonStr) && !content.includes('{!(location.state?.chartData) && (\\n                                    <>')) {
        // We will just do a string replacement on the share button up to the trash button.
        // It's safer to enclose these 3 buttons in the condition:

        let shareButtonMatch = content.match(/<Button icon="pi pi-share-alt"[\s\S]*?\/>/);
        let pencilButtonMatch = content.match(/<Button icon="pi pi-pencil"[\s\S]*?\/>/);
        let trashButtonMatch = content.match(/<Button icon="pi pi-trash"[\s\S]*?\/>/);

        if (shareButtonMatch && pencilButtonMatch && trashButtonMatch) {
            let combinedReplacement = `{!(location.state?.chartData) && (
                                    <>
                                        ${shareButtonMatch[0]}
                                        ${pencilButtonMatch[0]}
                                        ${trashButtonMatch[0]}
                                    </>
                                )}`;

            // Replace the three buttons iteratively to avoid breaking format
            content = content.replace(shareButtonMatch[0], combinedReplacement);
            content = content.replace(pencilButtonMatch[0], '');
            content = content.replace(trashButtonMatch[0], '');
        }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated successfully: ${fileName}`);
}

console.log('All charts fixed.');
