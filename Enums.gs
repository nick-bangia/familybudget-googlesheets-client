function getLineItemTypeFromID(lineItemTypeId) {
  var lineItemType;
  
  switch (lineItemTypeId) {
    case 0:
      lineItemType = "Expense";
      break;
    case 1:
      lineItemType = "Allocation";
      break;
    case 2:
      lineItemType = "Adjustment";
      break;
    case 3:
      lineItemType = "Income";
      break;
    case 4:
      lineItemType = "Journal Entry";
      break;
    default:
      lineItemType = "N/A";
      break;
  }
  
  return lineItemType;
}

function getLineItemTypeIdFromName(lineItemType) {
  var lineItemTypeId;
  
  switch (lineItemType) {
    case "Expense":
      lineItemTypeId = 0;
      break;
    case "Allocation":
      lineItemTypeId = 1;
      break;
    case "Adjustment":
      lineItemTypeId = 2;
      break;
    case "Income":
      lineItemTypeId = 3;
      break;
    case "Journal Entry":
      lineItemTypeId = 4;
      break;
    default:
      lineItemTypeId = 0;
      break;
  }
  
  return lineItemTypeId;
}

function getLineItemTypeArray() {

  return ["Expense", "Allocation", "Adjustment", "Income", "Journal Entry"];
}


function getFinancialTypeFromID(financialTypeID) {
  var finType;
  
  switch (financialTypeID) {
    case 0:
      finType = "Debit";
      break;
    case 1:
      finType = "Credit";
      break;
    default:
      finType = "N/A";
      break;
  }
  
  return finType;
}

function getFinTypeIdForAmount(amount) {
  
  // return 0 for amounts less than 0, and 1 for amounts >= 0
  return amount < 0 ? 0 : 1;
}

function getFinTypeArray() {
  
  return ["Debit", "Credit"];
}

function getFinTypeIdFromName(finType) {
  var finTypeId;
  
  switch (finType) {
    case "Debit":
      finTypeId = 0;
      break;
    case "Credit":
      finTypeId = 1;
      break;
    default:
      finTypeId = null;
      break;
  }
  
  return finTypeId;
}

function getStatusFromID(statusID) {
  var status;
  
  switch (statusID) {
    case 0:
      status = "Reconciled";
      break;
    case 1:
      status = "Pending";
      break;
    default:
      status = "N/A";
      break;
  }
  
  return status;
}

function getStatusIdFromName(status) {
  var statusId;
  
  switch (status) {
    case "Reconciled":
      statusId = 0;
      break;
    case "Pending":
      statusId = 1;
      break;
    default:
      statusId = 0;
      break;
  }
  
  return statusId;
}

function getStatusArray() {
  
  return ["Reconciled", "Pending"];

}

function getBooleanIdFromName(boolName) {
  var booleanId;
  
  switch (boolName) {
    case "Yes":
      booleanId = 1;
      break;
    case "No":
      booleanId = 0;
      break;
    default:
      booleanId = 0;
  }
  
  return booleanId;
}

function getBooleanArray() {

  return ["Yes", "No"];
}

function getQuarterIdForMonth(monthId) {
  var quarterId;
  
  switch (monthId) {
    case 1:
    case 2:
    case 3:
      quarterId = 1;
      break;
    case 4:
    case 5:
    case 6:
      quarterId = 2;
      break;
    case 7:
    case 8:
    case 9:
      quarterId = 3;
      break;
    case 10:
    case 11:
    case 12:
      quarterId = 4;
      break;
  }
  
  return quarterId;
}

function getComparators() {
  
  return ["less than", "less than or equal to", "equal to", "greater than", "greater than or equal to", "not equal to", "between"];
}

function getComparatorValueFromItem(item) {
  var comparatorValue;
  
  switch (item) {
    case "less than":
      comparatorValue = "lt";
      break;
    case "less than or equal to":
      comparatorValue = "lte";
      break;
    case "equal to":
      comparatorValue = "eq";
      break;
    case "greater than":
      comparatorValue = "gt";
      break;
    case "greater than or equal to":
      comparatorValue = "gte";
      break;
    case "not equal to":
      comparatorValue = "ne";
      break;
    case "between":
      comparatorValue = "btw";
      break;
    default:
      comparatorValue = "";
      break;
  }
  
  return comparatorValue;
}

function getYears() {
  
  return [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
}

function getQuarters() {

  return ["Q1", "Q2", "Q3", "Q4"];
}

function getQuarterIdFromItem(quarter) {
  var quarterId;
  
  switch (quarter) {
    case "Q1":
      quarterId = 1;
      break;
    case "Q2":
      quarterId = 2;
      break;
    case "Q3":
      quarterId = 3;
      break;
    case "Q4":
      quarterId = 4;
      break;
    default:
      quarterId = null;
      break;
  }
  
  return quarterId;
}

function getMonths() {

  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
}

function getMonthIdFromItem(month) {
  var monthId;
  
  switch (month) {
    case "January":
      monthId = 1;
      break;
    case "February":
      monthId = 2;
      break;
    case "March":
      monthId = 3;
      break;
    case "April":
      monthId = 4;
      break;
    case "May":
      monthId = 5;
      break;
    case "June":
      monthId = 6;
      break;
    case "July":
      monthId = 7;
      break;
    case "August":
      monthId = 8;
      break;
    case "September":
      monthId = 9;
      break;
    case "October":
      monthId = 10;
      break;
    case "November":
      monthId = 11;
      break;
    case "December":
      monthId = 12;
      break;
    default:
      monthId = null;
      break;
  }
  
  return monthId;
}

function getDays() {
  
  return [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
}

function getDaysOfWeek() {

  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
}

function getDayOfWeekIdFromItem(dayOfWeek) {
  var dayOfWeekId;
  
  switch (dayOfWeek) {
    case "Sunday":
      dayOfWeekId = 1;
      break;
   case "Monday":
      dayOfWeekId = 2;
      break;
   case "Tuesday":
      dayOfWeekId = 3;
      break;
   case "Wednesday":
      dayOfWeekId = 4;
      break;
   case "Thursday":
      dayOfWeekId = 5;
      break;
   case "Friday":
      dayOfWeekId = 6;
      break;
   case "Saturday":
      dayOfWeekId = 7;
      break;
   default:
      dayOfWeekId = null;
      break;
  }
  
  return dayOfWeekId;
}
