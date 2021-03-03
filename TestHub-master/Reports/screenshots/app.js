var app = angular.module('reportingApp', []);

//<editor-fold desc="global helpers">

var isValueAnArray = function (val) {
    return Array.isArray(val);
};

var getSpec = function (str) {
    var describes = str.split('|');
    return describes[describes.length - 1];
};
var checkIfShouldDisplaySpecName = function (prevItem, item) {
    if (!prevItem) {
        item.displaySpecName = true;
    } else if (getSpec(item.description) !== getSpec(prevItem.description)) {
        item.displaySpecName = true;
    }
};

var getParent = function (str) {
    var arr = str.split('|');
    str = "";
    for (var i = arr.length - 2; i > 0; i--) {
        str += arr[i] + " > ";
    }
    return str.slice(0, -3);
};

var getShortDescription = function (str) {
    return str.split('|')[0];
};

var countLogMessages = function (item) {
    if ((!item.logWarnings || !item.logErrors) && item.browserLogs && item.browserLogs.length > 0) {
        item.logWarnings = 0;
        item.logErrors = 0;
        for (var logNumber = 0; logNumber < item.browserLogs.length; logNumber++) {
            var logEntry = item.browserLogs[logNumber];
            if (logEntry.level === 'SEVERE') {
                item.logErrors++;
            }
            if (logEntry.level === 'WARNING') {
                item.logWarnings++;
            }
        }
    }
};

var convertTimestamp = function (timestamp) {
    var d = new Date(timestamp),
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2),
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 2013-02-18, 8:35 AM
    time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;

    return time;
};

var defaultSortFunction = function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) {
        return -1;
    } else if (a.sessionId > b.sessionId) {
        return 1;
    }

    if (a.timestamp < b.timestamp) {
        return -1;
    } else if (a.timestamp > b.timestamp) {
        return 1;
    }

    return 0;
};

//</editor-fold>

app.controller('ScreenshotReportController', ['$scope', '$http', 'TitleService', function ($scope, $http, titleService) {
    var that = this;
    var clientDefaults = {};

    $scope.searchSettings = Object.assign({
        description: '',
        allselected: true,
        passed: true,
        failed: true,
        pending: true,
        withLog: true
    }, clientDefaults.searchSettings || {}); // enable customisation of search settings on first page hit

    this.warningTime = 1400;
    this.dangerTime = 1900;
    this.totalDurationFormat = clientDefaults.totalDurationFormat;
    this.showTotalDurationIn = clientDefaults.showTotalDurationIn;

    var initialColumnSettings = clientDefaults.columnSettings; // enable customisation of visible columns on first page hit
    if (initialColumnSettings) {
        if (initialColumnSettings.displayTime !== undefined) {
            // initial settings have be inverted because the html bindings are inverted (e.g. !ctrl.displayTime)
            this.displayTime = !initialColumnSettings.displayTime;
        }
        if (initialColumnSettings.displayBrowser !== undefined) {
            this.displayBrowser = !initialColumnSettings.displayBrowser; // same as above
        }
        if (initialColumnSettings.displaySessionId !== undefined) {
            this.displaySessionId = !initialColumnSettings.displaySessionId; // same as above
        }
        if (initialColumnSettings.displayOS !== undefined) {
            this.displayOS = !initialColumnSettings.displayOS; // same as above
        }
        if (initialColumnSettings.inlineScreenshots !== undefined) {
            this.inlineScreenshots = initialColumnSettings.inlineScreenshots; // this setting does not have to be inverted
        } else {
            this.inlineScreenshots = false;
        }
        if (initialColumnSettings.warningTime) {
            this.warningTime = initialColumnSettings.warningTime;
        }
        if (initialColumnSettings.dangerTime) {
            this.dangerTime = initialColumnSettings.dangerTime;
        }
    }


    this.chooseAllTypes = function () {
        var value = true;
        $scope.searchSettings.allselected = !$scope.searchSettings.allselected;
        if (!$scope.searchSettings.allselected) {
            value = false;
        }

        $scope.searchSettings.passed = value;
        $scope.searchSettings.failed = value;
        $scope.searchSettings.pending = value;
        $scope.searchSettings.withLog = value;
    };

    this.isValueAnArray = function (val) {
        return isValueAnArray(val);
    };

    this.getParent = function (str) {
        return getParent(str);
    };

    this.getSpec = function (str) {
        return getSpec(str);
    };

    this.getShortDescription = function (str) {
        return getShortDescription(str);
    };
    this.hasNextScreenshot = function (index) {
        var old = index;
        return old !== this.getNextScreenshotIdx(index);
    };

    this.hasPreviousScreenshot = function (index) {
        var old = index;
        return old !== this.getPreviousScreenshotIdx(index);
    };
    this.getNextScreenshotIdx = function (index) {
        var next = index;
        var hit = false;
        while (next + 2 < this.results.length) {
            next++;
            if (this.results[next].screenShotFile && !this.results[next].pending) {
                hit = true;
                break;
            }
        }
        return hit ? next : index;
    };

    this.getPreviousScreenshotIdx = function (index) {
        var prev = index;
        var hit = false;
        while (prev > 0) {
            prev--;
            if (this.results[prev].screenShotFile && !this.results[prev].pending) {
                hit = true;
                break;
            }
        }
        return hit ? prev : index;
    };

    this.convertTimestamp = convertTimestamp;


    this.round = function (number, roundVal) {
        return (parseFloat(number) / 1000).toFixed(roundVal);
    };


    this.passCount = function () {
        var passCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.passed) {
                passCount++;
            }
        }
        return passCount;
    };


    this.pendingCount = function () {
        var pendingCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.pending) {
                pendingCount++;
            }
        }
        return pendingCount;
    };

    this.failCount = function () {
        var failCount = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (!result.passed && !result.pending) {
                failCount++;
            }
        }
        return failCount;
    };

    this.totalDuration = function () {
        var sum = 0;
        for (var i in this.results) {
            var result = this.results[i];
            if (result.duration) {
                sum += result.duration;
            }
        }
        return sum;
    };

    this.passPerc = function () {
        return (this.passCount() / this.totalCount()) * 100;
    };
    this.pendingPerc = function () {
        return (this.pendingCount() / this.totalCount()) * 100;
    };
    this.failPerc = function () {
        return (this.failCount() / this.totalCount()) * 100;
    };
    this.totalCount = function () {
        return this.passCount() + this.failCount() + this.pendingCount();
    };


    var results = [
    {
        "description": "Functionality of Customer_Login|Functionality of XYZ Bank Customer login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\00ff00d2-009e-00ce-002b-00b8006800b6.png",
        "timestamp": 1614767300739,
        "duration": 6567
    },
    {
        "description": "Functionality of Customer Transaction|Functionality of XYZ Bank Customer login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\00bc00ef-0046-008e-00b4-004400f30021.png",
        "timestamp": 1614767308151,
        "duration": 2964
    },
    {
        "description": "Functionality of Customer Deposit|Functionality of XYZ Bank Customer login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\00ca00d1-007e-0033-0056-004300b000c2.png",
        "timestamp": 1614767311511,
        "duration": 2550
    },
    {
        "description": "Functionality of Customer Deposit|Functionality of XYZ Bank Customer login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\009c00fe-0033-001f-00cb-003e00ff00a1.png",
        "timestamp": 1614767314467,
        "duration": 3282
    },
    {
        "description": "click Home Page|XYZ Bank Home Page",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\0023007d-0067-0093-00fa-007000bb00bd.png",
        "timestamp": 1614767318115,
        "duration": 2205
    },
    {
        "description": "Manager Login Page|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\001400e7-0014-0045-009e-00d6007400e5.png",
        "timestamp": 1614767320696,
        "duration": 1651
    },
    {
        "description": "AddCustomer section|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\005400cb-00be-0013-0094-005800f10030.png",
        "timestamp": 1614767322712,
        "duration": 2506
    },
    {
        "description": "OpenAccount section|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00bb0066-00bf-0092-0066-0074008700ec.png",
        "timestamp": 1614767325700,
        "duration": 2819
    },
    {
        "description": "Customers section|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\008e0003-00d1-0000-00c5-0005009000dc.png",
        "timestamp": 1614767328920,
        "duration": 2548
    },
    {
        "description": "Assert default sorting displayed|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767333889,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767339213,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767352781,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767354436,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767360496,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767360608,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767361581,
                "type": ""
            }
        ],
        "screenShotFile": "images\\009a002d-0094-00ac-00f5-0087009000ed.png",
        "timestamp": 1614767332233,
        "duration": 37862
    },
    {
        "description": "Assert on selecting Rating|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767371261,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767373875,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://match.adsrvr.org/track/cmf/generic?ttd_pid=liveramp&ttd_tpi=1 - Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
                "timestamp": 1614767388836,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767388940,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767389455,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767391812,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767391975,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767398143,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767408297,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00cc00b6-00c0-00c7-0018-002200f800d0.png",
        "timestamp": 1614767370629,
        "duration": 37663
    },
    {
        "description": "Printing all name, time ,rating and cost|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767409392,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1614767413236,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://usermatch.krxd.net/um/v2?partner=liveramp - Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
                "timestamp": 1614767423894,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767430175,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767433250,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767433340,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767438985,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00ee009d-007d-00ec-0087-002600c400c5.png",
        "timestamp": 1614767408780,
        "duration": 30197
    },
    {
        "description": "Sort Rating and print it|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767440394,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767449115,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://loadm.exelator.com/load/?p=204&g=450&rluid=849dcbb24b2ac92768b250bf2c6120f1fa26782dfaa2a0e71a113458ca9bd6c2f2fc7f7248dfd545&j=0 - Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
                "timestamp": 1614767454721,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sync-tm.everesttech.net/upi/pid/w8wqx7f2?redir=https%3A%2F%2Fidsync.rlcdn.com%2F367148.gif%3Fserved_by%3Devergreen%26partner_uid%3D%24%7BTM_USER_ID%7D - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1614767463996,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767464340,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767465598,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767467514,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767467623,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767468138,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767473873,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767473902,
                "type": ""
            }
        ],
        "screenShotFile": "images\\004b00a0-007a-00f9-00c9-004d00ab0047.png",
        "timestamp": 1614767439687,
        "duration": 39420
    },
    {
        "description": "Assert all resturant with free Delivery shown|Assert Grubhub application",
        "passed": false,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": [
            "Expected '27 Restaurants' to equal '5 Restaurants'."
        ],
        "trace": [
            "Error: Failed expectation\n    at UserContext.<anonymous> (C:\\Users\\mindfire\\Documents\\TestHub-master\\Test Cases\\Grubhub_spec\\Grubhub_spec.js:153:60)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:112:25\n    at new ManagedPromise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:1077:7)\n    at ControlFlow.promise (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2505:12)\n    at schedulerExecute (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\jasminewd2\\index.js:95:18)\n    at TaskQueue.execute_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3084:14)\n    at TaskQueue.executeNext_ (C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:3067:27)\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:2974:25\n    at C:\\Users\\mindfire\\AppData\\Roaming\\npm\\node_modules\\protractor\\node_modules\\selenium-webdriver\\lib\\promise.js:668:7"
        ],
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767480569,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767481899,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767489629,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767489984,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767492366,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767492454,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767493030,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00030071-0023-0087-002e-006100d60041.png",
        "timestamp": 1614767479864,
        "duration": 14248
    },
    {
        "description": "Print all resturant with free Delivery shown|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767495397,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767495726,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767497061,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767506711,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767507238,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767510260,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767510339,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767510792,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767517262,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767517272,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00910055-0069-001a-00c0-006c007d007c.png",
        "timestamp": 1614767494938,
        "duration": 22317
    },
    {
        "description": "Print all the cusines shown|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767518481,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767520909,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767524624,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767524679,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767527084,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767527192,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767527682,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00a2000c-00f2-008c-0093-009e00240038.png",
        "timestamp": 1614767517816,
        "duration": 13977
    },
    {
        "description": " Assert all the resturent with less than 45 min is shown|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767532867,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767534065,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767537178,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767537576,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767539966,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767540083,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767540877,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767546519,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767546522,
                "type": ""
            }
        ],
        "screenShotFile": "images\\003d0026-00eb-007c-00f9-001f00e20007.png",
        "timestamp": 1614767532255,
        "duration": 14347
    },
    {
        "description": " Print all the resturent with less than 45 min is shown|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1614767548331,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767549323,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1614767550587,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1614767551147,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767554109,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767554210,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767554866,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1614767560950,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1614767560953,
                "type": ""
            }
        ],
        "screenShotFile": "images\\007800cb-0041-0029-005c-004a008b0042.png",
        "timestamp": 1614767547174,
        "duration": 19111
    },
    {
        "description": "Assert home page navigation bar|Assert Course selection home Page",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/visits - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767574225,
                "type": ""
            }
        ],
        "screenShotFile": "images\\007c006a-00e8-0011-00c1-0053000200c1.png",
        "timestamp": 1614767566850,
        "duration": 19109
    },
    {
        "description": "functionality of home page navigation bar|Assert Course selection home Page",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767589675,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767590794,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767604754,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767604754,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767606128,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/sign_in - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767611170,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sso.teachable.com/ahoy/visits - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767611171,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767615123,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767615668,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767615672,
                "type": ""
            }
        ],
        "screenShotFile": "images\\003a001a-00a9-004f-005d-009400d50081.png",
        "timestamp": 1614767586792,
        "duration": 29804
    },
    {
        "description": "Print course details|Assert Course selection",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767617345,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/sign_up - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767617613,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sso.teachable.com/secure/673/users/sign_up?reset_purchase_session=1 - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767618010,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "deprecation 3 'window.webkitStorageInfo' is deprecated. Please use 'navigator.webkitTemporaryStorage' or 'navigator.webkitPersistentStorage' instead.",
                "timestamp": 1614767628590,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628591,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628591,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628591,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628591,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628591,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Paint Timing. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628591,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Paint Timing. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628592,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628592,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628592,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628592,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628592,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: nextHopProtocol in Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628592,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://sso.teachable.com/cdn-cgi/challenge-platform/h/g/orchestrate/captcha/v1 0 chrome.loadTimes() is deprecated, instead use standardized API: Navigation Timing 2. https://www.chromestatus.com/features/5637885046816768.",
                "timestamp": 1614767628592,
                "type": ""
            }
        ],
        "screenShotFile": "images\\006d00ef-00f4-0094-0079-00c500a20083.png",
        "timestamp": 1614767617563,
        "duration": 31150
    },
    {
        "description": "Print author name in dropdown|Assert Course selection",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767651029,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767651030,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767651030,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767651031,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767652499,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767658773,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00cb003d-002b-0090-00e7-00dd00500094.png",
        "timestamp": 1614767649196,
        "duration": 14697
    },
    {
        "description": "Assert all courses by searching protractor|Assert Course selection",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767666145,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767666200,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767666309,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767666339,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767666420,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767666496,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767672210,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767672211,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767682777,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767687909,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767698316,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767703471,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1614767713857,
                "type": ""
            }
        ],
        "screenShotFile": "images\\002f00d8-0016-0083-00ba-0019007c009d.png",
        "timestamp": 1614767664528,
        "duration": 49324
    },
    {
        "description": "Assert home page Journey Details|Assert and functionality check of Journey Details",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767721441,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1614767753278,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00cf00f9-0094-00df-0057-003900c40041.png",
        "timestamp": 1614767714429,
        "duration": 39188
    },
    {
        "description": "Assert home page navigation bar|Assert and functionality check of navigation bar",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767755581,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_REFUSED",
                "timestamp": 1614767773476,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00480040-0059-0005-000a-00de00980076.png",
        "timestamp": 1614767754178,
        "duration": 19856
    },
    {
        "description": "Functionality of home page navigation bar|Assert and functionality check of navigation bar",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 25144,
        "browser": {
            "name": "chrome",
            "version": "88.0.4324.190"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767776233,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1614767778701,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767783183,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1614767799597,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767809530,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://delta-www.baynote.net/baynote/tags3/common?customerId=delta&code=www&timeout=undefined&onFailure=undefined - Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
                "timestamp": 1614767813949,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_REFUSED",
                "timestamp": 1614767833298,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767839867,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767847433,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://content.delta.com/content/dam/delta-applications/fresh-air-core/21.2.0/js/trackjs.js 143:79 \"AT:\" \"Failed actions\" Array(1)",
                "timestamp": 1614767854106,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1614767881650,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/bf34c6897a63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1614767890367,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://content.delta.com/content/dam/delta-applications/fresh-air-core/21.2.0/js/trackjs.js 143:79 \"AT:\" \"Failed actions\" Array(1)",
                "timestamp": 1614767905123,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1614767934908,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00cc0059-0059-0031-001a-009500c800a3.png",
        "timestamp": 1614767774997,
        "duration": 162646
    }
];

    this.sortSpecs = function () {
        this.results = results.sort(function sortFunction(a, b) {
    if (a.sessionId < b.sessionId) return -1;else if (a.sessionId > b.sessionId) return 1;

    if (a.timestamp < b.timestamp) return -1;else if (a.timestamp > b.timestamp) return 1;

    return 0;
});

    };

    this.setTitle = function () {
        var title = $('.report-title').text();
        titleService.setTitle(title);
    };

    // is run after all test data has been prepared/loaded
    this.afterLoadingJobs = function () {
        this.sortSpecs();
        this.setTitle();
    };

    this.loadResultsViaAjax = function () {

        $http({
            url: './combined.json',
            method: 'GET'
        }).then(function (response) {
                var data = null;
                if (response && response.data) {
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (response.data[0] === '"') { //detect super escaped file (from circular json)
                        data = CircularJSON.parse(response.data); //the file is escaped in a weird way (with circular json)
                    } else {
                        data = JSON.parse(response.data);
                    }
                }
                if (data) {
                    results = data;
                    that.afterLoadingJobs();
                }
            },
            function (error) {
                console.error(error);
            });
    };


    if (clientDefaults.useAjax) {
        this.loadResultsViaAjax();
    } else {
        this.afterLoadingJobs();
    }

}]);

app.filter('bySearchSettings', function () {
    return function (items, searchSettings) {
        var filtered = [];
        if (!items) {
            return filtered; // to avoid crashing in where results might be empty
        }
        var prevItem = null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.displaySpecName = false;

            var isHit = false; //is set to true if any of the search criteria matched
            countLogMessages(item); // modifies item contents

            var hasLog = searchSettings.withLog && item.browserLogs && item.browserLogs.length > 0;
            if (searchSettings.description === '' ||
                (item.description && item.description.toLowerCase().indexOf(searchSettings.description.toLowerCase()) > -1)) {

                if (searchSettings.passed && item.passed || hasLog) {
                    isHit = true;
                } else if (searchSettings.failed && !item.passed && !item.pending || hasLog) {
                    isHit = true;
                } else if (searchSettings.pending && item.pending || hasLog) {
                    isHit = true;
                }
            }
            if (isHit) {
                checkIfShouldDisplaySpecName(prevItem, item);

                filtered.push(item);
                prevItem = item;
            }
        }

        return filtered;
    };
});

//formats millseconds to h m s
app.filter('timeFormat', function () {
    return function (tr, fmt) {
        if(tr == null){
            return "NaN";
        }

        switch (fmt) {
            case 'h':
                var h = tr / 1000 / 60 / 60;
                return "".concat(h.toFixed(2)).concat("h");
            case 'm':
                var m = tr / 1000 / 60;
                return "".concat(m.toFixed(2)).concat("min");
            case 's' :
                var s = tr / 1000;
                return "".concat(s.toFixed(2)).concat("s");
            case 'hm':
            case 'h:m':
                var hmMt = tr / 1000 / 60;
                var hmHr = Math.trunc(hmMt / 60);
                var hmMr = hmMt - (hmHr * 60);
                if (fmt === 'h:m') {
                    return "".concat(hmHr).concat(":").concat(hmMr < 10 ? "0" : "").concat(Math.round(hmMr));
                }
                return "".concat(hmHr).concat("h ").concat(hmMr.toFixed(2)).concat("min");
            case 'hms':
            case 'h:m:s':
                var hmsS = tr / 1000;
                var hmsHr = Math.trunc(hmsS / 60 / 60);
                var hmsM = hmsS / 60;
                var hmsMr = Math.trunc(hmsM - hmsHr * 60);
                var hmsSo = hmsS - (hmsHr * 60 * 60) - (hmsMr*60);
                if (fmt === 'h:m:s') {
                    return "".concat(hmsHr).concat(":").concat(hmsMr < 10 ? "0" : "").concat(hmsMr).concat(":").concat(hmsSo < 10 ? "0" : "").concat(Math.round(hmsSo));
                }
                return "".concat(hmsHr).concat("h ").concat(hmsMr).concat("min ").concat(hmsSo.toFixed(2)).concat("s");
            case 'ms':
                var msS = tr / 1000;
                var msMr = Math.trunc(msS / 60);
                var msMs = msS - (msMr * 60);
                return "".concat(msMr).concat("min ").concat(msMs.toFixed(2)).concat("s");
        }

        return tr;
    };
});


function PbrStackModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;
    ctrl.convertTimestamp = convertTimestamp;
    ctrl.isValueAnArray = isValueAnArray;
    ctrl.toggleSmartStackTraceHighlight = function () {
        var inv = !ctrl.rootScope.showSmartStackTraceHighlight;
        ctrl.rootScope.showSmartStackTraceHighlight = inv;
    };
    ctrl.applySmartHighlight = function (line) {
        if ($rootScope.showSmartStackTraceHighlight) {
            if (line.indexOf('node_modules') > -1) {
                return 'greyout';
            }
            if (line.indexOf('  at ') === -1) {
                return '';
            }

            return 'highlight';
        }
        return '';
    };
}


app.component('pbrStackModal', {
    templateUrl: "pbr-stack-modal.html",
    bindings: {
        index: '=',
        data: '='
    },
    controller: PbrStackModalController
});

function PbrScreenshotModalController($scope, $rootScope) {
    var ctrl = this;
    ctrl.rootScope = $rootScope;
    ctrl.getParent = getParent;
    ctrl.getShortDescription = getShortDescription;

    /**
     * Updates which modal is selected.
     */
    this.updateSelectedModal = function (event, index) {
        var key = event.key; //try to use non-deprecated key first https://developer.mozilla.org/de/docs/Web/API/KeyboardEvent/keyCode
        if (key == null) {
            var keyMap = {
                37: 'ArrowLeft',
                39: 'ArrowRight'
            };
            key = keyMap[event.keyCode]; //fallback to keycode
        }
        if (key === "ArrowLeft" && this.hasPrevious) {
            this.showHideModal(index, this.previous);
        } else if (key === "ArrowRight" && this.hasNext) {
            this.showHideModal(index, this.next);
        }
    };

    /**
     * Hides the modal with the #oldIndex and shows the modal with the #newIndex.
     */
    this.showHideModal = function (oldIndex, newIndex) {
        const modalName = '#imageModal';
        $(modalName + oldIndex).modal("hide");
        $(modalName + newIndex).modal("show");
    };

}

app.component('pbrScreenshotModal', {
    templateUrl: "pbr-screenshot-modal.html",
    bindings: {
        index: '=',
        data: '=',
        next: '=',
        previous: '=',
        hasNext: '=',
        hasPrevious: '='
    },
    controller: PbrScreenshotModalController
});

app.factory('TitleService', ['$document', function ($document) {
    return {
        setTitle: function (title) {
            $document[0].title = title;
        }
    };
}]);


app.run(
    function ($rootScope, $templateCache) {
        //make sure this option is on by default
        $rootScope.showSmartStackTraceHighlight = true;
        
  $templateCache.put('pbr-screenshot-modal.html',
    '<div class="modal" id="imageModal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="imageModalLabel{{$ctrl.index}}" ng-keydown="$ctrl.updateSelectedModal($event,$ctrl.index)">\n' +
    '    <div class="modal-dialog modal-lg m-screenhot-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="imageModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="imageModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <img class="screenshotImage" ng-src="{{$ctrl.data.screenShotFile}}">\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <div class="pull-left">\n' +
    '                    <button ng-disabled="!$ctrl.hasPrevious" class="btn btn-default btn-previous" data-dismiss="modal"\n' +
    '                            data-toggle="modal" data-target="#imageModal{{$ctrl.previous}}">\n' +
    '                        Prev\n' +
    '                    </button>\n' +
    '                    <button ng-disabled="!$ctrl.hasNext" class="btn btn-default btn-next"\n' +
    '                            data-dismiss="modal" data-toggle="modal"\n' +
    '                            data-target="#imageModal{{$ctrl.next}}">\n' +
    '                        Next\n' +
    '                    </button>\n' +
    '                </div>\n' +
    '                <a class="btn btn-primary" href="{{$ctrl.data.screenShotFile}}" target="_blank">\n' +
    '                    Open Image in New Tab\n' +
    '                    <span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>\n' +
    '                </a>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

  $templateCache.put('pbr-stack-modal.html',
    '<div class="modal" id="modal{{$ctrl.index}}" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="stackModalLabel{{$ctrl.index}}">\n' +
    '    <div class="modal-dialog modal-lg m-stack-modal" role="document">\n' +
    '        <div class="modal-content">\n' +
    '            <div class="modal-header">\n' +
    '                <button type="button" class="close" data-dismiss="modal" aria-label="Close">\n' +
    '                    <span aria-hidden="true">&times;</span>\n' +
    '                </button>\n' +
    '                <h6 class="modal-title" id="stackModalLabelP{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getParent($ctrl.data.description)}}</h6>\n' +
    '                <h5 class="modal-title" id="stackModalLabel{{$ctrl.index}}">\n' +
    '                    {{$ctrl.getShortDescription($ctrl.data.description)}}</h5>\n' +
    '            </div>\n' +
    '            <div class="modal-body">\n' +
    '                <div ng-if="$ctrl.data.trace.length > 0">\n' +
    '                    <div ng-if="$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer" ng-repeat="trace in $ctrl.data.trace track by $index"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                    <div ng-if="!$ctrl.isValueAnArray($ctrl.data.trace)">\n' +
    '                        <pre class="logContainer"><div ng-class="$ctrl.applySmartHighlight(line)" ng-repeat="line in $ctrl.data.trace.split(\'\\n\') track by $index">{{line}}</div></pre>\n' +
    '                    </div>\n' +
    '                </div>\n' +
    '                <div ng-if="$ctrl.data.browserLogs.length > 0">\n' +
    '                    <h5 class="modal-title">\n' +
    '                        Browser logs:\n' +
    '                    </h5>\n' +
    '                    <pre class="logContainer"><div class="browserLogItem"\n' +
    '                                                   ng-repeat="logError in $ctrl.data.browserLogs track by $index"><div><span class="label browserLogLabel label-default"\n' +
    '                                                                                                                             ng-class="{\'label-danger\': logError.level===\'SEVERE\', \'label-warning\': logError.level===\'WARNING\'}">{{logError.level}}</span><span class="label label-default">{{$ctrl.convertTimestamp(logError.timestamp)}}</span><div ng-repeat="messageLine in logError.message.split(\'\\\\n\') track by $index">{{ messageLine }}</div></div></div></pre>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '            <div class="modal-footer">\n' +
    '                <button class="btn btn-default"\n' +
    '                        ng-class="{active: $ctrl.rootScope.showSmartStackTraceHighlight}"\n' +
    '                        ng-click="$ctrl.toggleSmartStackTraceHighlight()">\n' +
    '                    <span class="glyphicon glyphicon-education black"></span> Smart Stack Trace\n' +
    '                </button>\n' +
    '                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '</div>\n' +
     ''
  );

    });
