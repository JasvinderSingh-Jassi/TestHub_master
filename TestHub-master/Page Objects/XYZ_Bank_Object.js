/**
 * Created by Jasvinder Singh on 21th Febraury 2021
 * Description - Verifies the functionality of XYZ Bank application
 */

"use strict";
let XYZ_Bank_Object = function() {

  //home page
  let home=element(by.xpath("//button[contains(text(),'Home')]"));
  let header=element(by.xpath("//strong[contains(text(),'XYZ Bank')]"));
  let Customer_Login=element(by.css("button[ng-click='customer()']"));
  let Manager_Login=element(by.css("button[ng-click='manager()']"));

  //Customer login page
  let Select_User=element(by.xpath("//select[@id='userSelect']"));
  let Login=element(by.css("button[type='submit']"));
  let welcome_messg=element(by.xpath("//span[contains(text(),'Ron Weasly')]"));
  let acc_select=element(by.xpath("//select[@id='accountSelect']"));

  //Customer transaction page
  let Customer_Transaction=element(by.css("button[ng-click='transactions()']"))
  let Back=element(by.css("button[ng-click='back()']"));

  //Customer deposit page
  let Customer_Deposit=element(by.css("button[ng-click='deposit()']"));
  let amount=element(by.model("amount"));
  let Deposit_button=element(by.className("btn btn-default"));
  let Check_Deposit=element(by.css("span[ng-show='message']"))

  //Customer withdrawl page
  let Customer_Withdrawl=element(by.css("button[ng-click='withdrawl()']"));
  let Withdrawl_button=element(by.className("btn btn-default"));
  let Check_Withdrawl=element(by.css("span[ng-show='message']"));
  let Logout=element(by.css("button[ng-click='byebye()']"));

  //Add customer page
  let AddCustomer=element(by.css("button[ng-click='addCust()']"));
  let Fname=element(by.model("fName"));
  let Lname=element(by.model("lName"));
  let Pcode=element(by.model("postCd"));
  let Add_Customer=element(by.className("btn btn-default"));

  //Open account page
  let Open_Acc=element(by.css("button[ng-click='openAccount()']"));
  let Select_Currency=element(by.xpath("//select[@id='currency']"));
  let Process=element(by.css("button[type='submit']"));

  //Customer detail page
  let Customers=element(by.css("button[ng-click='showCust()']"));
  let Search=element(by.model("searchCustomer"));
  let Delete=element(by.css("button[ng-click='deleteCust(cust)']"));
  

  this.getURL = () => {
    //Access the URL
   browser.get('http://www.way2automation.com/angularjs-protractor/banking/#/login');

   //Maximize the browser window
   browser.manage().window().maximize();
  };
 
//click Home Button
  this.clickHome = () => {
     home.click();
  };

//Get Header
 this.getHeader = () => {
  return header.getText();
};

//click Customer Login
this.clickCustomerLogin = () => {
  Customer_Login.click();
};

//click Manager Login
this.clickManager_Login = () => {
  Manager_Login.click();
};

//Select User in Customer Login
this.select_User = () => {
  Select_User.click().sendKeys("Ron Weasly").click();
};

//click after selecting the user in the dropdown
this.click_select_Customer_Login = () => {
  Login.click();
};

//Get welcome message
this.getwelcome_messg = () => {
  return welcome_messg.getText();
};

//Select customer account
this.account_select = () => {
  acc_select.click().sendKeys("1007").click();
};

//click to view customer transactions
this.clickCustomer_Transaction = () => {
  Customer_Transaction.click();
};

//click back button within transactions
this.clickBack = () => {
  Back.click();
};

//click on customer deposit section
this.clickCustomerDeposit = () => {
  Customer_Deposit.click();
};

//Enter amount to deposit
this.sendAmountDeposit = () => {
  amount.sendKeys("500");
};

//click on deposit button to deposit entered amount
this.clickAmountDeposit = () => {
  Deposit_button.click();
};

//Get the message after deposit
this.checkDepositStatus = () => {
  return Check_Deposit.getText();
};

//click on the customer withdrawl section
this.clickCustomer_Withdrawl = () => {
  Customer_Withdrawl.click();
};

//Enter amount to withdrawl
this.sendAmountWithdrawl = () => {
  amount.sendKeys("100");
};

//click on withdrawl button to withdrawl entered amount
this.clickAmountWithdrawl = () => {
  Withdrawl_button.click();
};

//Get the message after withdrawl
this.checkWithdrawlStatus = () => {
  return Check_Withdrawl.getText();
};

//click on the logout button after transaction
this.clickLogout = () => {
  Logout.click();
};

//click on the manager login button
this.clickManager_Login = () => {
  Manager_Login.click();
};

//click on the add customer section
this.clickAddCustomerSection = () => {
  AddCustomer.click();
};

//Enter first name
this.sendFName = () => {
  Fname.sendKeys("Jasvinder");
};

//Enter last name
this.sendLName = () => {
  Lname.sendKeys("Singh");
};

//Enter post code
this.sendPcode = () => {
  Pcode.sendKeys("831011");
};

//click on the add customer button
this.clickAddCustomerbutton = () => {
  Add_Customer.click();
};

//Accept the alert message
this.clickAcceptAlert = () => {
  browser.driver.switchTo().alert().accept();
};

//click on the open account section
this.clickOpenAccountSection = () => {
  Open_Acc.click();
};

//Enter the currency
this.sendCurrency = () => {
  Select_Currency.click().sendKeys("Rupee").click();
};

//click on the process button
this.clickProcessbutton = () => {
  Process.click();
};

//click on the customers section
this.clickCustomerSection = () => {
  Customers.click();
};

//Enter the name on the search menu
this.sendSearchName = () => {
  Search.sendKeys("Ron");
};

//click on the delete customer button
this.clickDelete = () => {
  Delete.click();
};

};

module.exports = new XYZ_Bank_Object();