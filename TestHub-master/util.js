//declares the EC variable for using in expected conditions
let EC = protractor.ExpectedConditions;

'use strict';

let util = function() { 


   //function to wait for an element 

     this.wait = function(elem) { 

      browser.wait(EC.elementToBeClickable(elem), 30000).then(function()  {
 
       })
   };

   //function to wait for an element and click it

   this.waitClick = function(elem) { 

      browser.wait(EC.elementToBeClickable(elem), 20000).then(function()  {
 
         elem.click();
 
       })
   };



 //function to getText from an element and match it with the value

this.textMatch = function(elem,value) { 

      elem.getText().then(function(text) {

         expect(text).toContain(value);
         
         console.log(`${text} matched with ${value}`);
      });

};

   
   this.alltextMatch = function(elem,value) { 
      elem.then(function (arr) {

      for (let i = 0; i < arr.length; i++) {
          arr[i].getText().then(function(text) {

            expect(text).toEqual(value);
            
            console.log(`${text} matched with ${value}`);
         });
    
      }
    })


   }

   this.toBeLessalltextMatch = function(elem,value) { 
      elem.then(function (arr) {

      for (let i = 0; i < arr.length; i++) {
          arr[i].getText().then(function(text) {

            expect(text).toBeLessThanOrEqual(value);
            
            console.log(`${text} matched with ${value}`);
         });
    
      }
    })


   }
}

module.exports = new util();
