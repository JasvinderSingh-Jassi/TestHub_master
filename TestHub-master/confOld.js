// An example configuration file.
exports.config = {
  directConnect: true,

  // Capabilities to be passed to the webdriver instance.
  capabilities: {
    'browserName': 'firefox'
  },

  // Framework to use. Jasmine is recommended.
  framework: 'jasmine',

  // Spec patterns are relative to the current working directory when
  // protractor is called.
  //specs: ['..//testcases//XYZ Bank_HomePage_spec.js','..//testcases//XYZ Bank_Customer_Login_spec.js','..//testcases//XYZ Bank_Manager_Login_spec.js'],
  specs: ['Test Cases/*.js'],
  // Options to be passed to Jasmine.
  jasmineNodeOpts: {
    defaultTimeoutInterval: 1000000000
  }
};
