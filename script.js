// Avoid `console` errors in browsers that lack a console
// https://github.com/h5bp/html5-boilerplate/blob/master/js/plugins.js
(function() {
    var method,
        noop = function() {},
        methods = [
            'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
            'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
            'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
            'timeStamp', 'trace', 'warn'
        ],
        length = methods.length,
        console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());

;(function(window, document, $, undefined) {
    "use strict"; // best practice

//display recent search terms
var searches = []; // create array to store search terms
displaySearches(searches);


// Setup an event listener for the form that will execute checkUser()
// when the form is submitted.
$(function() {
    // extract and decode hash
    var hash = decodeURIComponent(window.location.hash.substr(1)),
        field = document.tweetfinder.user;

    if (hash) {
	   if (hash[0] != '#') {
            // Do the user magic
            checkUser(hash);

        } else {
            // Do the search magic
            getLinks(hash);    
        }

        // Fill field
        field.value = hash;
    } 


    $('#searchform').submit(function(e) {
        // Stop the form from sending and reloading the page
        e.preventDefault();
        // clean up
        $('#bugfixing').html("");
        $('#embeds div').html("");
        $('.userinfo').html("");
        //reset search api request counter, max_id and link counter
        searchApiRequests = 0;
        searchApiMaxId = null;
        linksTotal = 0;

        // Get the articles from typed user
        var myInput = getInput();

        //proceed with either hashtag or username
        if (myInput[0] == '#') {
	        getLinks(myInput);
	         // Update URL
	         window.location.hash = "%23" + myInput.substring(1);
        }

        else {
        	if (myInput != "usernameistoolong") {
        		checkUser(myInput);
                enable_realtime_update(myInput);
        		}
        		 // Update URL
        		 window.location.hash = myInput;
        	}
       
    });
});

$(function() {

    $('.linkinput').live('click', function(e) {
        e.preventDefault();

        var myInput = $(this).attr('data-user');

        setInput(myInput);

        $('#searchform').submit();
    });
});

function warn(message) {
    $('#bugfixing').html("<div class='alert'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Warning! </strong>" + message + "</div>");
    console.log("warning: " + message);
}

// store username given via input
function getInput() {
    var myInput;

    // check if a hashtag is entered
    if (document.tweetfinder.user.value[0] == "#") {
	    myInput = document.tweetfinder.user.value;
	    
    }

    else {

		// Check if cleanup of the @ is needed
	    if (document.tweetfinder.user.value[0] == "@") {
	        myInput = document.tweetfinder.user.value.substring(1,20); //get rid of the @
	    }
	    else { myInput = document.tweetfinder.user.value };

	    // Validate length of username
	     if (myInput.length > 16) { // TODO: if true, return error msg and don't continue
	        warn("This doesn't seem to be a username, too long.");
	        return "usernameistoolong";
	     }
    }
    searches.unshift(myInput); // store successful search term in searches array
    console.log(searches);
    console.log(myInput);
    return myInput;
}

function setInput(myInput) {
    document.tweetfinder.user.value = myInput;
}

// call info about username via twitter api and get link data
function checkUser(myInput) {
    $.ajax({
        url: 'https://api.twitter.com/1/users/show.json',
        data: {
            screen_name: myInput,
            include_entities: true,
            suppress_response_codes: true
        },
        dataType: 'jsonp',
        success: function(data) {
            var html = "";

            if (data.error) {
                warn("Twitter doesn't know this username. Try another one.");
            } else {
                var created = new Date(data.created_at),
                    name = data.name,
                    username = data.screen_name,
                    followersNumber = data.followers_count,
                    tweetsNumber = data.statuses_count;

                html += "The latest links posted by <a href='http://www.twitter.com/" + username + "'>" + name + "</a>. <iframe allowtransparency='true' frameborder='0' scrolling='no' src='//platform.twitter.com/widgets/follow_button.html?screen_name=" + username + "' style='width:300px; height:20px;margin-left:8px;'></iframe>"
                getLinks(myInput); // getting those links from tweets
            }

            $('#myUser').html("by " + name); // add user's name to header
            document.title = "Twitter Times by " + name + " (beta)";
            $('.userinfo').html(html);
        }
    });
}

//extract links from tweets
var user;
var fetched_data = [];
var tweetsToFetch = 200, minNrOfLinks = 12;
var linksTotal = 0;
var processing; // used for scroll-loader
var links = {}; // keep this hash, to check if we already know about a link.
var searchApiRequests = 0;
var searchApiMaxId = null;
var maxSearchApiRequests = 10;
//this will tell us whether the last api call didn't return any tweets
//so we can stop trying to get more tweets
var lastResultEmpty = false;

function getLinks(myInput) {
    $('#status').addClass('state-loading').html("Looking for tweeted links...");

    // Save for reuse
    user = myInput;

    if (myInput[0] == "#") {
    	//call search API with myInput as query
      	var params = {
            'q': myInput,
            'include_entities': true,
            'include_rts': false,
            'count' : 100,
        };
        if (searchApiMaxId == null) {
            //first search request for this hashtag - get first tweets (old behaviour)
            params['since_id'] = 1;
        } else {
            //get next 100 tweets with tweetid <= last tweetid from previous search request 
            //i.e. 100 tweets written before last tweet we got from search api before
            params['max_id'] = searchApiMaxId;
            //btw: we'll receive the last tweet again. we should use searchApiMaxId - 1,
            //but since JavaScript can't handle 64 bit integers natively there's no easy way to do this.
            //it's not perfect but since we're checking for duplicate links in process_data anyway it doesn't matter.
        }
        $.getJSON('http://search.twitter.com/search.json?callback=?', params, function(data) {
            fetched_data = data.results.reverse();
            process_data(minNrOfLinks);
            $('.userinfo').html("The latest links posted under hashtag " + myInput);
            //increment the search api request counter. we don't wanna send too many requests (limited by maxSearchApiRequests)
            searchApiRequests++;
            //only try to get more links IF: we don't have minNrOfLinks already AND 
            //we didn't use the API more than maxSearchApiRequests times AND
            //the last api called contained tweets
            if (linksTotal < minNrOfLinks && searchApiRequests <= maxSearchApiRequests && !lastResultEmpty) {
                getLinks(myInput);
            }
        });

    } else {
	    var params = {
	        'screen_name': myInput,
	        'include_entities': true,
	        'include_rts': false,
	        'since_id': 1,
	        'count' : tweetsToFetch,
	    };
	    $.getJSON('https://api.twitter.com/1/statuses/user_timeline.json?&callback=?', params, function(data) {
	        fetched_data = data.reverse();
	        process_data(minNrOfLinks);
	    });
    }
};

function process_data(nrOfLinks) {
    //stop processing if there are no tweets
    if (fetched_data.length === 0) {
    	warn("This user hasn't tweeted anything yet.");
    	$('#status').html("");
    	$('.userinfo').html("");
        lastResultEmpty = true;
    	return;
    }
    lastResultEmpty = false;

    processing = true;
    var n = nrOfLinks;
    while (n > 0) {
        var tweet = fetched_data.pop();
        if (typeof tweet == "undefined") {
            break;
        }
        var text = tweet.text;
        var retweets = tweet.retweet_count;
        var tweetId = tweet.id_str; // needed later to link to tweet
        $.each(tweet.entities.urls, function(i, url_entity) {
            var link = url_entity.expanded_url;
            // we check if we have already stored this link inside
            // our global links hash, this could be done more efficient
            // but I guess it's good enough for the moment.
            if(typeof links[link] == "undefined" && text[0] != "@") { // exclude duplicate links and links from @-replies
                links[link] = true;
                n -= 1;
                linksTotal += 1;
                generateEmbed(linksTotal, link, tweetId, text);
                console.log("The link-url is: " + link + " and the tweet text is " + text + ". The tweet has been retweeted " + retweets + " times.");

                if (n == 0) {
                    // we break the each loop here since we have enough links found
                    processing = false;
                    return false;
                }
            }
        });
    }
    searchApiMaxId = tweetId;
}

//create oEmbed of link from tweet
function generateEmbed(linksTotal, link, tweetId, text) {

    //cache container DOM element
    var embeds_columns = $('#embeds div.column');
    var c = (linksTotal -1) % embeds_columns.length;
 	var $column = $(embeds_columns[c]);
 	var $status = $('#status');

    $.getJSON('http://api.embed.ly/1/oembed?key=ab0fdaa34f634136bf4eb2325e040527&url=' + link + '&maxwidth=268', function(embed) {
            var title = embed.title,
                description = embed.description,
                url = embed.url,
                provider = embed.provider_name,
                provider_url = embed.provider_url,
                img_url = embed.thumbnail_url,
                author = embed.author_name,
                author_url = embed.author_url,
                type = embed.type, // used to distinguish links from audio and video
                multimedia = embed.html,

                //cache teaser DOM elements for faster access
                $teaser = $('<div class="teaser"/>'),
                $media = $('<div class="media" />'),
                $article = $('<article />'),
                $title = $('<h3 />'),
                $description = $('<div class="description" />'),
                $credits = $('<div class="credits" />'),
                $tweet = $('<div class="tweet" />'),
                $tweetLink = $('<a>see tweet</a>');

            console.log(type + " " + multimedia); // testin'

            //get rid of loading message if loading class is still applied
            if ($status.hasClass('state-loading')) {
                $status.removeClass('state-loading').html('');
            }

            //create a new teaser element with all subelements
            $column.append($teaser);
            $teaser.append($media);
            $teaser.append($article);
            $article.append($title);
            $article.append($description);
            $article.append($credits);
            $teaser.append($tweet);
            $tweet.append($tweetLink);

            // crop long description
            if (description && description.length > 140) {description = jQuery.trim(description).substring(0, 139).split(" ").slice(0, -1).join(" ") + " [...]"};
            // crop long titles
            if (title && title.length > 100) {title = jQuery.trim(title).substring(0, 99).split(" ").slice(0, -1).join(" ") + " [...]"};

            //assign correct content to all those elements
            if (type == "link" && img_url != undefined) {
            		$media.html("<a href='" + link + "' target='_blank'>" + "<img src='" + img_url + "'></a><br/>")
            		}
            else if (type == "video" || type == "rich" || type == "audio") {
            		$media.html(multimedia + "<br/>")
            		};

            $title.html("<a href='" + link + "' target='_blank'>" + title + "</a><br />");
            $description.html(description + " <a href='"+ link + "' target='_blank'>read on</a>");

            if (author != undefined) {$credits.html("Published by: <a href='" + provider_url + "' title='" + provider + "'>" + provider + "</a>, Author: " 				+ "<a href='" + author_url + "' title='" + author + "'>" + author + "</a>");}
            else {$credits.html("Published by: <a href='" + provider_url + "' title='" + provider + "'>" + provider + "</a>");};

            //add the tweet as a tooltip
            $tweetLink.attr('href', 'http://twitter.com/'+ user +'/status/'+ tweetId).popover({
                title: "<blockquote class='twitter-tweet'><p>"+text+"</p></blockquote><script src='//platform.twitter.com/widgets.js' charset='utf-8'></script>",
                html: true,
                trigger: "hover",
                placement: "top"
            });
    });

};

//display latest search term (for starters, should be n latest search terms eventually)
function displaySearches(searches) {
	$('.searches').append("<a href='#' class='linkinput' data-user='" + searches[0] + "'>" + searches[0] + " </a>");
};

var tambur_conn, tambur_stream;
function enable_realtime_update(myInput) {
    var ready = function(id, nick) {
        $.getJSON("http://149.126.0.41/token?id=" + id +"&nick="+nick+"&callback=?", function(res){
            var list = jQuery.parseJSON(res.initial_list);
            $("#readrightnow a").remove();
            if (list.length > 0) {
                for (var i=0; i<list.length; i++) {
                    var a = $("<a href='#' class='linkinput btn btn-mini' style='display:none' data-user='"+list[i]+"'>"+list[i]+"</a> ");
                    $("#readrightnow").append(a);
                    a.fadeIn();
                }
                $("#readrightnow").fadeIn();
            }
            tambur_stream.enable_presence(nick, res.token);
            tambur_stream.onpresence = function(e) {
                var nick = e[0], presence_state = e[1];
                if(presence_state == 'up' && $("#readrightnow a[data-user='" + nick + "']").length == 0) {
                    var links = $("#readrightnow a");
                    $("#readrightnow").show();
                    if(links.length > 40) {
                        // we remove the oldest entry
                        links[0].fadeOut().remove();
                    }
                    var a = $("<a href='#' class='linkinput btn btn-mini' style='display:none' data-user='" + nick + "'>" + nick + "</a> ")
                    $("#readrightnow").append(a);
                    a.fadeIn();
                } else if(presence_state == 'down') {
                    $("#readrightnow a[data-user='" + nick + "']").fadeOut().remove();
                }
            };
        });
    };
    if(typeof tambur_conn == "undefined") {
        // connect to tambur.io
        tambur_conn = new tambur.Connection("a1892d4076a7421aa9e1ac6b2fb5dd68", "twitter-times-11");
        tambur_stream = tambur_conn.get_stream("current");
        tambur_stream.ready = function() {
            ready(tambur_conn.subscriber_id, myInput);
        }
    } else {
        // we already have a tambur connection
        // we disable presence
        tambur_stream.disable_presence();
        tambur_stream.ondisabled = function() {
            ready(tambur_conn.subscriber_id, myInput);
        };
    }

}


$(document).ready(function(){
    $(document).scroll(function(e){
        var myInput = document.tweetfinder.user.value;
        if (processing || myInput.length == 0)
            return false;

        if ($(window).scrollTop() >= ($(document).height() - $(window).height())*0.7){
            processing = true;
            process_data(minNrOfLinks);
        }
    });

    //toggle supportbox
    $('.pull-me').click(function(event) {
        event.preventDefault();

        //remove class on supportbox (allowing for correct initiation of Twitter buttons, see issue #35)
        if ($('#supportbox').hasClass('state-hidden')) {
            $('#supportbox').removeClass('state-hidden').hide();
        }

		$('#supportbox').slideToggle('slow');
	});

});

//create embed for tweet
// function generateTweetEmbed(tweetId) {
// 	$.getJSON('https://api.twitter.com/1.1/statuses/oembed.json?id=' + tweetId + '&callback=?', function(embed) {
// 		var tweetembed = embed.html;
// 		return tweetembed;
// 	});
// };

})(window, document, jQuery);
