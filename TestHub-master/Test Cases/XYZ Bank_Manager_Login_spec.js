//Accessing the variables from XYZ_Bank_Object.js
let XYZ_Bank_Object = require('../Page Objects/XYZ_Bank_Object');

//XYZ Bank Customer Login page
describe("click XYZ Bank Manager login",() =>
{
  beforeEach(() =>{

  //Access the URL of home page
  XYZ_Bank_Object.getURL();
  });
    

//Manager Login page
it("Manager_Login",() =>{

    //click on manager login section
    XYZ_Bank_Object.clickManager_Login();
    
  })

  
    // Add the customers in the record
    it("AddCustomer_section",() =>{

    //click on manager login section
    XYZ_Bank_Object.clickManager_Login();

    //click on add customer section
    XYZ_Bank_Object.clickAddCustomerSection();

    //Enter the first name
    XYZ_Bank_Object.sendFName();

    //Enter the last name
    XYZ_Bank_Object.sendLName();

    //Enter the Pin code
    XYZ_Bank_Object.sendPcode();

    //click on add customer button
    XYZ_Bank_Object.clickAddCustomerbutton();

    //click on accept alert button
    XYZ_Bank_Object.clickAcceptAlert();
  })


  //Open account section
    it("OpenAccount_section",() =>{

    //click on manager login section
    XYZ_Bank_Object.clickManager_Login();

    //click on open account section
    XYZ_Bank_Object.clickOpenAccountSection();

    //Select user from the dropdown
    XYZ_Bank_Object.select_User();

    //Enter the currency type
    XYZ_Bank_Object.sendCurrency();

    //click on process button
    XYZ_Bank_Object.clickProcessbutton();

    //click on accept alert button
    XYZ_Bank_Object.clickAcceptAlert();
  })


 //Customer details section
    it("Customers_section",() =>{

    //click on manager login section
    XYZ_Bank_Object.clickManager_Login();

    //click on customer section
    XYZ_Bank_Object.clickCustomerSection();

    //Enter the name to be searched
    XYZ_Bank_Object.sendSearchName();

    //Delete the selected user record
    XYZ_Bank_Object.clickDelete();

    //click on home page
    XYZ_Bank_Object.clickHome();

 })
})