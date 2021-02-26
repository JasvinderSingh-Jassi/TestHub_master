//Accessing the variables from XYZ_Bank_Object.js
var XYZ_Bank_Object = require('../Page Objects/XYZ_Bank_Object');

//XYZ Bank Customr login
describe("XYZ Bank Customer login",() =>
{
   beforeEach(() =>{

    //Access the URL of home page
    XYZ_Bank_Object.getURL();
      });
    

//Customer Login page
it("Customer_Login",() =>{
    //assert on Customer Login section
    XYZ_Bank_Object.clickCustomerLogin();

    //assert user in the dropdown
    XYZ_Bank_Object.select_User();

    //assert on the customer login button
    XYZ_Bank_Object.click_select_Customer_Login();

    //assert on the home button
    XYZ_Bank_Object.clickHome();

    //assert on Customer Login section
    XYZ_Bank_Object.clickCustomerLogin();

    //assert user in the dropdown
    XYZ_Bank_Object.select_User();

    //assert on the customer login button
    XYZ_Bank_Object.click_select_Customer_Login();

    //assert the Welcome message 
    expect(XYZ_Bank_Object.getwelcome_messg()).toEqual("Ron Weasly");

    //Select the account from the dropdown
    XYZ_Bank_Object.account_select();
  })


  //Transaction Record page
    it("Customer_Transaction",() =>{
  //assert on Customer Login section
  XYZ_Bank_Object.clickCustomerLogin();

  //assert user in the dropdown
  XYZ_Bank_Object.select_User();

  //assert on the customer login button
  XYZ_Bank_Object.click_select_Customer_Login();

  //assert the Welcome message 
  expect(XYZ_Bank_Object.getwelcome_messg()).toEqual("Ron Weasly");

  //Select the account from the dropdown
  XYZ_Bank_Object.account_select();

    //assert on customer transaction section
    XYZ_Bank_Object.clickCustomer_Transaction();

    //assert on Back button
    XYZ_Bank_Object.clickBack();
    
  })


  //Customer Deposit page
  it("Customer_Deposit",() =>{
      //assert on Customer Login section
      XYZ_Bank_Object.clickCustomerLogin();

      //assert user in the dropdown
      XYZ_Bank_Object.select_User();
  
      //assert on the customer login button
      XYZ_Bank_Object.click_select_Customer_Login();
  
      //assert the Welcome message 
      expect(XYZ_Bank_Object.getwelcome_messg()).toEqual("Ron Weasly");
  
      //Select the account from the dropdown
      XYZ_Bank_Object.account_select();

    //assert on customer deposit section
    XYZ_Bank_Object.clickCustomerDeposit();

    //Enter the deposit amount
    XYZ_Bank_Object.sendAmountDeposit();

    //assert on deposit button
    XYZ_Bank_Object.clickAmountDeposit();

    //assert the message after deposit
    expect(XYZ_Bank_Object.checkDepositStatus()).toEqual("Deposit Successful");
    
  })

  
  //Customer Withdrawl page
  it("Customer_Deposit",() =>{
      //assert on Customer Login section
      XYZ_Bank_Object.clickCustomerLogin();

      //assert user in the dropdown
      XYZ_Bank_Object.select_User();
  
      //assert on the customer login button
      XYZ_Bank_Object.click_select_Customer_Login();
  
      //assert the Welcome message 
      expect(XYZ_Bank_Object.getwelcome_messg()).toEqual("Ron Weasly");
  
      //Select the account from the dropdown
      XYZ_Bank_Object.account_select();

    //assert on customer withdrawl section
    XYZ_Bank_Object.clickCustomer_Withdrawl();

    //Enter the withdrawl amount
    XYZ_Bank_Object.sendAmountWithdrawl();

    //assert on withdrawl button
    XYZ_Bank_Object.clickAmountWithdrawl();

    //assert the message after withdrawl
    expect(XYZ_Bank_Object.checkWithdrawlStatus()).toEqual("Transaction successful");

    //assert on logout
    XYZ_Bank_Object.clickLogout();
    
    //assert on home button
    XYZ_Bank_Object.clickHome();

})
})