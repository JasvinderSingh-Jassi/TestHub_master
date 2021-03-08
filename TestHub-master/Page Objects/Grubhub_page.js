/**
 * Created by Jasvinder Singh on 8th March 2021
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
this.Assert_Resturant_Search= element(by.css('.total-items'));

//Free delivery 
this.filter_result= element.all(by.css("div[data-testid='restaurant-list']"));
this.free_delivery_assert= element.all(by.css("span[class='u-text-secondary u-text-success type caption']"));

//Delivery in less than 45min 
this.lessTime= element.all(by.css("span[class='value h5 u-block']"));

//Dismiss popup
this.popup1= element.all(by.css("a[data-chiri-id='fVQWT7FVuoRqEGId2uVFx']"));
this.popup= element.all(by.css("a[data-chiri-id='1TgR5shQPh1R1OjHQQQbcc']"));

//Catering Section
this.Catering= element(by.css('.u-margin-right-cancel'));

//Scheduling the delivery
this.Later= element(by.id('later'));
this.time= element(by.css('.ghs-whenFor-value'));
this.Deliver= element(by.css("[data-testid='apply-when-for']"));
this.assert_date_time= element(by.css("[data-testid='whenfor-launcher']"));

//Adding attendees
this.attendees= element(by.css("[data-testid='quantity-input-add']"));
this.Check_packaged= element(by.css("[data-value='Individually packaged']"));
this.star= element(by.css("[title='5 Only']"));

//Highest rating 
this.Highest_rating= element(by.css("[class='searchResult fadeIn u-line--light']"));
this.Print_rating= element.all(by.css("[class='u-flex u-flex-direction-column u-flex-align-xs--center']"));

//Selecting highest price menu
this.Highest_price_menu= element.all(by.css("[data-testid='menu-item-price']"));
this.address= element(by.css("[name='searchTerm3']"));
this.Save= element(by.css("[data-testid='change-cart-address-footer']")).element(by.tagName('span'));

//Providing extra choice
this.Choice= element(by.css('.s-radio-filler'));
this.Choice_checkbox= element.all(by.css('.s-checkbox-filler')).first();
this.Extra= element(by.id('specialInstructionsTextarea'));

//Adding to bag
this.Add_to_bag= element(by.css("[class='u-flex u-font-graphik']"));
this.Assert_cost= element(by.css('.lineItem-val'));
this.Delivery_button= element(by.css("[class='ghs-setChanges s-btn s-btn-primary ghs-applyWhenFor s-btn--block']"));
this.Details_Highestrating= element(by.css("[data-testid='restaurant-info-container']"));

};

//exporting the variables
module.exports = new Grubhub_Page();