Instacurate
===========

Turn your Twitter timeline into a personalised news site, in an instant. Fetches links from tweets (by username, hashtag or timeline) and displays them in a discovery friendly design.

Live at www.instacurate.com

Work in progress. Please [check the Issues tab to see open tasks](https://github.com/davidbauer/instacurate/issues)

I'm a journalist, not a programmer. If you add some magic to the code (and I encourage you to do so), please comment more extensively that you usually would. I need to learn and understand. This project is not so much about the final product, but about getting there. [Here's why](http://www.davidbauer.ch/2013/01/25/how-i-learnt-to-code-in-one-year/).

![Instacurate Demo](http://instacurate.com/img/demo.png)

Latest release notes
--------------------

API (working):

* `new TimeLine()` - will figure out if a Twitter user is logged in and show its timeline, if no user is logged in nothing happens
* `new TimeLine('@username')` - will show the timeline of another Twitter user

API (not working):

* `new TimeLine('query')` - should create a Timeline given a query
* `new TimeLine('list:...')` - should create a Timeline taking links of a twitter list of the logged in user

Tweaking the TimeLine: 

```js
var tl = new TimeLine();
tl.tweetsToFetch = 200; // nr of tweets it should load in the buffer
tl.minNrOfLinks = 12; // nr of links it should present in one cycle (initial load, scroll, auto-refresh)
tl.twitterMaxSearchApiRequests = 10; // rate limit of nr of twitter api requests for this timeline
tl.autoRefresh = true; // autoRefresh
tl.autoRefreshInterval = 60000; // refresh interval in milis
```

open TODOs:
[check the Issues tab to see all open tasks](https://github.com/davidbauer/instacurate/issues)

auto refreshing is currently wrongly implemented. it is just taking more items from the buffer, which is wrong, it should check the Twitter API for new tweets including new links. Moreover it won't give the user any feedback that it is refreshing (which the current master does)
implement the API (not working) todos, may need some changes on the app server
reimplement search
reimplement url-hash
reimplement warning-messages
the rendering-logic for the links can/should be further encapsulated.
further improve OOP, this is just a first attempt
