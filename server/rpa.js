const puppeteer = require('puppeteer');
const { verifyScreenshotWithAI } = require('./gemini');

/**
 * Runs the RPA agent to verify a government complaint ID.
 * Navigates to our mock portal for the demo, takes a screenshot,
 * and uses Gemini Vision to confirm the status.
 */
async function verifyGrievance(complaintId) {
  let browser = null;
  try {
    console.log(`[RPA Agent] Starting verification for Ticket ID: ${complaintId}`);
    
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true, // Use new headless mode or true
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to our mock government tracking portal (runs on the same server)
    // In production, this would be e.g. https://pgportal.gov.in/Status
    const portalUrl = `http://localhost:${process.env.PORT || 3000}/mock-gov-portal?id=${encodeURIComponent(complaintId)}`;
    console.log(`[RPA Agent] Navigating to ${portalUrl}`);
    
    await page.goto(portalUrl, { waitUntil: 'networkidle0' });

    // Take screenshot
    console.log(`[RPA Agent] Taking screenshot of tracking results...`);
    const screenshotBuffer = await page.screenshot({ encoding: 'base64' });

    // Pass the screenshot to Gemini Vision
    console.log(`[RPA Agent] Handing off screenshot to Gemini Vision for analysis...`);
    const isVerified = await verifyScreenshotWithAI(screenshotBuffer, complaintId);

    console.log(`[RPA Agent] Vision AI Verification Result: ${isVerified ? 'VERIFIED ✅' : 'FAILED ❌'}`);
    
    return isVerified;
  } catch (error) {
    console.error('[RPA Agent] Error during verification:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { verifyGrievance };
