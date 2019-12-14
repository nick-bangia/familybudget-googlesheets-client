function IsAuthorized() {

  // check access token, expiry, refresh expiry and determine whether to login, renew or do nothing
  var properties = PropertiesService.getScriptProperties();
  var accessToken = properties.getProperty("accessToken");
  var authCommand = 'login';
  
  if (accessToken != 'nil') {
    var accessExpires = properties.getProperty("accessExpires");
    var accessExpiresDate = new Date(accessExpires);
    var currentDate = new Date();
    if (currentDate.valueOf() >= accessExpiresDate.valueOf()) {
      var refreshExpires = properties.getProperty("refreshExpires");
      var refreshExpiresDate = new Date(refreshExpires);
      
      if (currentDate.valueOf() < refreshExpiresDate.valueOf()) {
        Logger.log("Access has expired, but can be renewed.");
        authCommand = 'renew';
      } else {
        Logger.log("Access has expired and is already past the renewal window. Will have to re-login.");
      }
    } else {
      Logger.log("Access is still valid.");
      authCommand = 'nil';
    }
  }
  
  var baseUrl = properties.getProperty("baseUrl");
  var accessResult = true;
  
  if (authCommand != 'nil') {
    var url, options;
    
    if (authCommand == 'login') {
      return false;
    } else if (authCommand == 'renew') {
      accessResult = RenewAccess();
    }
  }
  
  return accessResult;
}

function getAuthorizationHeader(password) {
  
  var ui = SpreadsheetApp.getUi();
  
  // get username & password from properties
  var properties = PropertiesService.getScriptProperties();
  var username = properties.getProperty("username");
  
  if (password != -1) {
    var authenticationString = username + ":" + password;
    
    // base64 encode the username & password string
    var encodedAuthorization = "Basic " + Utilities.base64EncodeWebSafe(authenticationString);
    
    var authHeader = {
      'authorization': encodedAuthorization
    };
  
    return authHeader;
  
  } else {
    
    return -1;
  }
}

function getRenewHeader() {

  // get accessToken & refreshToken
  var properties = PropertiesService.getScriptProperties();
  var accessToken = properties.getProperty("accessToken");
  var refreshToken = properties.getProperty("refreshToken");
  
  var renewHeader = {
    'x_access_token': accessToken,
    'x_refresh_token': refreshToken
  }
  
  return renewHeader;
}

function getHeaders(method) {
  // for a general request, add the access token in and depending on the method
  // update the content-type
  
  // get accessToken
  var properties = PropertiesService.getScriptProperties();
  var accessToken = properties.getProperty("accessToken");
  
  var header = {
    'x_access_token': accessToken
  }
  
  // check the method - if PUT, add in the Content-Type header
  if (method == "put" || method == 'post') {
    header["Content-Type"] = "application/json";
  }
  
  return header;
}

function Login(password) {
  // set up the request
  var baseUrl = PropertiesService.getScriptProperties().getProperty("baseUrl");
  var headers = getAuthorizationHeader(password);
  
  if (headers != -1) {
    url = baseUrl + "/login";
    options = {
      'method': 'get',
      'headers': headers
    };
    
    // get the response
    var response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() == 200) {
      // Evaluate the response and set script properties
      EvaluateAccessResponse(response);
      createFullMenu();
      return true;
    } else {
      Logger.log("Login request failed! Response code: " + response.getResponseCode());
      return false;
    }
  } else {
    var ui = SpreadsheetApp.getUi();
    Logger.log("Password request cancelled or closed by user. Login stopped prematurely.");
    return false;
  }
}

function RenewAccess() {
  // set up the request
  var baseUrl = PropertiesService.getScriptProperties().getProperty("baseUrl");
  var headers = getRenewHeader();
  url = baseUrl + "/renew";
  options = {
    'method': 'get',
    'headers': headers
  };
  
  // get the response
  try {
    var response = UrlFetchApp.fetch(url, options);
  
    if (response.getResponseCode() == 200) {
      // Evaluate the response and set script properties
      EvaluateAccessResponse(response);
      return true;
    } else {
      Logger.log("Renew Access request failed! Response code: " + response.getResponseCode());
      return false;
    }
  } catch (ex) {
    Logger.log("Security context does not exist to attempt renew. Please log in manually to renew access.");
    return false;
  }
}

function EvaluateAccessResponse(response) {
  var jsonResponse = JSON.parse(response.getContentText());
  if (jsonResponse.status == 'ok') {
    Logger.log("JSON Response to access (login or renew) request: " + jsonResponse);
    
    // set script properties from response
    var properties = PropertiesService.getScriptProperties();
    properties.setProperty("accessToken", jsonResponse.data[0].access_token);
    properties.setProperty("accessExpires", jsonResponse.data[0].access_expires_on);
    properties.setProperty("refreshToken", jsonResponse.data[0].refresh_token);
    properties.setProperty("refreshExpires", jsonResponse.data[0].refresh_expires_on);
    
  } else {
    
    // log the failed response
    Logger.log("Access request (either login or renew failed.");
    Logger.log("JSON Response: " + jsonResponse);
  }
}

function MakeAPICall(uri, method, payload) {
  var jsonResponse;
  
  Logger.log("Attempting to make a request to: " + uri + " using method: " + method);
  if (payload != undefined) {
    Logger.log("Requesting with payload: " + payload);
  }
  
  // check if the script is currently authorized and authorize if needed
  if (IsAuthorized()) {
    
    // get the access header needed to make the request
    var headers = getHeaders(method);
    
    // form the options to use in the request
    var options = {
      'method': method,
      'headers': headers
    };
    
    if (method == 'put' || method == 'post') {
      options.payload = payload;
    }
    
    // form the url to request against
    var properties = PropertiesService.getScriptProperties();
    var baseUrl = properties.getProperty("baseUrl");
    var url = baseUrl + uri;
    
    // make the request
    var response = UrlFetchApp.fetch(url, options);
    Logger.log("Response to " + url + " has response code: " + response.getResponseCode());
    if (response.getResponseCode() == 401) {
      if (Login()) {
        Logger.log("Access has been restored.");
        Browser.msgBox("There was a problem accessing the API, however access has now been restored. Please try again.");
      } else {
        Logger.log("Access could not be restored.");
        Browser.msgBox("There was a problem accessing the API and access could not be restored. Please troubleshoot, and try again.");
      }
    } else if (response.getResponseCode() == 200) {
      jsonResponse = JSON.parse(response.getContentText());
      Logger.log("JSON response to " + url + " status is: " + jsonResponse.status);
    }
  } else {
    Browser.msgBox("Unauthorized to use the API currently. Please make sure you are logged in and try again.");
  }
  
  return jsonResponse;
}
