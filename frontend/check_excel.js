const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

try {
    const filePath = path.join(__dirname, '../sampledata/Bookmaster.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log("--- Bookmaster.xlsx Headers ---");
    console.log(data[0]);
    console.log("\n--- First Row Data ---");
    console.log(data[1]);
} catch (error) {
    console.error("Error reading file:", error.message);
}
