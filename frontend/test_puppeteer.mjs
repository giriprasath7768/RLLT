import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.error('PAGE ERROR TRIGGERED:', err.message, err.stack));
  page.on('console', msg => {
      if(msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  await page.goto('http://localhost/login');
  await page.type('input[type="email"]', 'admin@example.com');
  await page.type('input[type="password"]', 'adminpassword');
  await Promise.all([
    page.waitForNavigation(),
    page.click('button')
  ]);
  
  console.log("Logged in successfully, navigating to manage-admin");
  await page.goto('http://localhost/admin/manage-admin');
  console.log("Navigated. Waiting for errors...");
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
