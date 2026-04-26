const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    try {
        console.log("Navigating to login...");
        await page.goto('http://localhost:80/login', { waitUntil: 'networkidle2' });

        console.log("Current URL:", page.url());

        // Fill login
        await page.waitForSelector('input[type="email"]');
        await page.type('input[type="email"]', 'admin@example.com');
        await page.type('input[type="password"]', 'adminpassword');
        await page.click('button[type="submit"]');

        console.log("Submitted login. Waiting for navigation...");
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log("Logged in. URL is now:", page.url());

        console.log("Navigating to student report...");
        await page.goto('http://localhost:80/admin/reports/student-report', { waitUntil: 'networkidle2' });
        console.log("Arrived. Taking screenshot...");

        // Wait explicitly for the specific UI elements
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'report_screenshot.png', fullPage: true });

        // Validate if the images are broken
        const isImageBroken = await page.evaluate(() => {
            const img = document.querySelector('img[alt="Blank Scroll"]');
            if (!img) return "not-found";
            return (img.naturalWidth === 0) ? "broken" : `loaded (${img.naturalWidth}x${img.naturalHeight})`;
        });

        console.log("Image status:", isImageBroken);
        console.log("DONE");

    } catch (e) {
        console.error("Error during puppeteer test:", e);
    } finally {
        await browser.close();
    }
})();
