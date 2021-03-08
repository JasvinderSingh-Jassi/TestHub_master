//Accessing the variables from Grubhub_Page.js
let Grubhub_Page = require('../../Page Objects/Grubhub_Page');

let util = require('../../util');
let Q = require('q');

describe("Assert Grubhub application",() =>
{

    let originalTimeout;

    this.getURL = () => {

    //Disable AngularEnabled
    browser.waitForAngularEnabled(false);

    //Access the URL
    browser.get('https://www.grubhub.com/');

    //Maximize the browser window
    browser.manage().window().maximize();
       
  };

  beforeEach(() =>{

    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000; 
    
    //Access the URL
    this.getURL(); 

    //Dismiss pop-up
    if(Grubhub_Page.popup1.isDisplayed() ){
      Grubhub_Page.popup1.click();
    }
    else if(Grubhub_Page.popup.isDisplayed() ){
      Grubhub_Page.popup.click();
    }
    else {

    }

  });


  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });


it("Assert default sorting displayed",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();

    //Wait for an element and Click on default dropdown
    util.waitClick(Grubhub_Page.Dropdown);

    //Assert default dropdown
    util.textMatch(Grubhub_Page.Dropdown,'Default\nRating\nDistance\nDelivery Estimate\nDelivery Minimum\nDelivery Fee');
   
})


it("Printing all name, time ,rating and cost",() =>{

   //Search New York, NY in search bar
   Grubhub_Page.Search.click().sendKeys("New York, NY");

   //Click on FindFood
   Grubhub_Page.FindFood.click();

   //Wait for execution
   util.wait(Grubhub_Page.Restaurant);

   //Get text of all restaurant
   Grubhub_Page.filter_result.getText().then(data =>{
   //browser.sleep(3000);

   //Wait for execution
   util.wait(Grubhub_Page.filter_result);


   //Print text of all restaurant
   console.log("All name, time ,rating and cost:\n"+data);

})
})

it("Sort Rating and print it and assert it",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Search New York, NY in search bar
    Grubhub_Page.FindFood.click();   
   
    //Wait for an element and Click on Rating in the dropdown
    util.waitClick(Grubhub_Page.Rating);

    //Get text of all restaurant
    Grubhub_Page.Restaurant.getText().then(data =>{
     
    //Print text of all restaurant
    console.log("Sort Rating and print it:\n"+data);

 })

})


it("Print and assert all resturant with free Delivery shown",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();    

    //Wait for an element and Click on free delivery checkbox
    util.waitClick(Grubhub_Page.check_FreeDelivery);

    //Get text of all restaurant
    Grubhub_Page.Restaurant.getText().then(data =>{

    //Print text of all restaurant
    console.log("All restaurant with Free Delivery:\n"+data);

    //Assert Free Delivery
    util.textMatch(Grubhub_Page.free_delivery_assert,'Free delivery');
    
})
})

it("Print all the cusines shown",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();    

    //Wait for execution
    util.wait(Grubhub_Page.Cuisine);

    //Get text of all restaurant
    Grubhub_Page.Cuisine.getText().then(data =>{

    //Print text of all restaurant
    console.log("All the cusines shown"+data);
})
    
})

it("Print and assert all the restaurant with less than 45 min is shown",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();    

    //Wait for an element and Click on 45min and less in slider
    util.waitClick(Grubhub_Page.slider);

    //Get text of all restaurant
    Grubhub_Page.filter_result.getText().then(data =>{

    //Print text of all restaurant
    console.log("All the resturent with less than 45 min is shown\n"+data);

    //Assert the resturant on applying less than or equal to 45 min slider
    expect(Grubhub_Page.lessTime.getText()).toBeLessThanOrEqual('30-45');

})  
 
})

it("Assert and print Catering Section",() =>{

    //Search New York, NY in search bar
    Grubhub_Page.Search.click().sendKeys("New York, NY");

    //Click on FindFood
    Grubhub_Page.FindFood.click();

    //Click on Catering section
    util.waitClick(Grubhub_Page.Catering);

    //Click on later
    util.waitClick(Grubhub_Page.Later);
    
    //Current date
    let today = new Date();
    let dd = String(today.getDate() + 5);
    let mm = String(today.getMonth() + 2); //January is 0!
    let yyyy = today.getFullYear();
    
    today = dd + '-' + mm + '-' + yyyy;
    
    this.currentdate= element(by.id("datepicker-"+today+""));

    //Schedule it to 5 days ahead of current day 
    this.currentdate.click();

    //Select time as 7pm
    Grubhub_Page.time.click().sendKeys("7:00pm");

    //Click on deliver
    Grubhub_Page.Deliver.click();

    //Current date and time in a perticular format
    let objToday = new Date(),
	  weekday = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'),
	  dayOfWeek = weekday[objToday.getDay() + 5],
	  dayOfMonth = String(objToday.getDate() + 5).padStart(2, '0'),
	  months = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'),
	  curMonth = months[(objToday.getMonth())];

    let today1= dayOfWeek +" "+ curMonth +" "+ dayOfMonth;

    //Assert scheduled date and time
    util.textMatch(Grubhub_Page.assert_date_time,""+today1+" 7:00pm");

    //Enter 5 attendees
    for (i = 0; i < 5; i++) { 
    Grubhub_Page.attendees.click();
    }

    //Check packaged
    Grubhub_Page.Check_packaged.click();
    
    //Store the restaurant ratings in an array
    Grubhub_Page.Print_rating.then(function (arr) {
    let promises = [];
    for (let i = 0; i < arr.length; i++) {
        promises.push(arr[i].getText());
    }

    //Print the total no of restaurants
    Q.all(promises).done(function (result) {             
    console.log("Total no of restaurants:\n"+result.length);

    let data = [];
    for (let i = 0; i < result.length; ++i) {

    //Seprate the integers and strings
    let myArray = result[i].split(/([0-9]+)/);

    
    //Storing only the integers
    data.push(myArray[1]);
    }

    //Clicking on the highest rating restaurant and printing its details
    Q.all(data).done(function (result) {
    console.log("Before Sorting:"+result);
    let ans= result.sort(function(a, b){return a-b});
    console.log("After Sorting Sorting:"+ans);
    console.log("Highest Rating:"+ans.slice(-1).pop());
         
    //Locating the highest rating restaurant
    this.HigherRank= element(by.xpath("//span[contains(text(),'"+ans.slice(-1).pop()+"')]"));

    //Clicking on highest rating restaurant
    this.HigherRank.click();

    //Wait for execution
    util.wait(Grubhub_Page.Details_Highestrating);

    Grubhub_Page.Details_Highestrating.getText().then(data =>{

    //Print details of highest rating restaurant restaurant
    console.log("\nDetails of highest rating restaurant:\n"+data);
    })
           
    });
  });
});

    //Wait for execution
    browser.sleep(10000);

    //Store the menu item Prices in an array
    Grubhub_Page.Highest_price_menu.then(function (arr1) {
    let promises1 = [];
    for (let i = 0; i < arr1.length; i++) {
    promises1.push(arr1[i].getText());
    }

    //Print the total menu items
    Q.all(promises1).done(function (result) {                
    console.log("Total menu items:"+result.length);

    let data = [];
    let afterDecimal = [];
    for (let i = 0; i < result.length; ++i) {

    //Seprate the integers and special characters
    let myArray = result[i].split(/([0-9]+)/);
    
    //Storing only the integers
    data.push(myArray[1]);

    afterDecimal.push(myArray[3]);

    }

    //Clicking on the highest price menu item and printing its details
    Q.all(data).done(function (result) {
    console.log("Before Sorting:"+result);
    let ans= result.sort(function(a, b){return a-b});
    console.log("After Sorting Sorting:"+ans);

    //Clicking on the highest price menu item and printing its details
    Q.all(afterDecimal).done(function (result1) {
    console.log("Before Sorting:"+result1);
    let ans1= result1.sort(function(a, b){return a-b});
    console.log("After Sorting Sorting:"+ans1);

    console.log("Highest Rating:$"+ans.slice(-1).pop()+"."+ans1.slice(-1).pop());

    //locating the highest price menu item
    this.HigherPrice= element(by.xpath("//span[contains(text(),'$"+ans.slice(-1).pop()+"."+ans1.slice(-1).pop()+"')]"));


    //Wait for execution
    util.wait(this.HigherPrice);
  

    //Clicking on highest price menu item
    this.HigherPrice.click();
 
    //Wait for execution
    util.wait(Grubhub_Page.address);

    //Enter the address
    Grubhub_Page.address.click().sendKeys("550 1st Avenue, New York, NY").click();

    //Dismiss popup
    Grubhub_Page.popup.click();

    //Wait for execution
    util.wait(Grubhub_Page.Save);
    
    //Click on save
    Grubhub_Page.Save.click();

    //Wait for execution
    util.wait(Grubhub_Page.Choice_checkbox);

    //Select your choice
    Grubhub_Page.Choice_checkbox.click();
    

    //Provise Special instructions
    Grubhub_Page.Extra.click().sendKeys("Provide extra sauce");

    //Wait for execution
    util.wait(Grubhub_Page.Add_to_bag);

    //Add to bag
    Grubhub_Page.Add_to_bag.click();

    //Wait for execution
    util.wait(Grubhub_Page.Assert_cost);
 
    //Assert Same Cost in bag
    util.textMatch(Grubhub_Page.Assert_cost,'$'+ans.slice(-1).pop()+'.'+ans1.slice(-1).pop());
    
      });
    });
  });
});

})

})
