/*
* Runs when a POST request is sent to the deployed web app
* Sends a notification via text, e-mail, or both depending on what data is sent in the post data
*/
function doPost(e) {
    // only process the request if it is sent in the correct format
    if (e.postData.type == "application/json") {
      var postData = JSON.parse(e.postData.contents);
      
      var sendTo = postData.recipients;
      var from = postData.from;
      var subject = postData.subject;
      var content = postData.message;
      
      MailApp.sendEmail({
        name: from,
        to: sendTo,
        subject: subject,
        htmlBody: content });
    }
    
    return ContentService.createTextOutput("success");
}
