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

    // 1: Implement useLocation import if not present
    if (!content.includes('useLocation')) {
        content = content.replace(/import { useNavigate } from 'react-router-dom';/, "import { useNavigate, useLocation } from 'react-router-dom';");
    }

    // 2: Instantiate location hook
    if (!content.includes('const location = useLocation();')) {
        content = content.replace(/const navigate = useNavigate\(\);/, "const navigate = useNavigate();\n    const location = useLocation();");
    }

    // 3: Skip fetchChartList if preload state exists
    if (!content.includes('if (location.state?.chartData) return;')) {
        content = content.replace(/const fetchChartList = \(\) => {/, "const fetchChartList = () => {\n        if (location.state?.chartData) return;");
    }

    // 4: Modify useEffect return condition
    const originalCondPattern = /if \(!selectedChart \|\| booksDB.length === 0 \|\| chaptersDB.length === 0\) \{/g;
    content = content.replace(originalCondPattern, "const preloadData = location.state?.chartData;\n        if ((!preloadData && !selectedChart) || booksDB.length === 0 || chaptersDB.length === 0) {");

    // 5: Modify Axios get into a generic promise
    const axiosPattern = /const \{ module, facet, phase \} = selectedChart;\s*axios\.get\(`http:\/\/localhost:8000\/api\/charts\/sync\/\$\{module\}\/\$\{facet\}\/\$\{phase\}`.*?\)\s*\.then\(res => \{/g;

    // Some charts might not perfectly match the destructuring format, so we match carefully:
    if (content.match(axiosPattern)) {
        content = content.replace(axiosPattern,
            `const fetchPromise = preloadData 
            ? Promise.resolve({ data: preloadData })
            : axios.get(\`http://localhost:8000/api/charts/sync/\${selectedChart.module}/\${selectedChart.facet}/\${selectedChart.phase}\`, { withCredentials: true });

        fetchPromise.then(res => {`
        );
    } else {
        // Fallback for TwentyFourSeven variants which might not use exact destructuring
        const fallbackPattern = /axios\.get\(`http:\/\/localhost:8000\/api\/charts\/sync\/\$\{.*?\}\`.*?\)\s*\.then\(res => \{/g;
        if (content.match(fallbackPattern)) {
            content = content.replace(fallbackPattern,
                `const fetchPromise = preloadData 
            ? Promise.resolve({ data: preloadData })
            : axios.get(\`http://localhost:8000/api/charts/sync/\${selectedChart.module}/\${selectedChart.facet}/\${selectedChart.phase}\`, { withCredentials: true });

        fetchPromise.then(res => {`
            );
            // Must also remove the `const { module, facet, phase } = selectedChart;` if it existed before it
            content = content.replace(/const \{ module, facet, phase \} = selectedChart;/g, '');
        }
    }

    // 6: Add dependency for location.state
    content = content.replace(/}, \[selectedChart, booksDB, chaptersDB\]\);/g, "}, [selectedChart, booksDB, chaptersDB, location.state]);");

    // 7: Hide Dropdown if preloadState exists
    const selectChartHeaderPattern = /<div className="flex items-center gap-3 bg-white p\.1\.5 px-3 rounded-lg shadow-inner w-full md:w-auto overflow-x-auto">/g;

    // We search for `<div className="flex flex-col items-center xl:items-end flex-wrap justify-center xl:justify-end gap-2 w-full xl:w-auto">`
    // And inject `{!(location.state?.chartData) && (`
    const startDiv = /<div className="flex flex-col items-center xl:items-end flex-wrap justify-center xl:justify-end gap-2 w-full xl:w-auto">/g;
    if (content.match(startDiv) && !content.includes('{!(location.state?.chartData) && (')) {
        content = content.replace(startDiv, `<div className="flex flex-col items-center xl:items-end flex-wrap justify-center xl:justify-end gap-2 w-full xl:w-auto">\n                        {!(location.state?.chartData) && (`);

        // Find `onChange={(e) => setSelectedChart(e.value)} />` then the closing `</div>` and add `)}`
        // Also modify `{selectedChart && (` to `{(location.state?.chartData || selectedChart) && (`
        const closeDivPattern = / onChange=\{\(e\) => setSelectedChart\(e\.value\)\} \s*\/\>\s*<\/div>/g;
        content = content.replace(closeDivPattern, ' onChange={(e) => setSelectedChart(e.value)} \n                            />\n                        </div>\n                        )}');

        const selectedChartBtnPattern = /\{selectedChart && \(/g;
        content = content.replace(selectedChartBtnPattern, '{(location.state?.chartData || selectedChart) && (');
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated successfully: ${fileName}`);
}

console.log('All charts updated.');
