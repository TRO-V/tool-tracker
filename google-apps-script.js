/**
 * Tool Tracking System - Google Apps Script
 * 
 * Each tool has its own sheet (EPJ_1, EPJ_2, etc.) with:
 * - Row 1: Headers
 * - Row 2: Current status
 * - Row 4+: Log history
 */

const TOOLS = ['EPJ_1', 'EPJ_2', 'EPJ_3', 'EPJ_4', 'EPJ_5'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { tool, person, action } = data;
    
    if (!tool || !person || !action) {
      return jsonResponse({ success: false, error: 'Missing required fields' });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let toolSheet = ss.getSheetByName(tool);
    
    // Create sheet if it doesn't exist
    if (!toolSheet) {
      toolSheet = ss.insertSheet(tool);
      setupToolSheet(toolSheet);
    }
    
    // Update status (row 2)
    if (action === 'borrow') {
      // Set borrowed info (columns 2-4), preserve last borrowed (columns 5-6)
      toolSheet.getRange(2, 2, 1, 3).setValues([['Borrowed', person, new Date()]]);
    } else if (action === 'return') {
      // Get current borrow info to save as last borrowed
      const currentData = toolSheet.getRange(2, 3, 1, 2).getValues()[0];
      const lastBorrowedBy = currentData[0] || person;
      const lastBorrowedAt = currentData[1] || new Date();
      
      // Clear current borrow, set last borrowed
      toolSheet.getRange(2, 2, 1, 5).setValues([['Available', '', '', lastBorrowedBy, lastBorrowedAt]]);
    }
    
    // Add to log history
    const lastRow = Math.max(toolSheet.getLastRow(), 4);
    toolSheet.getRange(lastRow + 1, 1, 1, 4).setValues([[new Date(), person, action, '']]);
    
    return jsonResponse({ success: true, message: `Tool ${action}ed successfully` });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doGet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tools = [];

    for (const toolId of TOOLS) {
      let toolSheet = ss.getSheetByName(toolId);
      
      if (!toolSheet) {
        // Create sheet if missing
        toolSheet = ss.insertSheet(toolId);
        setupToolSheet(toolSheet);
      }
      
      const statusRow = toolSheet.getRange(2, 1, 1, 6).getValues()[0];
      
      // Get recent logs (rows 5 onwards)
      const lastRow = toolSheet.getLastRow();
      let logs = [];
      if (lastRow >= 5) {
        const logData = toolSheet.getRange(5, 1, lastRow - 4, 3).getValues();
        logs = logData.map(row => ({
          timestamp: row[0] ? formatDate(row[0]) : '',
          person: row[1] || '',
          action: row[2] || ''
        })).reverse().slice(0, 10); // Last 10 logs
      }
      
      tools.push({
        id: toolId,
        status: statusRow[1] || 'Available',
        borrowedBy: statusRow[2] || '',
        borrowedAt: statusRow[3] ? formatDate(statusRow[3]) : '',
        lastBorrowedBy: statusRow[4] || '',
        lastBorrowedAt: statusRow[5] ? formatDate(statusRow[5]) : '',
        logs: logs
      });
    }
    
    return jsonResponse({ tools: tools });
  } catch (error) {
    return jsonResponse({ tools: [], error: error.toString() });
  }
}

function setupToolSheet(sheet) {
  // Status section - 6 columns now
  sheet.getRange(1, 1, 1, 6).setValues([['Tool ID', 'Status', 'Borrowed By', 'Borrowed At', 'Last Borrowed By', 'Last Borrowed At']]);
  sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f0f0f0');
  sheet.getRange(2, 1, 1, 6).setValues([[sheet.getName(), 'Available', '', '', '', '']]);
  
  // Log section header
  sheet.getRange(4, 1, 1, 3).setValues([['Timestamp', 'Person', 'Action']]);
  sheet.getRange(4, 1, 1, 3).setFontWeight('bold').setBackground('#e0e0e0');
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
