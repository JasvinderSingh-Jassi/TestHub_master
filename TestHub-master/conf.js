var HtmlReporter = require('protractor-beautiful-reporter');


exports.config = {
    directConnect : true,


capabilities: {
    browserName: 'firefox',
    },

    framework: 'jasmine',



specs: ['Test Cases/Course_Selection_HomePage_spec.js.js'],



allScriptsTimeout: 30000,


onPrepare: function() {

    //maximizes the window 

    browser.manage().window().maximize(); 

    // Add a screenshot reporter and store screenshots to `/Reports/screenshots/images`:

    jasmine.getEnv().addReporter(new HtmlReporter( {

       baseDirectory: 'Reports/screenshots',

       screenshotsSubfolder: 'images',

       jsonsSubfolder: 'jsons'

    }).getJasmine2Reporter());

 },

jasmineNodeOpts: { 
  defaultTimeOutInterval: 40000
}
}
