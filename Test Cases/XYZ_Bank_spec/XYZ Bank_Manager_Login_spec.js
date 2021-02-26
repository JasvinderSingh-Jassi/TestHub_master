//Accessing the variables from XYZ_Bank_Page.js
let XYZ_Bank_Page = require('../../Page Objects/XYZ_Bank_Page');


describe("click XYZ Bank Manager login",() =>
{
  beforeEach(() =>{

   //Access the URL
   browser.get('http://www.way2automation.com/angularjs-protractor/banking/#/login');

   //Maximize the browser window
   browser.manage().window().maximize();
  });
    


    it("Manager Login Page",() =>{

    //Functionality of manager login section
    XYZ_Bank_Page.Manager_Login.click();
    
    })

  
    
    it("AddCustomer section",() =>{

    //Functionality of manager login section
    XYZ_Bank_Page.Manager_Login.click();

    //Functionality of add customer section
    XYZ_Bank_Page.AddCustomer.click();

    //Enter the first name
    XYZ_Bank_Page.Fname.sendKeys("Jasvinder");

    //Enter the last name
    XYZ_Bank_Page.Lname.sendKeys("Singh");

    //Enter the Pin code
    XYZ_Bank_Page.Pcode.sendKeys("831011");

    //Functionality of add customer button
    XYZ_Bank_Page.Add_Customer.click();

    //Functionality of accept alert button
    browser.driver.switchTo().alert().accept();

    })


    
    it("OpenAccount section",() =>{

    //Functionality of manager login section
    XYZ_Bank_Page.Manager_Login.click();

    //Functionality of open account section
    XYZ_Bank_Page.Open_Acc.click();

    //Select user from the dropdown
    XYZ_Bank_Page.Select_User.click().sendKeys("Ron Weasly").click();

    //Enter the currency type
    XYZ_Bank_Page.Select_Currency.click().sendKeys("Rupee").click();

    //Functionality of process button
    XYZ_Bank_Page.Process.click();

    //Functionality of accept alert button
    browser.driver.switchTo().alert().accept();

    })


    
    it("Customers section",() =>{

    //Functionality of manager login section
    XYZ_Bank_Page.Manager_Login.click();

    //Functionality of customer section
    XYZ_Bank_Page.Customers.click();

    //Enter the name to be searched
    XYZ_Bank_Page.Search.sendKeys("Ron");

    //Delete the selected user record
    XYZ_Bank_Page.Delete.click();

    //Functionality of home page
    XYZ_Bank_Page.home.click();

 })
})