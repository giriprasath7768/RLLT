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
        console.log(`Skipping ${fileName}`);
        continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    if (!content.includes('const module = selectedChart?.module')) {
        content = content.replace(/const data = res\.data;/g,
            `const data = res.data;\n            const module = selectedChart?.module || location.state?.assignment?.module || '1';\n            const facet = selectedChart?.facet || location.state?.assignment?.facet || '1';\n            const phase = selectedChart?.phase || location.state?.assignment?.phase || '1';`
        );
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Fixed variables in ${fileName}`);
    } else {
        console.log(`Variables already present in ${fileName}`);
    }
}
