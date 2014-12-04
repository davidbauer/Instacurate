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


// Setup an event listener for the form that will execute checkUser()
// when the form is submitted.
$(function() {
    // extract and decode hash
    var hash = decodeURIComponent(window.location.hash.substr(1)),
        field = document.redditsearch.input;

    if (hash) {

        // Do the search magic
        getLinks(hash);
        // enable_realtime_update(hash);

        // Fill field
        field.value = hash;
    }

    else {
        // enable_realtime_update("switzerland"); // TODO: Get Tambur realtime sneakpeek to work again
    }

    $('#searchform').submit(function(e) {
        // Stop the form from sending and reloading the page
        e.preventDefault();
        // clean up
        $('#bugfixing').html("");
        $('#embeds div').html("");
        linksTotal = 0;

        // Get the typed subreddit
        var myInput = getInput();

        if(myInput) {

        	label(myInput);

        	//proceed with subreddit
			getLinks(myInput);

	    	// Update URL
	    	window.location.hash = myInput;
	    };

    });
});

// get input from suggestions
$(function() {

    $('.linkinput').on('click', function(e) {
        e.preventDefault();

        var myInput = $(this).attr('data-input');

        setInput(myInput);

        $('#searchform').submit();
    });
});

function warn(message) {
    $('#bugfixing').html("<div class='alert'><button type='button' class='close' data-dismiss='alert'>&times;</button><strong>Warning! </strong>" + message + "</div>");
    console.log("warning: " + message);
}

// store subreddit given via input
function getInput() {
    var myInput;

    // TODO later: Check typed content against list of existing subreddits and autocomplete

    if (document.redditsearch.input.value == "") {
    	warn("You can't enter nothing and expect something to show up.");
    }

    else if (document.redditsearch.input.value.substr(0, 5) == "feed=") { //check if a user feed has been entered
		myInput = document.redditsearch.input.value;
		return myInput;
    }

	else {
		myInput = document.redditsearch.input.value;
		return myInput;
	}
}

function setInput(myInput) {
    document.redditsearch.input.value = myInput;
}


function label(myInput) {

	if (myInput.substring(0,5) == "feed=") {
		$('h1').html("Your front page, instacurated"); // add input name to headline
		$('.twi').html("");
		document.title = "Your front page, instacurated"; // add input to page title
	}

	else {
		$('h1').html(myInput + ", instacurated"); // add input name to headline
		$('.twi').html("");
		document.title = myInput + ", instacurated"; // add input to page title
	}
}


//extract links from subreddit
var subreddit;
var thisuser;
var fetched_data = [];
var postsToFetch = 24, minNrOfLinks = 24;
var linksTotal = 0;
var processing = true; // used for scroll-loader
var links = {}; // keep this hash, to check if we already know about a link.
var lastPost = '';

function getLinks(myInput) {
    $('#status').addClass('state-loading alert alert-info').html("<i class='icon-spinner icon-spin'></i> Checking...");

    // Save for reuse
    if (myInput.substring(0, 5) == "feed=") {
	    thisuser = myInput;
	    getFrontpage(thisuser);
    }
    else {

        // If the search is new, reset the last post variable
        if (subreddit !== myInput) {
            lastPost = '';
        }

    	subreddit = myInput;

        // get data for subreddit via API
	    var params = {
	         'limit' : postsToFetch,
             'after': lastPost
	    };
	    $.getJSON('http://www.reddit.com/r/'+ subreddit +'.json?&jsonp=?', params, function(data) {
	        fetched_data = data.data.children.reverse();
            lastPost = data.data.after;
	        console.log(fetched_data.length + " posts fetched.");

	    })
	    .error(function() {
	    	$('#status').html("");
	    	warn("No such subreddit seems to exist. Try another one.");
	    })
	    .success(function() {
	    	process_data(minNrOfLinks);
	    	$('#status').removeClass('alert-info').addClass('alert-success').html("<i class='icon-spinner icon-spin'></i> Compiling...");
	    });
	};
};

function getFrontpage(username) {
	// get data for user via API
    var params = {
         'limit' : postsToFetch,
    };
    $.getJSON('http://www.reddit.com/.json?' + username + '&jsonp=?', params, function(data) {
        fetched_data = data.data.children.reverse();
        console.log(fetched_data.length + " posts fetched.");
        console.log(fetched_data[0].data.title);

    })
    .error(function() {
    	$('#status').html("");
    	warn("Something went wrong, we're sorry.");
    })
    .success(function() {
    	process_data(minNrOfLinks);
    	$('#status').removeClass('alert-info').addClass('alert-success').html("<i class='icon-spinner icon-spin'></i> Compiling...");
    });
}

function process_data(nrOfLinks) {
    //stop processing if there are no posts with links
    if (fetched_data.length === 0) {
    	warn("This subreddit seems to have no recent links posted in it.");
    	$('#status').html("");
    	$('.userinfo').html("");
    	processing = false;
    	return;
    }

    var n = nrOfLinks,
        embedLinks = [],
        embedPosts = [];
    while (n > 0) {
        var post = fetched_data.pop();

        if (post == undefined) {
            console.log("post undefined, can't do nothing with it");
            break;
        }

        console.log("post title: " + post.data.title);

        var link = post.data.url;
        var text = post.data.title;
        var score = post.data.score;
        var comments = post.data.num_comments;
        var redditor = post.data.author;
        var postlink = post.data.permalink;
        var tstamp = createTimestamp(post.data.created);

		// TODO: check if this duplicate check still works
        // we check if we have already stored this link inside
        // our global links hash, this could be done more efficient
        // but I guess it's good enough for the moment.
        if(typeof links[link] == "undefined") { // exclude duplicate links
            links[link] = true;
            n -= 1;
            linksTotal += 1;

            embedLinks.push(link);
            embedPosts.push([ text, score, comments, redditor, postlink, tstamp ]);
            //generateEmbed(linksTotal, link, text, score, comments, redditor, postlink, tstamp);
            console.log("The link-url is: " + link + " and the title text is " + text + ". The post has a score of " + score + "!");
			      console.log(tstamp + " timestamp");
            if (n == 0) {
                // we break the each loop here since we have enough links found
                processing = false;
                break;
            }
        }
    }
    requestEmbeds(linksTotal, embedLinks, embedPosts);
};

// format timestamp as a string
function createTimestamp (createdAt) {
	var date = new Date(createdAt*1000);
	var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
};

// process links
function requestEmbeds(total, links, postdata) {
  if(console) console.log('Requesting embeds for ' + links.length + ' links.');
  $.ajax('../../embed-cache.php', {
    type: 'get',
    dataType: 'json',
    data: {
      url: links,
      maxwidth: 360
    },
    error: function(jqhxr, error) {
      alert(error);
    },
    success: function(response) {
      var cache = response.cache,
          index = total - links.length,
          args;
      for(var i=0, cnt=cache.length; i<cnt; i=i+1) {
        if(cache[i]) {
          args = [index, cache[i]];
          Array.prototype.push.call(args, postdata[i]);
          generateEmbed.apply(this, args);
          index += 1;
        }
      }
      for(i=0, cnt=response.errors.length; i<cnt; i=i+1) {
        if(console) console.log('Error: '+errors[i]);
      }
   }
  });
}

//create oEmbed of link from tweet
function generateEmbed(linksTotal, embed, text, score, comments, redditor, postlink, tstamp) {

    //cache container DOM element
    var embeds_columns = $('#embeds div.column');
    var c = (linksTotal -1) % embeds_columns.length;
  	var $column = $(embeds_columns[c]);
  	var $status = $('#status');

    var title = embed.title,
        description = embed.description,
        url = embed.url,
        provider = embed.provider_name,
        provider_url = embed.provider_url,
        img_url = embed.thumbnail_url,
        img_width = embed.thumbnail_width,
        author = embed.author_name,
        author_url = embed.author_url,
        type = embed.type, // used to distinguish links from audio and video
        multimedia = embed.html,


        //cache teaser DOM elements for faster access
        $teaser = $('<div class="teaser"/>'),
        $media = $('<div class="media" />'),
        $article = $('<article class="article" />'),
        $title = $('<h3 />'),
        $description = $('<div class="description" />'),
        $credits = $('<div class="credits" />'),
        $instapaper = $('<div class="instapaper"/>'),
        $recommender = $('<div class="recommender"/>'),
        $rectext = $('<a class="rectext" />');

    //get rid of loading message if loading class is still applied
    if ($status.hasClass('state-loading')) {
        $status.removeClass('state-loading alert alert-info').html('');
    }

    //create a new teaser element with all subelements

    var blocked = []; // array of blocked providers

    if (jQuery.inArray(provider,blocked) == -1 && typeof title != undefined) { // exclude blocked providers

    	$column.append($teaser);
    	$teaser.append($media);
    	$teaser.append($article);
    	$article.append($credits);
    	$article.append($title);
    	$article.append($description);
    	$teaser.append($recommender);

    	// crop long description
    	if (description && description.length > 140) {description = jQuery.trim(description).substring(0, 139).split(" ").slice(0, -1).join(" ") + " [...]"};
    	// crop long titles
    	if (title && title.length > 100) {title = jQuery.trim(title).substring(0, 99).split(" ").slice(0, -1).join(" ") + " [...]"};

    	//assign correct content to all those elements
    	if (type == "link" && typeof img_url != undefined && img_width >= 150) {
    		$media.html("<a href='" + url + "' target='_blank'>" + "<img src='" + img_url + "'></a><br/>")
    	}

    	else if (type == "photo" && typeof url != undefined) {
    	   $media.html("<a href='" + url + "' target='_blank'>" + "<img src='" + url + "'></a><br/>")
    	}

    	else if (type == "video" || type == "rich" || type == "audio") {
    		$teaser.addClass(type); // add type as class to teaser for later styling
    		$media.html(multimedia + "<br/>")
    	};

    	if (title != undefined) {$title.html("<a href='" + url + "' target='_blank'>" + title + "</a><br />");}

        if (description != undefined) {$description.html(description + " <a href='"+ url + "' target='_blank'>read on</a>");}

    	if (author != undefined) {
            $credits.html("<a href='" + author_url + "' title='" + author + "' target='_blank'>" + author + "</a>, " + "<a href='" + provider_url + "' title='" + provider + "' target='_blank'>" + provider + "</a>");
        } else {
            $credits.html("<a href='" + provider_url + "' title='" + provider + "' target='_blank'>" + provider + "</a>");
        };

    	//add instapaper button
    	if (type == "link") {
        	$instapaper.html("<iframe border='0' scrolling='no' width='78' height='17' allowtransparency='true' frameborder='0' style='margin-bottom: -3px; z-index: 1338; border: 0px; background-color: transparent; overflow: hidden;' src='http://www.instapaper.com/e2?url=" + url + "&title=" + title + "&description=" + description + " (via instacurate.com)'></iframe>");
    	}

    	$recommender.html("<div class='score'><i class='fa fa-line-chart'></i> " + score + "</div><p class='rectext'>Shared by <a href='http://www.reddit.com/user/" + redditor + "'>" + redditor + "</a>");

      $recommender.append($rectext);
    	$recommender.append($instapaper);

    }

    //add post title as a tooltip
    $rectext.append(tstamp + " (view on reddit)").attr('target', '_blank').attr('href', 'http://www.reddit.com' + postlink).popover({
      title: "<blockquote class='twitter-tweet'><p>"+text+"</p></blockquote>",
      html: true,
      trigger: "hover",
      placement: "top"
    });
};


/*
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
                if(nick == 'presence-placeholder') {
                    return;
                }
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
*/


// TODO: make the reload by scrolling work again
$(document).scroll(function(e){
    var myInput = document.redditsearch.input.value;
    if (processing || myInput.length == 0)
        return false;

    if ($(window).scrollTop() >= ($(document).height() - $(window).height())*0.8){
        processing = true;
        $('#status').addClass('state-loading alert alert-info').html("<i class='icon-spinner icon-spin'></i> Loading more links...");
        getLinks(myInput);
    }
});



$(document).ready(function(){

    // load some default content to start with
    // getLinks("all");

    // display help text if user hasn't done anything after 5 secs
    setTimeout(function(){
	    $('.helptext').removeClass('hide')},5000);


});

})(window, document, jQuery);
