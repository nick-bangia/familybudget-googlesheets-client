function onOpen(e) {
  
  if (IsAuthorized()) {
    createFullMenu();
  } else {
    createLoginOnlyMenu();
  }
  
}

function createLoginOnlyMenu() {
  
  var spreadsheetUI = SpreadsheetApp.getUi();
  // Add a normal menu item (works in all authorization modes)
  spreadsheetUI.createMenu('Family Budget')
    .addItem('Login', 'beginLogin')
    .addToUi();
}

function createFullMenu() {
  var spreadsheetUI = SpreadsheetApp.getUi();
  spreadsheetUI.createMenu('Family Budget')
    .addItem('Connect to Bank', 'showLink')
    .addSubMenu(spreadsheetUI.createMenu('Add New...')
                  .addItem('Line Items', 'addLineItems')
                  .addItem('Journal Entries', 'addJournalEntries'))
    .addSubMenu(spreadsheetUI.createMenu('Get...')
                  .addItem('Pending', 'getPendingItems'))
    .addItem('Search', 'getSearchForm')
    .addItem('Refresh', 'getLineItems')
    .addToUi();
}

function beginLogin() {
  var passwordPromptHtml = HtmlService.createHtmlOutputFromFile('PasswordPrompt')
      .setWidth(200)
      .setHeight(80);
  SpreadsheetApp.getUi()
   .showModalDialog(passwordPromptHtml, 'Enter your password:');
}

function showLink() {
  var linkHtml = HtmlService.createHtmlOutputFromFile('InitiateLink')
    .setWidth(400)
    .setHeight(560);
  SpreadsheetApp.getUi()
    .showModalDialog(linkHtml,'Connect to your bank');
}

function savePlaidPublicToken(public_token) {
  PropertiesService.getScriptProperties().setProperty("plaid_public_token", public_token);
}

function getLineItems() {
  var response = MakeAPICall("/lineItems/all", 'get');
  
  if (response) {
    var data = response.data;
    
    // get the data sheet to work on
    var dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DATA");
    
    // create an array of the data to be added to the sheet
    var dataRows = [];
  
    // add data from the response
    for (var i = 0; i < data.length; i++) {
      
      var dataRow = [
        data[i].year, 
        data[i].month, 
        data[i].month + "-" + data[i].year,
        data[i].day + "-" + data[i].month + "-" + data[i].year,
        "Q" + data[i].quarter + "-" + data[i].year,
        data[i].dayOfWeek,
        data[i].description,
        data[i].categoryName,
        data[i].subcategoryName,
        data[i].subcategoryPrefix + " - " + data[i].subcategoryName,
        data[i].amount,
        getLineItemTypeFromID(data[i].typeId),
        getFinancialTypeFromID(data[i].subtypeId),
        data[i].paymentMethodName,
        data[i].accountName,
        getStatusFromID(data[i].statusId),
        data[i].goalAmount,
        data[i].isTaxDeductible ? "Yes" : "No"
      ];
      
      dataRows.push(dataRow);
    }
    
    // if the rows to add are less than the current number of rows (due to deletions), remove the surplus rows
    //dataSheet.deleteRows(2, dataSheet.getLastRow() - 1);
    if (dataRows.length < ( dataSheet.getLastRow() - 1 )) {
      dataSheet.deleteRows(dataRows.length + 2, (( dataSheet.getLastRow() - 1 ) - dataRows.length ));
    }
    
    // get the range to update and apply the data to it
    var range = dataSheet.getRange(2,1,dataRows.length, 18);
    range.setValues(dataRows);
  }
}

function addLineItems() {
  var thisSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var templateSheet = thisSpreadsheet.getSheetByName("New Line Items Template");
  var newLineItemsSheet = thisSpreadsheet.insertSheet("New Line Items", {"template": templateSheet});
  
  addDataValidations(newLineItemsSheet);
}

function addJournalEntries() {
  var thisSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var templateSheet = thisSpreadsheet.getSheetByName("New Journal Entries Template");
  var newJournalEntriesSheet = thisSpreadsheet.insertSheet("Enter Journal Items", {"template": templateSheet});
  
  // add only the subcategory data validation to the to/from subcategory columns
  var subcategories = getSubcategoryArray();
  var fromSubcategoryCells = newJournalEntriesSheet.getRange("D2:D");
  var toSubcategoryCells = newJournalEntriesSheet.getRange("E2:E");
  var scRule = SpreadsheetApp.newDataValidation().requireValueInList(subcategories).setAllowInvalid(false).build();
  
  fromSubcategoryCells.setDataValidation(scRule);
  toSubcategoryCells.setDataValidation(scRule);
}

function getPendingItems() {
  
  var response = getPendingItemsFromAPI();
  
  if (response) {
    var thisSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var templateSheet = thisSpreadsheet.getSheetByName("Pending Line Items Template");
    var pendingLineItemsSheet = thisSpreadsheet.insertSheet("Pending Line Items", {"template": templateSheet});
  
    addDataValidations(pendingLineItemsSheet);
    
    var data = response.data;
    var dataRows = [];
    
    // add data from the response
    for (var i = 0; i < data.length; i++) {
      
      var dataRow = [
        "",
        data[i].key,
        new Date(data[i].year, data[i].monthId - 1, data[i].day), 
        data[i].description,
        data[i].subcategoryName,
        data[i].amount,
        data[i].isTaxDeductible ? "Yes" : "No",
        getLineItemTypeFromID(data[i].typeId),
        data[i].paymentMethodName,
        getStatusFromID(data[i].statusId)
      ];
    
      dataRows.push(dataRow);
    }
    
    var range = pendingLineItemsSheet.getRange(2,1,dataRows.length, 10);
    range.setValues(dataRows);
  }
}

function getSearchForm() {
  
  var thisSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var templateSheet = thisSpreadsheet.getSheetByName("Search Template");
  var searchForm = thisSpreadsheet.insertSheet("Search for Line Items", {"template": templateSheet});
  
  addSearchDataValidations(searchForm);
}

function search() {
  var searchForm = SpreadsheetApp.getActiveSheet();
  
  var response = searchForLineItems(searchForm);
  
  if (response) {
    var thisSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var templateSheet = thisSpreadsheet.getSheetByName("Search Results Template");
    var searchResultsSheet = thisSpreadsheet.insertSheet("Search Results", {"template": templateSheet});
  
    addDataValidations(searchResultsSheet);
    
    // add data from the response
    var data = response.data;
    var dataRows = [];
    
    for (var i = 0; i < data.length; i++) {
      
      var dataRow = [
        "",
        data[i].key,
        new Date(data[i].year, data[i].monthId - 1, data[i].day), 
        data[i].description,
        data[i].subcategoryName,
        data[i].amount,
        data[i].isTaxDeductible ? "Yes" : "No",
        getLineItemTypeFromID(data[i].typeId),
        data[i].paymentMethodName,
        getStatusFromID(data[i].statusId)
      ];
    
      dataRows.push(dataRow);
    }
    
    var range = searchResultsSheet.getRange(2,1,dataRows.length, 10);
    range.setValues(dataRows);
  }
}

function addNewLineItem() {
  var newLineItemsSheet = SpreadsheetApp.getActiveSheet();
  
  newLineItemsSheet.insertRowsBefore(2, 1);
}

function saveNewLineItems() {
  // get the data in the new line Items sheet
  var lineItemsSheet = SpreadsheetApp.getActiveSheet();
  var data = lineItemsSheet.getDataRange().getValues();
  
  // get the responded data w/ new IDs
  var respondedData = saveLineItemsToAPI(data, false);
  
  for (var i = 1; i < lineItemsSheet.getLastRow(); i++) {
    data[i][1] = respondedData[i-1].data.key;
  }

  lineItemsSheet.getDataRange().setValues(data);
}

function saveJournalEntries() {
  // get the data in the new journal entries sheet
  var journalEntriesSheet = SpreadsheetApp.getActiveSheet();
  var data = journalEntriesSheet.getDataRange().getValues();
  
  // get the responded data w/ new IDs
  var respondedData = saveJournalItemsToAPI(data);
  
  for (var i = 1; i < journalEntriesSheet.getLastRow(); i++) {
    // since the results are shown two at a time (from/to), multiply the iterator by 2,
    // and show the first item as that # - 2, and the second item as that # - 1.
    // i.e. First Row = 1 * 2 = 2. So, first data row = 2 - 2 = 0, second data row = 2 - 1 = 1
    data[i][6] = respondedData[(i*2)-2].data.key;
    data[i][7] = respondedData[(i*2)-1].data.key;
  }

  journalEntriesSheet.getDataRange().setValues(data);
}

function savePendingLineItems() {
  // get the data in the pending line Items sheet
  var lineItemsSheet = SpreadsheetApp.getActiveSheet();
  var data = lineItemsSheet.getDataRange().getValues();  
  
  // get the responded data
  var respondedData = saveLineItemsToAPI(data, true);
  
  var validResponse = true;
  for (var i = 1; i < lineItemsSheet.getLastRow(); i++) {
    if (respondedData[i-1].status == 'ok') {
      data[i][0] = '*';
    } else {
      validResponse = false;
    }
  }
  
  if (!validResponse) {
    SpreadsheetApp.getUi().alert("Some items were not updated correctly. Please verify data and try again.");
  }
  
  lineItemsSheet.getDataRange().setValues(data);
}

function deleteSelectedLineItems() {
  // get the line items to delete
  var lineItemsSheet = SpreadsheetApp.getActiveSheet();
  var data = lineItemsSheet.getDataRange().getValues();
  
  // filter through the data to get only those that are marked for delete
  for (var i = 0; i < data.length; i++) {
    if (data[i][10] == 'Yes') {
      // delete the line item using it's key
      if (deleteLineItem(data[i][1])) {
        data[i][0] = 'D';
      }
    }
  }
  
  // push back the data onto the sheet to show changes
  lineItemsSheet.getDataRange().setValues(data);
}

function finishLineItemOperation() {
  // get the current worksheet & remove it
  SpreadsheetApp.getActiveSpreadsheet().deleteActiveSheet();
  
  // set the active sheet to the totals by category sheet
  var totalsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Totals By Category");
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(totalsSheet);
  
  // get current line items
  getLineItems();
}

function addDataValidations(worksheet) {
  // apply current subcategories to sheet
  var subcategories = getSubcategoryArray();
  var subcategoryCells = worksheet.getRange("E2:E");
  var scRule = SpreadsheetApp.newDataValidation().requireValueInList(subcategories).setAllowInvalid(false).build();
  subcategoryCells.setDataValidation(scRule);
  
  // apply tax deductible options to sheet
  var taxDeductibleCells = worksheet.getRange("G2:G");
  var taxRule = SpreadsheetApp.newDataValidation().requireValueInList(getBooleanArray()).setAllowInvalid(false).build();
  taxDeductibleCells.setDataValidation(taxRule);
  
  // apply line item types to sheet
  var lineItemCells = worksheet.getRange("H2:H");
  var lineItemRule = SpreadsheetApp.newDataValidation().requireValueInList(getLineItemTypeArray()).setAllowInvalid(false).build();
  lineItemCells.setDataValidation(lineItemRule);
  
  // apply current payment methods to sheet
  var paymentMethods = getPaymentMethodArray();
  var paymentMethodCells = worksheet.getRange("I2:I");
  var pmRule = SpreadsheetApp.newDataValidation().requireValueInList(paymentMethods).setAllowInvalid(false).build();
  paymentMethodCells.setDataValidation(pmRule);
  
  // apply statuses to sheet
  var statusCells = worksheet.getRange("J2:J");
  var statusRule = SpreadsheetApp.newDataValidation().requireValueInList(getStatusArray()).setAllowInvalid(false).build();
  statusCells.setDataValidation(statusRule);
}

function addSearchDataValidations(worksheet) {
  // valid date
  var requireDateRule = SpreadsheetApp.newDataValidation().requireDate().setHelpText("This field must be a date.").setAllowInvalid(false);
  var minDateCells = worksheet.getRange("B5:D5");
  var updatedAfterCell = worksheet.getRange("B14");
  var specificDateCell = worksheet.getRange("B8");
  minDateCells.setDataValidation(requireDateRule);
  updatedAfterCell.setDataValidation(requireDateRule);
  specificDateCell.setDataValidation(requireDateRule);
  
  // max date on or after min date
  var requireMaxDateOnAfterMinDateRule = SpreadsheetApp.newDataValidation().requireFormulaSatisfied("=IF(AND(ISDATE(B6),B6 >= B5), TRUE, FALSE)");
  requireMaxDateOnAfterMinDateRule.setHelpText("Maximum Date must be on or after Minimum Date").setAllowInvalid(false); 
  var maxDateCells = worksheet.getRange("B6:D6");
  maxDateCells.setDataValidation(requireMaxDateOnAfterMinDateRule);
  
  // comparators
  var valueComparators = SpreadsheetApp.newDataValidation().requireValueInList(getComparators(), true).setAllowInvalid(false);
  var dateComparatorCell = worksheet.getRange("D8");
  var amountComparatorCell = worksheet.getRange("I8");
  dateComparatorCell.setDataValidation(valueComparators);
  amountComparatorCell.setDataValidation(valueComparators);
  
  // valid number rule
  var validMinAmountRule = SpreadsheetApp.newDataValidation().requireFormulaSatisfied("=IF(ISNUMBER(G5), TRUE, FALSE)");
  validMinAmountRule.setHelpText("Minimum Amount must be a number.").setAllowInvalid(false);
  var validMaxAmountRule = SpreadsheetApp.newDataValidation().requireFormulaSatisfied("=IF(AND(ISNUMBER(G6), G6 >= G5), TRUE, FALSE)");
    validMaxAmountRule.setHelpText("Maximum Amount must be a number and be greater than or equal to minimum amount.").setAllowInvalid(false);
  var validSpecificAmountRule = SpreadsheetApp.newDataValidation().requireFormulaSatisfied("=IF(ISNUMBER(G8), TRUE, FALSE)");
  validSpecificAmountRule.setHelpText("Specific Amount must be a number.").setAllowInvalid(false);
  
  var minAmountCell = worksheet.getRange("G5:I5");
  minAmountCell.setDataValidation(validMinAmountRule);
  var maxAmountCell = worksheet.getRange("G6:I6");
  maxAmountCell.setDataValidation(validMaxAmountRule);
  var specificAmountCell = worksheet.getRange("G8");
  specificAmountCell.setDataValidation(validSpecificAmountRule);
  
  // tax deductible
  var taxDeductibleValues = SpreadsheetApp.newDataValidation().requireValueInList(getBooleanArray(), true).setAllowInvalid(false);
  var taxDeductibleCell = worksheet.getRange("B18");
  taxDeductibleCell.setDataValidation(taxDeductibleValues);
  
  // years
  var yearValues = SpreadsheetApp.newDataValidation().requireValueInList(getYears(), true).setAllowInvalid(false);
  var yearCell = worksheet.getRange("B9");
  yearCell.setDataValidation(yearValues);
  
  // quarters
  var quarterValues = SpreadsheetApp.newDataValidation().requireValueInList(getQuarters(), true).setAllowInvalid(false);
  var quarterCell = worksheet.getRange("B10");
  quarterCell.setDataValidation(quarterValues);
  
  // months
  var monthValues = SpreadsheetApp.newDataValidation().requireValueInList(getMonths(), true).setAllowInvalid(false);
  var monthCell = worksheet.getRange("B11");
  monthCell.setDataValidation(monthValues);
  
  // days
  var dayValues = SpreadsheetApp.newDataValidation().requireValueInList(getDays(), true).setAllowInvalid(false);
  var dayCell = worksheet.getRange("B12");
  dayCell.setDataValidation(dayValues);
  
  // days of week
  var daysOfWeekValues = SpreadsheetApp.newDataValidation().requireValueInList(getDaysOfWeek(), true).setAllowInvalid(false);
  var daysOfWeekCell = worksheet.getRange("B13");
  daysOfWeekCell.setDataValidation(daysOfWeekValues);
  
  // line item types
  var lineItemTypeValues = SpreadsheetApp.newDataValidation().requireValueInList(getLineItemTypeArray(), true).setAllowInvalid(false);
  var lineItemTypeCell = worksheet.getRange("G9");
  lineItemTypeCell.setDataValidation(lineItemTypeValues);
  
  // financial types
  var finTypeValues = SpreadsheetApp.newDataValidation().requireValueInList(getFinTypeArray(), true).setAllowInvalid(false);
  var finTypeCell = worksheet.getRange("G10");
  finTypeCell.setDataValidation(finTypeValues);
  
  // categories
  var categoryValues = SpreadsheetApp.newDataValidation().requireValueInList(getCategoryArray(), true).setAllowInvalid(false);
  var categoryCell = worksheet.getRange("G17:I17");
  categoryCell.setDataValidation(categoryValues);
  
  // subcategories
  var subcategoryValues = SpreadsheetApp.newDataValidation().requireValueInList(getSubcategoryArray(), true).setAllowInvalid(false);
  var subcategoryCell = worksheet.getRange("G18:I18");
  subcategoryCell.setDataValidation(subcategoryValues);
  
  // payment methods
  var paymentMethodValues = SpreadsheetApp.newDataValidation().requireValueInList(getPaymentMethodArray(), true).setAllowInvalid(false);
  var paymentMethodCell = worksheet.getRange("G19:I19");
  paymentMethodCell.setDataValidation(paymentMethodValues);
  
  // statuses
  var statusValues = SpreadsheetApp.newDataValidation().requireValueInList(getStatusArray(), true).setAllowInvalid(false);
  var statusCell = worksheet.getRange("G20:I20");
  statusCell.setDataValidation(statusValues);
}
