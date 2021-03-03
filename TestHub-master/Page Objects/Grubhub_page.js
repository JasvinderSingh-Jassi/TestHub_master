/**
 * Created by Jasvinder Singh on 2nd March 2021
 * Description - Assert various functionality in grubhub appliaction
 * 
 */

"use strict";
let Grubhub_Page = function() {

//Customize search on the basis of Street Address
this.Search= element(by.css("input[name='searchTerm']"));
this.FindFood= element(by.css('.s-btn'));

//Perform assertion on dropdown
this.Dropdown= element(by.id('ghs-select-sort'));
this.Restaurant= element(by.css('.searchResults-wrapper'));

//Assert for Rating
this.Rating=element(by.cssContainingText('option', 'Rating'));
this.Filtered_Restaurant=element.all(by.css('.restaurant-card'));

//Assert for Free Delivery
this.check_FreeDelivery=element(by.css("span[data-value='Free Delivery']"));

//Select all cuisine
this.Cuisine= element(by.id('cuisineFilterContainer'));

//Assert on resturant with less than 45min 
this.slider= element(by.css("li[class='clickable minLimit']"));
this.assert_Restaurant= element(by.css('.u-flex u-flex-align-xs--baseline'));

//Assert restaurants
this.Assert_Resturant_Search= element(by.css("div[class='caption u-stack-y-0 u-text-secondary s-hidden-xs total-items']"));
};


//exporting the variables
module.exports = new Grubhub_Page();