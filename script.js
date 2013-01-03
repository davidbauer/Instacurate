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
        var myUser = findUser();
        if (myUser == "usernameistoolong") {}
        else {checkUser(myUser);}
        // Update URL
        window.location.hash = myUser;
    });
});

$(function() {

    $('.linkinput').click (function(e) {
        e.preventDefault();
        // clean up
        $('#bugfixing').html("");
        $('#embeds div').html("");
        $('.userinfo').html("");

        // Get the articles from linked user
        var myUser = $(this).attr('data-user');
        if (typeof myUser == "undefined") {
            // form input
            myUser = $("#searchform #user").val();
        }
        checkUser(myUser);
        // Update URL
        window.location.hash = myUser;
    });
});

function warn(message) {
    $('#bugfixing').html("<div class='alert'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Warning! </strong>" + message + "</div>");
    console.log("warning: " + message);
}

// store username given via input
function findUser() {
    var myUser;

    // Get the username value from the form and cleanup the @ if needed
    if (document.tweetfinder.user.value[0] == "@") {
        myUser = document.tweetfinder.user.value.substring(1,20); //get rid of the @
    }
    else { myUser = document.tweetfinder.user.value };

    // Validate length of username
    if (myUser.length > 16) { // TODO: if true, return error msg and don't continue
        warn("This doesn't seem to be a username, too long.");
        return "usernameistoolong";
    }
    else {
        return myUser;
    }
}

// call info about username via twitter api and get link data
function checkUser(myUser) {
    $.ajax({
        url: 'https://api.twitter.com/1/users/show.json',
        data: {
            screen_name: myUser,
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

                html += "The latest links posted by " + name + "(<a href='http://www.twitter.com/@" + username + "'>@" + username + "</a>)."


                getLinks(myUser); // getting those links from tweets
            }

            $('#myUser').html("by " + name); // add user's name to header
            $('.userinfo').html(html);
        }
    });
}

//extract links from tweets
var fetched_data;
var tweetsToFetch = 200, minNrOfLinks = 12;
var linksTotal = 0;
var processing; // used for scroll-loader
var links = {}; // keep this hash, to check if we already know about a link.

function getLinks(myUser) {
    $('#status').addClass('state-loading').html("Looking for tweeted links...");

    var params = {
        'screen_name': myUser,
        'include_entities': true,
        'include_rts': false,
        'since_id': 1,
        'count' : tweetsToFetch,
    };
    $.getJSON('https://api.twitter.com/1/statuses/user_timeline.json?&callback=?', params, function(data) {
        fetched_data = data.reverse();
        process_data(minNrOfLinks);
    });
};

function process_data(nrOfLinks) {
    processing = true;
    var n = nrOfLinks;
    while (n > 0) {
        var tweet = fetched_data.pop();
        if (typeof tweet == "undefined") {
            break;
        }
        var text = tweet.text;
        var retweets = tweet.retweet_count;
        var tweetId = tweet.id; // needed later to embed tweet
        $.each(tweet.entities.urls, function(i, url_entity) {
            var link = url_entity.expanded_url;

            // we check if we have already stored this link inside
            // our global links hash, this could be done more efficient
            // but I guess it's good enough for the moment.
            if(typeof links[link] == "undefined") {
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
                multimedia = embed.html


                console.log(type + " " + multimedia); // testin'

                //cache teaser DOM elements for faster access
                $teaser = $('<div class="teaser"/>'),
                $media = $('<div class="media" />'),
                $article = $('<article />'),
                $title = $('<h3 />'),
                $description = $('<div class="description" />'),
                $credits = $('<div class="credits" />');
                $tweet = $('<div id="'+ tweetId +'"class="tweet" />')

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

            // crop long description
            // if (description && description.length > 140) {description = description.substring(0, 139) + " [...]"}
            if (description && description.length > 140) {description = jQuery.trim(description).substring(0, 139).split(" ").slice(0, -1).join(" ") + " [...]"};

            //assign correct content to all those elements
            if (type == "link" && img_url != undefined) {
            		$media.html("<a href='" + link + "' target='_blank'>" + "<img src='" + img_url + "' width='268px'></a><br/>")
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
            console.log("popover "+ text);
            $tweet.html("<a href='#'>see tweet</a>").popover({
                title: "<blockquote class='twitter-tweet'><p>"+text+"</p></blockquote><script src='//platform.twitter.com/widgets.js' charset='utf-8'></script>",
                html: true,
                trigger: "hover",
                placement: "top"
            });
    });

};

$(document).ready(function(){
    $(document).scroll(function(e){
        if (processing)
            return false;

        if ($(window).scrollTop() >= ($(document).height() - $(window).height())*0.7){
            processing = true;
            process_data(minNrOfLinks);
        }
    });
});

//create embed for tweet
function generateTweetEmbed(tweetId) {
	$.getJSON('https://api.twitter.com/1.1/statuses/oembed.json?id=' + tweetId + '&callback=?', function(embed) {
		var tweetembed = embed.html;
		return tweetembed;
	});
};
