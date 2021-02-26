//Accessing the variables from XYZ_Bank_Object.js
let XYZ_Bank_Object = require('../Page Objects/XYZ_Bank_Object');

//XYZ Bank Home page
describe("XYZ Bank Home Page",() =>
{
   beforeEach(() =>{
     
    //Access the URL of home page
    XYZ_Bank_Object.getURL();
      });
    
it("click Home Page",() =>{

   //click on the home button
    XYZ_Bank_Object.clickHome();

   //Verifying the home page heading
     expect(XYZ_Bank_Object.getHeader()).toEqual("XYZ Bank");

    //click on the customer login
    XYZ_Bank_Object.clickCustomerLogin();

    //click on home page
     XYZ_Bank_Object.clickHome();

    //click on the customer login
    XYZ_Bank_Object.clickManager_Login();

    //click on home page
    XYZ_Bank_Object.clickHome();
})

})
