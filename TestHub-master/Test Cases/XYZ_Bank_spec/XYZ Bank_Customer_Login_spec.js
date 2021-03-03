//Accessing the variables from XYZ_Bank_Page.js
let XYZ_Bank_Page = require('../../Page Objects/XYZ_Bank_Page');


describe("Functionality of XYZ Bank Customer login",() =>
{
  
  let originalTimeout;

  beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
  
   beforeEach(() =>{

   //Access the URL
   browser.get('http://www.way2automation.com/angularjs-protractor/banking/#/login');

   //Maximize the browser window
   browser.manage().window().maximize();

  });
    

    it("Functionality of Customer_Login",() =>{

    //Functionality of Customer Login section
    XYZ_Bank_Page.Customer_Login.click();

    //Functionality of user in the dropdown
    XYZ_Bank_Page.Select_User.click().sendKeys("Ron Weasly").click();

    //Functionality of the customer login button
    XYZ_Bank_Page.Login.click();

    //Functionality of the home button
    XYZ_Bank_Page.home.click();

    //Functionality of Customer Login section
    XYZ_Bank_Page.Customer_Login.click();

    //Functionality of user in the dropdown
    XYZ_Bank_Page.Select_User.click().sendKeys("Ron Weasly").click();

    //Functionality of the customer login button
    XYZ_Bank_Page.Login.click();

    //Functionality of the Welcome message 
    expect(XYZ_Bank_Page.welcome_messg.getText()).toEqual("Ron Weasly");

    //Select the account from the dropdown
    XYZ_Bank_Page.acc_select.click().sendKeys("1007").click();

  })


  
  it("Functionality of Customer Transaction",() =>{

  //Functionality of Customer Login section
  XYZ_Bank_Page.Customer_Login.click();

  //Functionality user in the dropdown
  XYZ_Bank_Page.Select_User.click().sendKeys("Ron Weasly").click();

  //Functionality of the customer login button
  XYZ_Bank_Page.Login.click();

  //Functionality the Welcome message 
  expect(XYZ_Bank_Page.welcome_messg.getText()).toEqual("Ron Weasly");

  //Select the account from the dropdown
  XYZ_Bank_Page.acc_select.click().sendKeys("1007").click();

  //Functionality of customer transaction section
  XYZ_Bank_Page.Customer_Transaction.click();

  //Functionality of Back button
  XYZ_Bank_Page.Back.click();
    
  })


 
  it("Functionality of Customer Deposit",() =>{
     
  //Functionality of Customer Login section
  XYZ_Bank_Page.Customer_Login.click();

  //Functionality user in the dropdown
  XYZ_Bank_Page.Select_User.click().sendKeys("Ron Weasly").click();

  //Functionality of the customer login button
  XYZ_Bank_Page.Login.click();

  //Functionality of the Welcome message 
  expect(XYZ_Bank_Page.welcome_messg.getText()).toEqual("Ron Weasly");

  //Select the account from the dropdown
  XYZ_Bank_Page.acc_select.click().sendKeys("1007").click();

  //Functionality of customer deposit section
  XYZ_Bank_Page.Customer_Deposit.click();

  //Enter the deposit amount
  XYZ_Bank_Page.amount.sendKeys("500");

  //Functionality of deposit button
  XYZ_Bank_Page.Deposit_button.click();

  //Functionality of the message after deposit
  expect(XYZ_Bank_Page.Check_Deposit.getText()).toEqual("Deposit Successful");
    
  })

  

  it("Functionality of Customer Deposit",() =>{

  //Functionality of Customer Login section
  XYZ_Bank_Page.Customer_Login.click();

  //Functionality of user in the dropdown
  XYZ_Bank_Page.Select_User.click().sendKeys("Ron Weasly").click();

  //Functionality of the customer login button
  XYZ_Bank_Page.Login.click();

  //Functionality of the Welcome message 
  expect(XYZ_Bank_Page.welcome_messg.getText()).toEqual("Ron Weasly");

  //Select the account from the dropdown
  XYZ_Bank_Page.acc_select.click().sendKeys("1007").click();

  //Functionality of customer withdrawl section
  XYZ_Bank_Page.Customer_Withdrawl.click();

  //Enter the withdrawl amount
  XYZ_Bank_Page.amount.sendKeys("100");

  //Functionality of withdrawl button
  XYZ_Bank_Page.Withdrawl_button.click();

  //Functionality of the message after withdrawl
  expect(XYZ_Bank_Page.Check_Withdrawl.getText()).toEqual("Transaction successful");

  //Functionality of logout
  XYZ_Bank_Page.Logout.click();
    
  //Functionality of home button
  XYZ_Bank_Page.home.click();

})
})
