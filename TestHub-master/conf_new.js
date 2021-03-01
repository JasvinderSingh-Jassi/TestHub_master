var HtmlReporter = require('protractor-beautiful-reporter');


exports.config = {
    directConnect : true,

seleniumAddress: 'http://localhost:4444/wd/hub',

capabilities: {
    browserName: 'chrome',
    },

    framework: 'jasmine',



specs: ['Test Cases//XYZ_Bank_spec//*.js'],

allScriptsTimeout: 1000000,


onPrepare: function() {
    // Add a screenshot reporter and store screenshots to `/Reports/screenshots/images`:

    jasmine.getEnv().addReporter(new HtmlReporter( {

       baseDirectory: 'Reports/screenshots',

       screenshotsSubfolder: 'images',

       jsonsSubfolder: 'jsons'

    }).getJasmine2Reporter());

 },

jasmineNodeOpts: { 
  defaultTimeOutInterval: 1000000
}
}
