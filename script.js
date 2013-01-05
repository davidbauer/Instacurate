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

    var hash = window.location.hash,
        field = document.tweetfinder.user;

    if (hash) {
        hash = hash.substring(1);

        // Fill field
        field.value = hash;

        // Do the magic
        checkUser(hash);

    }


    $('#searchform').submit(function(e) {
        // Stop the form from sending and reloading the page
        e.preventDefault();
        // clean up
        $('#bugfixing').html("");
        $('#embeds div').html("");
        $('.userinfo').html("");

        // Get the articles from typed user
        var myInput = getInput();

        //proceed with either hashtag or username
        if (myInput[0] == '#') {
	        getLinks(myInput);
        }

        else {
        	if (myInput != "usernameistoolong") {
        		checkUser(myInput);
                enable_realtime_update(myInput);
        		}
        	}
        // Update URL
        window.location.hash = myInput;
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
	    console.log("HASHTAG: " + myInput);
	    warn("We don't support hashtags yet. We're working on it right now.");
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
	        'since_id': 1,
	        'count' : 100,
	    };
	    $.getJSON('http://search.twitter.com/search.json', params, function(data) {
	        fetched_data = data.reverse();
	        process_data(minNrOfLinks);
	    });
	}

    else {
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
    if (fetched_data.length === 0) return;

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
            // if (description && description.length > 140) {description = description.substring(0, 139) + " [...]"}
            if (description && description.length > 140) {description = jQuery.trim(description).substring(0, 139).split(" ").slice(0, -1).join(" ") + " [...]"};

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
            //generateTweetEmbed(tweetId);
            // console.log("popover "+ text);
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
function enable_realtime_update(myUser) {
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
            ready(tambur_conn.subscriber_id, myUser);
        }
    } else {
        // we already have a tambur connection
        // we disable presence
        tambur_stream.disable_presence();
        tambur_stream.ondisabled = function() {
            ready(tambur_conn.subscriber_id, myUser);
        };
    }

}


$(document).ready(function(){
    $(document).scroll(function(e){
        if (processing)
            return false;

        if ($(window).scrollTop() >= ($(document).height() - $(window).height())*0.7){
            processing = true;
            process_data(minNrOfLinks);
        }
    });

    //toggle supportbox
    $('.pull-me').click(function(){
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
