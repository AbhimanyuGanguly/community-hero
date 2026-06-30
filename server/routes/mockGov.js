const express = require('express');
const router = express.Router();

// GET /mock-gov-portal - Serve the mock tracking page
router.get('/', (req, res) => {
  const { id } = req.query;
  
  let resultHtml = '';
  if (id) {
    // If an ID is provided, simulate a search result using a strict mock format
    const isValidFormat = /^(MCD|ND|PWD|DJB|DDA)-\d{4}-[A-Z0-9]{4,8}$/i.test(id.trim());
    
    const safeId = id.replace(/[<>]/g, '');
    
    if (isValidFormat) {
      resultHtml = `
        <div id="status-result" style="margin-top: 20px; padding: 15px; border: 1px solid #4ade80; background-color: #f0fdf4; border-radius: 8px;">
          <h3 style="color: #166534; margin-top: 0;">✅ Complaint Found</h3>
          <p><strong>Ticket Number:</strong> <span id="ticket-id">${safeId}</span></p>
          <p><strong>Status:</strong> <span id="ticket-status">Open / Under Investigation</span></p>
          <p><strong>Department:</strong> Municipal Authority</p>
        </div>
      `;
    } else {
      resultHtml = `
        <div id="status-result" style="margin-top: 20px; padding: 15px; border: 1px solid #f87171; background-color: #fef2f2; border-radius: 8px;">
          <h3 style="color: #991b1b; margin-top: 0;">❌ Complaint Not Found</h3>
          <p>No records match the provided Ticket Number: <strong>${safeId}</strong>.</p>
          <p style="font-size: 12px; color: #666;">(For this demo, use a valid format like MCD-2026-X8392)</p>
        </div>
      `;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Official Government Grievance Portal</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .header { background-color: #1e3a8a; color: white; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 40px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="text"] { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { background-color: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background-color: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>National Grievance Tracking Portal</h1>
        <p>Track the status of your municipal complaints</p>
      </div>
      <div class="container">
        <h2>Track Complaint Status</h2>
        <form method="GET" action="/mock-gov-portal">
          <div class="form-group">
            <label for="complaintId">Enter Complaint ID / Ticket Number</label>
            <input type="text" id="complaintId" name="id" placeholder="e.g. MCD-2026-X8392" value="${id || ''}" required>
          </div>
          <button type="submit" id="track-btn">Check Status</button>
        </form>
        ${resultHtml}
      </div>
    </body>
    </html>
  `;
  
  res.send(html);
});

module.exports = router;
