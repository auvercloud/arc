AuverCloud Runtime Client
===
The AuverCloud Runtime Client a.k.a. _arc_ is a set of librairies for the client side part of the AuverCloud Studio content manager and API server. For further information and how-tos, please see [AuverCloud](https://www.auvercloud.com). 

Components of AuverCloud Runtime Client:

##css##
- _arc.css_: Default stylesheet for AuverCloud contents (e.g. text, menu, slideshow)
- _opensans.css_: Standalone Open Sans font definition. Not required for the client: Only for test.
- _opensans_ folder: Subset of Open Sans font definition (normal, italic, bold, italic-bold). The original font definition is on [Google font](http://www.google.com/fonts#UsePlace:use/Collection:Open+Sans). Open Sans font is part of this package as it is the only font available in the AuverCloud Studio that is not 100% web proof. 

##js##
- _arc.js_: JavaScript client for the AuverCloud API. It includes a cross-domain REST client based on jQuery Ajax client, a loader for AuverCloud contents and some utilities. _arc.js_ requires _jQuery 2.x_ and _Crypto.js_ librairies provided in the next folder.

##lib##
- _crypto.min.js_: This library is mainly used for hash coding. The source is this [Google project](https://code.google.com/p/crypto-js/).
- _jquery-2.x.x_: jQuery libraries tested with AuverCloud. See [jQuery](http://jquery.com/).

##min##
- _arc.min.js_: This is the minified version of the latest _jQuery_ lib, the _Crypto_ lib and _arc.js_. Recommended for production.

##php##
- _arc.php_: PHP client for the AuverCloud content server. It enables the integration of AuverCloud content in PHP pages as well as simple blogs and RSS streams.

The API test page is also a good way to understand how the API calls are done using the JavaScript client, especially the file _test.js_.
 
