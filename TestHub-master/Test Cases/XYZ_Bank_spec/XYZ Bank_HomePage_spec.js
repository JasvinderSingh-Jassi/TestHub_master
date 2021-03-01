//Accessing the variables from XYZ_Bank_Page.js
let XYZ_Bank_Page = require('../../Page Objects/XYZ_Bank_Page');


describe("XYZ Bank Home Page",() =>
{
   
  var originalTimeout;

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
    

   it("click Home Page",() =>{

    //click on the home button
    XYZ_Bank_Page.home.click();

    //Verifying the home page heading
    expect(XYZ_Bank_Page.header.getText()).toEqual("XYZ Bank");
    
    //click on the customer login
    XYZ_Bank_Page.Customer_Login.click();
    

    //click on home page
     XYZ_Bank_Page.home.click();

    //click on the manager login
    XYZ_Bank_Page.Manager_Login.click();

    //click on home page
    XYZ_Bank_Page.home.click();
})

})
