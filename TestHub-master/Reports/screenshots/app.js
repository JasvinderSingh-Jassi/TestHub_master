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
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\001b0083-0044-00d0-0012-00f300e400f5.png",
        "timestamp": 1615211093289,
        "duration": 4556
    },
    {
        "description": "Functionality of Customer Transaction|Functionality of XYZ Bank Customer login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\00e1007f-00c7-00ca-001d-00ed009f0007.png",
        "timestamp": 1615211098404,
        "duration": 2037
    },
    {
        "description": "Functionality of Customer Deposit|Functionality of XYZ Bank Customer login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\00e400d0-00ae-00b8-0025-00ea00d400bc.png",
        "timestamp": 1615211100765,
        "duration": 2607
    },
    {
        "description": "Functionality of Customer Deposit|Functionality of XYZ Bank Customer login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\007a00eb-00b6-00f9-00b9-00d100f80057.png",
        "timestamp": 1615211103729,
        "duration": 2594
    },
    {
        "description": "click Home Page|XYZ Bank Home Page",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [],
        "screenShotFile": "images\\009b00d6-0027-009d-00f1-002b00d80003.png",
        "timestamp": 1615211106677,
        "duration": 1805
    },
    {
        "description": "Manager Login Page|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00630088-004c-0037-00ce-00a100fa0047.png",
        "timestamp": 1615211108798,
        "duration": 1263
    },
    {
        "description": "AddCustomer section|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00b900dc-00d4-00a9-0029-003800b40041.png",
        "timestamp": 1615211110379,
        "duration": 1927
    },
    {
        "description": "OpenAccount section|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\001e00bc-0017-0052-008b-0022001400bb.png",
        "timestamp": 1615211112739,
        "duration": 2266
    },
    {
        "description": "Customers section|click XYZ Bank Manager login",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [],
        "screenShotFile": "images\\00eb00e2-0012-00af-00a6-00c50087004a.png",
        "timestamp": 1615211115334,
        "duration": 1762
    },
    {
        "description": "Assert default sorting displayed|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1615211119835,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211123890,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1615211132766,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://client.perimeterx.net/PXO97ybH4J/main.min.js 2 SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021. See https://developer.chrome.com/blog/enabling-shared-array-buffer/ for more details.",
                "timestamp": 1615211133893,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1615211137878,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211137981,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211138088,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/search?orderMethod=delivery&locationMode=DELIVERY&facetSet=umamiV2&pageSize=20&hideHateos=true&searchMetrics=true&latitude=40.71277618&longitude=-74.00597382&geohash=dr5regw3pgd3&facet=open_now%3Atrue&sortSetId=umamiv3&countOmittingTimes=true&includeOffers=true&sponsoredSize=3 - Site cannot be installed: Page does not work offline. Starting in Chrome 93, the installability criteria is changing, and this site will not be installable. See https://goo.gle/improved-pwa-offline-detection for more information.",
                "timestamp": 1615211138932,
                "type": ""
            }
        ],
        "screenShotFile": "images\\001400e9-001e-00c6-0003-004d00020026.png",
        "timestamp": 1615211117470,
        "duration": 21813
    },
    {
        "description": "Printing all name, time ,rating and cost|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1615211140566,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211141792,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1615211146150,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ - Site cannot be installed: Page does not work offline. Starting in Chrome 93, the installability criteria is changing, and this site will not be installable. See https://goo.gle/improved-pwa-offline-detection for more information.",
                "timestamp": 1615211146156,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://client.perimeterx.net/PXO97ybH4J/main.min.js 2 SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021. See https://developer.chrome.com/blog/enabling-shared-array-buffer/ for more details.",
                "timestamp": 1615211147463,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1615211147673,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211150609,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211150727,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211151600,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00720067-005b-0056-00df-00e700b40095.png",
        "timestamp": 1615211139843,
        "duration": 16589
    },
    {
        "description": "Sort Rating and print it and assert it|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1615211157792,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211161167,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1615211165544,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ - Site cannot be installed: Page does not work offline. Starting in Chrome 93, the installability criteria is changing, and this site will not be installable. See https://goo.gle/improved-pwa-offline-detection for more information.",
                "timestamp": 1615211165577,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1615211165873,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211173392,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211173451,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211174053,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://client.perimeterx.net/PXO97ybH4J/main.min.js 2 SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021. See https://developer.chrome.com/blog/enabling-shared-array-buffer/ for more details.",
                "timestamp": 1615211174109,
                "type": ""
            }
        ],
        "screenShotFile": "images\\002b0050-003c-00c0-004f-006700e1007e.png",
        "timestamp": 1615211156918,
        "duration": 20487
    },
    {
        "description": "Print and assert all resturant with free Delivery shown|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211178683,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211179484,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1615211180752,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211182111,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1615211184752,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ - Site cannot be installed: Page does not work offline. Starting in Chrome 93, the installability criteria is changing, and this site will not be installable. See https://goo.gle/improved-pwa-offline-detection for more information.",
                "timestamp": 1615211184768,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1615211185295,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://client.perimeterx.net/PXO97ybH4J/main.min.js 2 SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021. See https://developer.chrome.com/blog/enabling-shared-array-buffer/ for more details.",
                "timestamp": 1615211187875,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211187984,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211188044,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211188520,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211193643,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211194449,
                "type": ""
            }
        ],
        "screenShotFile": "images\\008f0046-008b-0060-0007-008a00bc00b4.png",
        "timestamp": 1615211180027,
        "duration": 15285
    },
    {
        "description": "Print all the cusines shown|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1615211196604,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211199004,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1615211200646,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ - Site cannot be installed: Page does not work offline. Starting in Chrome 93, the installability criteria is changing, and this site will not be installable. See https://goo.gle/improved-pwa-offline-detection for more information.",
                "timestamp": 1615211200659,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1615211201104,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://client.perimeterx.net/PXO97ybH4J/main.min.js 2 SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021. See https://developer.chrome.com/blog/enabling-shared-array-buffer/ for more details.",
                "timestamp": 1615211203836,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211203917,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211204006,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211204647,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00c200bf-00d5-008f-0032-000e00f100f2.png",
        "timestamp": 1615211195788,
        "duration": 10470
    },
    {
        "description": "Print and assert all the restaurant with less than 45 min is shown|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1615211207419,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211208351,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1615211211350,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://client.perimeterx.net/PXO97ybH4J/main.min.js 2 SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021. See https://developer.chrome.com/blog/enabling-shared-array-buffer/ for more details.",
                "timestamp": 1615211212246,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1615211212321,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/search?orderMethod=delivery&locationMode=DELIVERY&facetSet=umamiV2&pageSize=20&hideHateos=true&searchMetrics=true&latitude=40.71277618&longitude=-74.00597382&geohash=dr5regw3pgd3&facet=open_now%3Atrue&sortSetId=umamiv3&countOmittingTimes=true - Site cannot be installed: Page does not work offline. Starting in Chrome 93, the installability criteria is changing, and this site will not be installable. See https://goo.gle/improved-pwa-offline-detection for more information.",
                "timestamp": 1615211212343,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211214164,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211214291,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211214700,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211219579,
                "type": ""
            }
        ],
        "screenShotFile": "images\\0002007c-0032-0042-0092-006900b30016.png",
        "timestamp": 1615211206738,
        "duration": 13136
    },
    {
        "description": "Assert and print Catering Section|Assert Grubhub application",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211219928,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ 43:24 TypeError: Cannot read property 'email' of null\n    at https://www.grubhub.com/:41:78\n    at https://www.grubhub.com/:103:11",
                "timestamp": 1615211221236,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211222202,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://assets.grubhub.com/manifest.json - Manifest: property 'scope' ignored. Start url should be within scope of scope URL.",
                "timestamp": 1615211228377,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.grubhub.com/ - Site cannot be installed: Page does not work offline. Starting in Chrome 93, the installability criteria is changing, and this site will not be installable. See https://goo.gle/improved-pwa-offline-detection for more information.",
                "timestamp": 1615211228419,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"[Facebook Pixel] - Removed URL query parameters due to potential violations.\"",
                "timestamp": 1615211228842,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://client.perimeterx.net/PXO97ybH4J/main.min.js 2 SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021. See https://developer.chrome.com/blog/enabling-shared-array-buffer/ for more details.",
                "timestamp": 1615211229667,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211231589,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211231701,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211232084,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211235661,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211236036,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://api-gtm.grubhub.com/clickstream/events?appVersion=4.2.1792 - Failed to load resource: the server responded with a status of 422 ()",
                "timestamp": 1615211238897,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.grubhub.com/search/catering?orderMethod=delivery&locationMode=DELIVERY&facetSet=umamiV2&pageSize=20&hideHateos=true&searchMetrics=true&latitude=40.71277618&longitude=-74.00597382&geohash=dr5regw3pgd3&facet=order_type%3Acatering&includeOffers=true&sortSetId=umamiv3&sponsoredSize=3&countOmittingTimes=true 0:0 ",
                "timestamp": 1615211238978,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211241009,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211241403,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211241609,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211250383,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211250385,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 TypeError: Cannot read property 'ud_id' of undefined\n    at https://assets.grubhub.com/js/main-a7aff15bb37840bb9d2e.js:1:300687\n    at nrWrapper (https://www.grubhub.com/:19:26228)",
                "timestamp": 1615211250392,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://cdn.ravenjs.com/3.26.4/raven.min.js 1:1267 \"Reddit Pixel Warning:pixel has already been initialized\"",
                "timestamp": 1615211258687,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://ct.pinterest.com/v3/?tid=2620392384749 - Failed to load resource: net::ERR_SSL_PROTOCOL_ERROR",
                "timestamp": 1615211259194,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00f70033-0062-006d-00b0-009300950060.png",
        "timestamp": 1615211220534,
        "duration": 47507
    },
    {
        "description": "Assert home page Journey Details|Assert and functionality check of Journey Details",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211272060,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_REFUSED",
                "timestamp": 1615211299466,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00b40099-0029-00d1-008b-004700dc00a1.png",
        "timestamp": 1615211268467,
        "duration": 31234
    },
    {
        "description": "Assert home page navigation bar|Assert and functionality check of navigation bar",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211301444,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_REFUSED",
                "timestamp": 1615211327339,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00600082-003f-00f8-00a8-00c0002f0056.png",
        "timestamp": 1615211300267,
        "duration": 27474
    },
    {
        "description": "Functionality of home page navigation bar|Assert and functionality check of navigation bar",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211329843,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1615211356050,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://adservice.google.com/ddm/fls/z/src=10076713;dc_pre=CMXn2JjroO8CFdfSlgodk6wFcg;type=visits;cat=kplus000;dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;tfua=;npa=;gdpr=$%7BGDPR%7D;gdpr_consent=$%7BGDPR_CONSENT_755%7D;ord=7880131517970.279 - Failed to load resource: net::ERR_CONNECTION_CLOSED",
                "timestamp": 1615211357245,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211358066,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_TIMED_OUT",
                "timestamp": 1615211361778,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211367863,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://delta-www.baynote.net/baynote/tags3/common?customerId=delta&code=www&timeout=undefined&onFailure=undefined - Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
                "timestamp": 1615211370208,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_REFUSED",
                "timestamp": 1615211383939,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211386117,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211392202,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_REFUSED",
                "timestamp": 1615211418216,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211420065,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://gum.criteo.com/sync?c=327&a=1&r=1&u=https://pulse.delta.com/pc/delta/%3Fcw_criteoid%3D%40USERID%40 - Failed to load resource: net::ERR_CONNECTION_REFUSED",
                "timestamp": 1615211445546,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00f50048-0020-00cd-0045-006800f900f4.png",
        "timestamp": 1615211328313,
        "duration": 118993
    },
    {
        "description": "Assert home page navigation bar|Assert Course selection home Page",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed.",
        "trace": "",
        "browserLogs": [
            {
                "level": "WARNING",
                "message": "https://www.delta.com/resources/a833554b9d63120c0d0265eb98f27f913a30d77a1d98e 16 Synchronous XMLHttpRequest on the main thread is deprecated because of its detrimental effects to the end user's experience. For more help, check https://xhr.spec.whatwg.org/.",
                "timestamp": 1615211449040,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://delta-www.baynote.net/baynote/tags3/common?customerId=delta&code=www&timeout=undefined&onFailure=undefined - Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
                "timestamp": 1615211450471,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/visits - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211456300,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00b90070-0010-0074-0076-001100880064.png",
        "timestamp": 1615211450755,
        "duration": 21804
    },
    {
        "description": "functionality of home page navigation bar|Assert Course selection home Page",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211475158,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211476313,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211489416,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211489417,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211495179,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/sign_in - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211495181,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sso.teachable.com/ahoy/visits - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211495523,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211500219,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211500252,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211500253,
                "type": ""
            }
        ],
        "screenShotFile": "images\\005e0027-00ef-00e2-00b7-0094005400f8.png",
        "timestamp": 1615211473060,
        "duration": 27984
    },
    {
        "description": "Print course details|Assert Course selection",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211501596,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/sign_up - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211501969,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://sso.teachable.com/secure/673/users/sign_up?reset_purchase_session=1 - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211502126,
                "type": ""
            },
            {
                "level": "WARNING",
                "message": "deprecation 3 'window.webkitStorageInfo' is deprecated. Please use 'navigator.webkitTemporaryStorage' or 'navigator.webkitPersistentStorage' instead.",
                "timestamp": 1615211512500,
                "type": ""
            }
        ],
        "screenShotFile": "images\\00c000cd-00a7-0048-00d3-004300a300e0.png",
        "timestamp": 1615211501683,
        "duration": 30935
    },
    {
        "description": "Print author name in dropdown|Assert Course selection",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211534608,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211534609,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211534609,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211534610,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211540425,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211540425,
                "type": ""
            }
        ],
        "screenShotFile": "images\\002c0071-0097-00aa-0046-00ce00e8005b.png",
        "timestamp": 1615211532973,
        "duration": 12543
    },
    {
        "description": "Assert all courses by searching protractor|Assert Course selection",
        "passed": true,
        "pending": false,
        "os": "Windows",
        "instanceId": 18076,
        "browser": {
            "name": "chrome",
            "version": "89.0.4389.82"
        },
        "message": "Passed",
        "browserLogs": [
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211547363,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211547363,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211547456,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211547685,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211547686,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211547695,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211552950,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211552950,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211563214,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211568279,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211578537,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211583650,
                "type": ""
            },
            {
                "level": "SEVERE",
                "message": "https://www.selenium-tutorial.com/ahoy/events - Failed to load resource: the server responded with a status of 403 ()",
                "timestamp": 1615211593926,
                "type": ""
            }
        ],
        "screenShotFile": "images\\009b0067-0019-003c-006e-003000790013.png",
        "timestamp": 1615211545969,
        "duration": 47950
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
