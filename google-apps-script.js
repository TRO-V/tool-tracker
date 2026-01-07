/**
 * Tool Tracking System - Google Apps Script
 * 
 * Paste this code into Google Apps Script (script.google.com)
 * See SETUP.md for detailed instructions
 */

// Handle POST requests (borrow/return actions)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { tool, person, action } = data;
    
    if (!tool || !person || !action) {
      return jsonResponse({ success: false, error: 'Missing required fields' });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Log the action
    logAction(ss, tool, person, action);
    
    // Update tool status
    updateToolStatus(ss, tool, person, action);
    
    return jsonResponse({ success: true, message: `Tool ${action}ed successfully` });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// Handle GET requests (fetch tool status)
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const toolsSheet = ss.getSheetByName('Tools');
    
    if (!toolsSheet) {
      return jsonResponse({ tools: [], error: 'Tools sheet not found' });
    }
    
    const data = toolsSheet.getDataRange().getValues();
    const headers = data[0];
    const tools = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // Has tool ID
        tools.push({
          id: row[0],
          status: row[1] || 'Available',
          borrowedBy: row[2] || '',
          borrowedAt: row[3] ? formatDate(row[3]) : ''
        });
      }
    }
    
    return jsonResponse({ tools: tools });
  } catch (error) {
    return jsonResponse({ tools: [], error: error.toString() });
  }
}

// Log action to Logs sheet
function logAction(ss, tool, person, action) {
  let logsSheet = ss.getSheetByName('Logs');
  
  // Create Logs sheet if it doesn't exist
  if (!logsSheet) {
    logsSheet = ss.insertSheet('Logs');
    logsSheet.appendRow(['Timestamp', 'Tool ID', 'Person', 'Action']);
    logsSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  
  logsSheet.appendRow([new Date(), tool, person, action]);
}

// Update tool status in Tools sheet
function updateToolStatus(ss, tool, person, action) {
  let toolsSheet = ss.getSheetByName('Tools');
  
  // Create Tools sheet if it doesn't exist
  if (!toolsSheet) {
    toolsSheet = ss.insertSheet('Tools');
    toolsSheet.appendRow(['Tool ID', 'Status', 'Borrowed By', 'Borrowed At']);
    toolsSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  
  const data = toolsSheet.getDataRange().getValues();
  let toolRow = -1;
  
  // Find existing tool row
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tool) {
      toolRow = i + 1; // 1-indexed for Sheets
      break;
    }
  }
  
  if (action === 'borrow') {
    if (toolRow > 0) {
      // Update existing row
      toolsSheet.getRange(toolRow, 2, 1, 3).setValues([['Borrowed', person, new Date()]]);
    } else {
      // Add new tool
      toolsSheet.appendRow([tool, 'Borrowed', person, new Date()]);
    }
  } else if (action === 'return') {
    if (toolRow > 0) {
      // Update existing row
      toolsSheet.getRange(toolRow, 2, 1, 3).setValues([['Available', '', '']]);
    } else {
      // Add new tool as available
      toolsSheet.appendRow([tool, 'Available', '', '']);
    }
  }
}

// Format date for display
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'MMM dd, yyyy HH:mm');
}

// Return JSON response with CORS headers
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
