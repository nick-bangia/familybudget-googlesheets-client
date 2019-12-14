function getSubcategoryKeyValuePairs() {
  
  // get subcategories from API
  var response = MakeAPICall("/subcategories/all", "get");
  
  // initialize the subcategory list
  var subcategoryKeyValues = {};
  
  // loop through response data and build a list of subcategories & their IDs
  var subcategoryData = response.data;
  for (var i = 0; i < subcategoryData.length; i++) {
    subcategoryKeyValues[subcategoryData[i].name] = subcategoryData[i].key;
  }
  
  // return the list of subcategories & their IDs
  return subcategoryKeyValues;
}

function getCategoryKeyValuePairs() {
  
  // get categories from API
  var response = MakeAPICall("/categories/all", "get");
  
  // initialize the category list
  var categoryKeyValues = {};
  
  // loop through the response data and build a list of categories & their IDs
  var categoryData = response.data;
  for (var i = 0; i < categoryData.length; i++) {
    categoryKeyValues[categoryData[i].categoryName] = categoryData[i].key;
  }
  
  // return the list of categories & their IDs
  return categoryKeyValues;
}

function getPaymentMethodKeyValuePairs() {
  
  // get subcategories from API
  var response = MakeAPICall("/paymentMethods/all", "get");
  
  // initialize the subcategory list
  var pmKeyValues = {};
  
  // loop through response data and build a list of payment methods & their IDs
  var pmData = response.data;
  for (var i = 0; i < pmData.length; i++) {
    pmKeyValues[pmData[i].paymentMethodName] = pmData[i].key;
  }
  
  // return the list of payment methods & their IDs
  return pmKeyValues;
}

function getSubcategoryArray() {
  // get subcategories from API
  var response = MakeAPICall("/subcategories/all", "get");
  
  // initialize the scArray
  var scArray = new Array();
  
  // loop through the subcategories and fill the array
  var subcategoryData = response.data;
  for (var i = 0; i < subcategoryData.length; i++) {
    scArray.push(subcategoryData[i].name);
  }
  
  return scArray;
}

function getCategoryArray() {
  // get categories from API
  var response = MakeAPICall("/categories/all", "get");
  
  // initialize the categoryArray
  var categoryArray = new Array();
  
  // loop through the categories and fill the array
  var categoryData = response.data;
  for (var i = 0; i < categoryData.length; i++) {
    categoryArray.push(categoryData[i].categoryName);
  }
  
  return categoryArray;
}

function getPaymentMethodArray() {
  // get payment methods from API
  var response = MakeAPICall("/paymentMethods/all", "get");
  
  // initialize the pmArray
  var pmArray = new Array();
  
  // loop through the payment methods and fill the array
  var paymentMethodData = response.data;
  for (var i = 0; i < paymentMethodData.length; i++) {
    pmArray.push(paymentMethodData[i].paymentMethodName);
  }
                 
  return pmArray;
}

function saveLineItemsToAPI(data, isUpdate) {
  // get the subcategory and paymentMethod list into memory
  var subcategories = getSubcategoryKeyValuePairs();
  var paymentMethods = getPaymentMethodKeyValuePairs();
  
  // convert the 2-dimensional data array into a list of line items
  var payloadData = { "data": new Array() };
  for (var i = 1; i < data.length; i++) {
    var dataRow = {
      "monthId":          Math.floor((data[i][2]).getMonth() + 1),
      "day":              Math.floor((data[i][2]).getDate()),
      "dayOfWeekId":      Math.floor((data[i][2]).getDay() + 1),
      "year":             Math.floor((data[i][2]).getFullYear()),
      "subcategoryKey":   subcategories[data[i][4]],
      "description":      data[i][3],
      "amount":           data[i][5],
      "typeId":           Math.floor(getLineItemTypeIdFromName(data[i][7])),
      "subtypeId":        Math.floor(getFinTypeIdForAmount(data[i][5])),
      "quarter":          Math.floor(getQuarterIdForMonth((data[i][2]).getMonth() + 1)),
      "paymentMethodKey": paymentMethods[data[i][8]],
      "statusId":         Math.floor(getStatusIdFromName(data[i][9])),
      "isTaxDeductible":  Math.floor(getBooleanIdFromName(data[i][6]))
    };
    
    if (isUpdate) {
      // if the key value is not empty, add it to the data row object
      dataRow.key = data[i][1];
    }
    
    payloadData.data.push( dataRow );
  }
  
  // return the JSON response to adding line items
  var apiOp = "/lineItems/add";
  if (isUpdate) {
    apiOp = "/lineItems/update";
  }
  
  var jsonResponse = MakeAPICall(apiOp, "put", JSON.stringify(payloadData));
  return jsonResponse.data;
}

function saveJournalItemsToAPI(data) {
  // get the subcategory and paymentMethod list into memory
  var subcategories = getSubcategoryKeyValuePairs();
  var paymentMethods = getPaymentMethodKeyValuePairs();
  
  // convert the 2-dimensional data array into a list of line items
  var payloadData = { "data": new Array() };
  for (var i = 1; i < data.length; i++) {
    var fromSC = subcategories[data[i][3]];
    var toSC = subcategories[data[i][4]];
    var fromDataRow = {
      "monthId":          Math.floor((data[i][1]).getMonth() + 1),
      "day":              Math.floor((data[i][1]).getDate()),
      "dayOfWeekId":      Math.floor((data[i][1]).getDay() + 1),
      "year":             Math.floor((data[i][1]).getFullYear()),
      "subcategoryKey":   fromSC,
      "description":      "Journal Entry: From " + data[i][3] + " to " + data[i][4] + "; Reason: " + data[i][5],
      "amount":           data[i][2] * -1,
      "typeId":           Math.floor(getLineItemTypeIdFromName("Journal Entry")),
      "subtypeId":        Math.floor(getFinTypeIdForAmount(data[i][2])),
      "quarter":          Math.floor(getQuarterIdForMonth((data[i][1]).getMonth() + 1)),
      "paymentMethodKey": paymentMethods["Logical"],
      "statusId":         Math.floor(getStatusIdFromName("Reconciled")),
      "isTaxDeductible":  Math.floor(getBooleanIdFromName("No"))
    };
    
    var toDataRow = {
      "monthId":          Math.floor((data[i][1]).getMonth() + 1),
      "day":              Math.floor((data[i][1]).getDate()),
      "dayOfWeekId":      Math.floor((data[i][1]).getDay() + 1),
      "year":             Math.floor((data[i][1]).getFullYear()),
      "subcategoryKey":   toSC,
      "description":      "Journal Entry: From " + data[i][3] + " to " + data[i][4] + "; Reason: " + data[i][5],
      "amount":           data[i][2],
      "typeId":           Math.floor(getLineItemTypeIdFromName("Journal Entry")),
      "subtypeId":        Math.floor(getFinTypeIdForAmount(data[i][2])),
      "quarter":          Math.floor(getQuarterIdForMonth((data[i][1]).getMonth() + 1)),
      "paymentMethodKey": paymentMethods["Logical"],
      "statusId":         Math.floor(getStatusIdFromName("Reconciled")),
      "isTaxDeductible":  Math.floor(getBooleanIdFromName("No"))
    };
    
    payloadData.data.push( fromDataRow );
    payloadData.data.push( toDataRow );
  }
  
  // return the JSON response to adding line items
  var apiOp = "/lineItems/add";
  
  var jsonResponse = MakeAPICall(apiOp, "put", JSON.stringify(payloadData));
  return jsonResponse.data;
}

function searchForLineItems(searchForm) {
  // get key/value pairs
  var subcategories = getSubcategoryKeyValuePairs();
  var categories = getCategoryKeyValuePairs();
  var paymentMethods = getPaymentMethodKeyValuePairs();
  
  var searchData = {};
  
  // date
  if (searchForm.getRange("D8").getValue() != "" && searchForm.getRange("D8").getValue() != "between" && searchForm.getRange("B8").getValue() != "") {
    searchData.dateCompareOperator = getComparatorValueFromItem(searchForm.getRange("D8").getValue());
    searchData.minDate = searchForm.getRange("B8").getDisplayValue();
  } else if (searchForm.getRange("D8").getValue() == "between" && searchForm.getRange("B5:D5").getValue() != "" && 
             searchForm.getRange("B6:D6").getValue() != "") {
    searchData.dateCompareOperator = getComparatorValueFromItem(searchForm.getRange("D8").getValue());
    searchData.minDate = searchForm.getRange("B5:D5").getDisplayValue();
    searchData.maxDate = searchForm.getRange("B6:D6").getDisplayValue();
  }
  
  // year
  if (searchForm.getRange("B9").getValue() != "") {
    searchData.year = searchForm.getRange("B9").getValue();
  }
  
  // quarter
  if (searchForm.getRange("B10").getValue() != "") {
    searchData.quarter = getQuarterIdFromItem(searchForm.getRange("B10").getValue());
  }
  
  // month
  if (searchForm.getRange("B11").getValue() != "") {
    searchData.month = getMonthIdFromItem(searchForm.getRange("B11").getValue());
  }
  
  // day
  if (searchForm.getRange("B12").getValue() != "") {
    searchData.day = searchForm.getRange("B12").getValue();
  }
  
  // day of week
  if (searchForm.getRange("B13").getValue() != "") {
    searchData.dayOfWeek = getDayOfWeekIdFromItem(searchForm.getRange("B13").getValue());
  }
  
  // updated after
  if (searchForm.getRange("B14").getValue() != "") {
    searchData.updatedAfter = searchForm.getRange("B14").getDisplayValue();
  }
  
  // description
  if (searchForm.getRange("B17").getValue() != "") {
    searchData.descriptionContains = searchForm.getRange("B17").getValue();
  }
  
  // tax deductible
  if (searchForm.getRange("B18").getValue() != "") {
    searchData.isTaxDeductible = getBooleanIdFromName(searchForm.getRange("B18").getValue());
  }
  
  // amount
  if (searchForm.getRange("I8").getValue() != "" && searchForm.getRange("I8").getValue() != "between" && searchForm.getRange("G8").getValue() != "") {
    searchData.amountCompareOperator = getComparatorValueFromItem(searchForm.getRange("I8").getValue());
    searchData.minAmount = searchForm.getRange("G8").getValue();
  } else if (searchForm.getRange("I8").getValue() == "between" && searchForm.getRange("G5:I5").getValue() != "" &&
             searchForm.getRange("G6:I6").getValue()) {
    searchData.amountCompareOperator = getComparatorValueFromItem(searchForm.getRange("I8").getValue());
    searchData.minAmount = searchForm.getRange("G5:I5").getValue();
    searchData.maxAmount = searchForm.getRange("G6:I6").getValue();
  }
  
  // type
  if (searchForm.getRange("G9").getValue() != "") {
    searchData.type = getLineItemTypeIdFromName(searchForm.getRange("G9").getValue());
  }
  
  // financial type
  if (searchForm.getRange("G10").getValue() != "") {
    searchData.subType = getFinTypeIdFromName(searchForm.getRange("G10").getValue());
  }
  
  // category
  if (searchForm.getRange("G17:I17").getValue() != "") {
    searchData.categoryKey = categories[searchForm.getRange("G17:I17").getValue()];
  }
  
  // subcategory
  if (searchForm.getRange("G18:I18").getValue() != "") {
    searchData.subcategoryKey = subcategories[searchForm.getRange("G18:I18").getValue()];
  }
  
  // payment method
  if (searchForm.getRange("G19:19").getValue() != "") {
    searchData.paymentMethodKey = paymentMethods[searchForm.getRange("G19:I19").getValue()];
  }
  
  // status
  if (searchForm.getRange("G20:I20").getValue() != "") {
    searchData.status = getStatusIdFromName(searchForm.getRange("G20:I20").getValue());
  }
  
  var payloadData = { "data": new Array() };
  payloadData.data.push( searchData );
  var payload = JSON.stringify(payloadData);
  
  // return the JSON response to the search request
  var apiOp = "/lineItems/search";
 
  var jsonResponse = MakeAPICall(apiOp, "post", JSON.stringify(payloadData));
  return jsonResponse;
}

function getPendingItemsFromAPI() {
  // get the search criteria for pending items
  var payloadData = { "data": new Array() };
  payloadData.data.push( { "status": 1 } );
  
  // return the jsonResponse from the API call
  return MakeAPICall("/lineItems/search", "post", JSON.stringify(payloadData));
}

function deleteLineItem(key) {
  var isOK = false;
  
  var jsonResponse = MakeAPICall("/lineItems/delete/" + key, "delete");
  if (jsonResponse.status == "ok") {
    // set the boolean flag indicating that the delete is OK if the status is ok
    isOK = true;
  }
  
  // return the boolean flag
  return isOK;
}
