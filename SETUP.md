# Tool Tracking System - Setup Guide

## Overview
A simple QR code-based tool tracking system using Google Sheets as the backend.

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "Tool Tracker" (or any name you prefer)
3. Create two sheets (tabs at bottom):

### Sheet 1: "Tools"
| Tool ID | Status | Borrowed By | Borrowed At |
|---------|--------|-------------|-------------|
| TOOL-001 | Available | | |
| TOOL-002 | Available | | |

### Sheet 2: "Logs"
| Timestamp | Tool ID | Person | Action |
|-----------|---------|--------|--------|

> Note: The system will auto-create these sheets if they don't exist, but creating them manually gives you more control.

## Step 2: Set Up Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code in the editor
3. Copy the entire contents of `google-apps-script.js` and paste it
4. Click **Save** (disk icon) and name the project "Tool Tracker"

## Step 3: Deploy as Web App

1. In Apps Script, click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "Tool Tracker API"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
   - Choose your Google account
   - Click "Advanced" → "Go to Tool Tracker (unsafe)"
   - Click "Allow"
6. **Copy the Web App URL** - you'll need this!

> The URL looks like: `https://script.google.com/macros/s/ABC123.../exec`

## Step 4: Configure HTML Files

1. Open `index.html` and find this line:
   ```javascript
   const WEBHOOK_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
   Replace with your Web App URL.

2. Open `admin.html` and find this line:
   ```javascript
   const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
   Replace with the same Web App URL.

> Note: This is safe because Google Apps Script URLs are not secret API keys - they're public endpoints with their own access controls.

## Step 5: Host the HTML Files

### Option A: GitHub Pages (Recommended)
1. Create a new GitHub repository
2. Upload `index.html` and `admin.html`
3. Go to **Settings → Pages**
4. Set Source to "main" branch
5. Your URLs will be:
   - `https://yourusername.github.io/repo-name/index.html?tool=TOOL-001`
   - `https://yourusername.github.io/repo-name/admin.html`

### Option B: Local/Network Server
```bash
# Python 3
python -m http.server 8000

# Then access at http://localhost:8000/index.html?tool=TOOL-001
```

### Option C: Any Web Hosting
Upload both HTML files to any web hosting service (Netlify, Vercel, etc.)

## Step 6: Generate QR Codes

For each tool, create a QR code pointing to:
```
https://your-host.com/index.html?tool=TOOL-001
```

### QR Code Generators:
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QRCode Monkey](https://www.qrcode-monkey.com/)
- Bulk generation: [QR Code Generator Pro](https://www.qrcode-generator.de/)

### Tips:
- Print QR codes on durable labels
- Include the Tool ID as text below the QR code
- Laminate for durability

## Usage

### For Users (Scanning QR Code)
1. Scan the QR code on a tool
2. First time: Enter your name (saved for future use)
3. Tap "Borrow Tool" or "Return Tool"
4. Done!

### For Admins
1. Open `admin.html` in a browser
2. View all tools and their current status
3. Click "Refresh" to update

## Troubleshooting

### "Error: Could not connect to server"
- Check that the Web App URL is correct in `index.html`
- Ensure the Apps Script is deployed with "Anyone" access

### Admin page shows "Failed to load data"
- Check that the Web App URL is correct in `admin.html`
- Open browser console (F12) for detailed errors
- Verify the Google Sheet has a "Tools" sheet

### Changes not appearing
- Apps Script caches responses; wait a few seconds
- For code changes, create a **New deployment** (not just save)

## Customization

### Add More Tool Info
Edit the Tools sheet to add columns like:
- Description
- Location
- Category

Then update `admin.html` table to display them.

### Change Styling
Edit the `<style>` section in either HTML file to match your branding.

### Add Tool Pre-registration
Add tools to the "Tools" sheet manually before anyone borrows them.
