//Accessing the variables from Grubhub_Page.js
let Grubhub_Page = require('../../Page Objects/Grubhub_Page');

describe("Assert Grubhub application",() =>
{

  
  let originalTimeout;

  beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;
  });

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  this.getURL = () => {

    //Disable AngularEnabled
    browser.waitForAngularEnabled(false);

    //Access the URL
    browser.get('https://www.grubhub.com/');

    //Maximize the browser window
    browser.manage().window().maximize();
       
  };
 

   beforeEach(() =>{
   this.getURL();
  });

  
it("Assert default sorting displayed",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();

    //Wait for execution
    let until = protractor.ExpectedConditions;
    browser.wait(until.presenceOf(Grubhub_Page.Dropdown), 10000);

    //Click on default dropdown
    Grubhub_Page.Dropdown.click();

    //Get text from default dropdown
    let text= Grubhub_Page.Dropdown.getText();

    //assert default dropdown
    text.then(content =>{
    expect(content).toEqual("Default\nRating\nDistance\nDelivery Estimate\nDelivery Minimum\nDelivery Fee");
    })
    
 browser.sleep(8000);
})


it("Assert on selecting Rating",() =>{

    //Wait for execution
    let until3 = protractor.ExpectedConditions;
    browser.wait(until3.presenceOf(Grubhub_Page.Search), 10000);

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();
   
    //Wait for execution
    let until2 = protractor.ExpectedConditions;
    browser.wait(until2.presenceOf(Grubhub_Page.Rating), 10000);

    //Click on Rating in the dropdown
    Grubhub_Page.Rating.click();
    browser.sleep(5000);

    //Assert the resturant on applying rating filter
    expect(Grubhub_Page.Assert_Resturant_Search.getText()).toEqual("26 Restaurants");
    browser.sleep(10000);
})

it("Printing all name, time ,rating and cost",() =>{

  
   //Search New York, NY in search bar
   Grubhub_Page.Search.click().sendKeys("New York, NY");

   //Click on FindFood
   Grubhub_Page.FindFood.click();

   //Wait for execution
   let until8 = protractor.ExpectedConditions;
   browser.wait(until8.presenceOf(Grubhub_Page.Restaurant), 10000);

   //Get text of all restaurant
   let text8= Grubhub_Page.Restaurant.getText();
   text8.then(data =>{
   browser.sleep(3000);

   //Print text of all restaurant
   console.log(data);

})
})

it("Sort Rating and print it",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();
   
    //Wait for execution
    let until2 = protractor.ExpectedConditions;
    browser.wait(until2.presenceOf(Grubhub_Page.Rating), 8000);

    //Click on Rating in the dropdown
    Grubhub_Page.Rating.click();
    browser.sleep(5000);

    //Get text of all restaurant
    let text4= Grubhub_Page.Restaurant.getText();
    text4.then(data =>{
    browser.sleep(3000);
 
    //Print text of all restaurant
    console.log(data);

 })

})
it("Assert all resturant with Free Delivery shown",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();

    //Wait for execution
    let until2 = protractor.ExpectedConditions;
    browser.wait(until2.presenceOf(Grubhub_Page.check_FreeDelivery), 10000);

    //Check the free delivery checkbox
    Grubhub_Page.check_FreeDelivery.click();

    //Assert the resturant on applying Free Delivery filter
    expect(Grubhub_Page.Assert_Resturant_Search.getText()).toEqual("5 Restaurants");

})

it("Print all resturant with free Delivery shown",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();

    //Wait for execution
    let until2 = protractor.ExpectedConditions;
    browser.wait(until2.presenceOf(Grubhub_Page.check_FreeDelivery), 10000);

    //Check the free delivery checkbox
    Grubhub_Page.check_FreeDelivery.click();
    
    //Get text of all restaurant
    let text4= Grubhub_Page.Restaurant.getText();
    text4.then(data =>{
    browser.sleep(3000);

    //Print text of all restaurant
    console.log(data);
  
})
})

it("Print all the cusines shown",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();
 
    //Wait for execution
    let until2 = protractor.ExpectedConditions;
    browser.wait(until2.presenceOf(Grubhub_Page.Cuisine), 10000);

    //Get text of all restaurant
    let text3= Grubhub_Page.Cuisine.getText();
    text3.then(data =>{
    browser.sleep(3000);

    //Print text of all restaurant
    console.log(data);
})
    
})

it(" Assert all the resturent with less than 45 min is shown",() =>{
    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();

    //Wait for execution
    let until7 = protractor.ExpectedConditions;
    browser.wait(until7.presenceOf(Grubhub_Page.slider), 10000);

    //Click on 45min
    Grubhub_Page.slider.click();
    browser.sleep(5000);

    //Assert the resturant on applying less than 45 min slider
    expect(Grubhub_Page.Assert_Resturant_Search.getText()).toEqual("26 Restaurants");

}) 
it(" Print all the resturent with less than 45 min is shown",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();

    //Wait for execution
    let until2 = protractor.ExpectedConditions;
    browser.wait(until2.presenceOf(Grubhub_Page.slider), 10000);

    //Click on 45min
    Grubhub_Page.slider.click();
    browser.sleep(5000);

    //Get text of all restaurant
    let text4= Grubhub_Page.Restaurant.getText();
    text4.then(data =>{
    browser.sleep(3000);

    //Print text of all restaurant
    console.log(data);
})  
 
})
})
