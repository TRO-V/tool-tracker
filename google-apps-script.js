/**
 * Tool Tracking System - Google Apps Script
 * 
 * Tools Sheet Columns:
 * Tool ID | Status | Borrowed By | Borrowed At | Last Borrowed By | Last Borrowed At
 * 
 * - Pre-populate Tool ID column with your tools
 * - When borrowed: fills Borrowed By + Borrowed At
 * - When returned: clears Borrowed By/At, copies to Last Borrowed By/At
 * - Logs sheet keeps full history
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
    const tools = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        tools.push({
          id: row[0],
          status: row[1] || 'Available',
          borrowedBy: row[2] || '',
          borrowedAt: row[3] ? formatDate(row[3]) : '',
          lastBorrowedBy: row[4] || '',
          lastBorrowedAt: row[5] ? formatDate(row[5]) : ''
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
  
  if (!toolsSheet) {
    toolsSheet = ss.insertSheet('Tools');
    toolsSheet.appendRow(['Tool ID', 'Status', 'Borrowed By', 'Borrowed At', 'Last Borrowed By', 'Last Borrowed At']);
    toolsSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  
  const data = toolsSheet.getDataRange().getValues();
  let toolRow = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === tool) {
      toolRow = i + 1;
      break;
    }
  }
  
  if (action === 'borrow') {
    if (toolRow > 0) {
      // Update existing: set status, borrowed by, borrowed at (only columns 2-4, preserve 5-6)
      toolsSheet.getRange(toolRow, 2, 1, 3).setValues([['Borrowed', person, new Date()]]);
    } else {
      // Tool not pre-registered, add it
      toolsSheet.appendRow([tool, 'Borrowed', person, new Date(), '', '']);
    }
  } else if (action === 'return') {
    if (toolRow > 0) {
      // Get current borrow info to save as "last borrowed"
      const currentBorrowedBy = data[toolRow - 1][2] || person;
      const currentBorrowedAt = data[toolRow - 1][3] || new Date();
      
      // Set status to Available, clear borrowed by/at (columns 2-4)
      toolsSheet.getRange(toolRow, 2, 1, 3).setValues([['Available', '', '']]);
      // Set last borrowed info (columns 5-6)
      toolsSheet.getRange(toolRow, 5, 1, 2).setValues([[currentBorrowedBy, currentBorrowedAt]]);
    } else {
      // Tool not found, add as available
      toolsSheet.appendRow([tool, 'Available', '', '', person, new Date()]);
    }
  }
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
