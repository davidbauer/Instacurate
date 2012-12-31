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
        $('#embeds').html("");
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
        $('#embeds').html("");
        $('.userinfo').html("");

        // Get the articles from linked user
        var myUser = $(this).attr('data-user');
        checkUser(myUser);
        // Update URL
        window.location.hash = myUser;
    });
});


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
        $('#bugfixing').html("This doesn't seem to be a username. Too long.");
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
                $('#bugfixing').html("Twitter doesn't know this username. Try another one.");
            } else {
                var created = new Date(data.created_at),
                    name = data.name,
                    username = data.screen_name,
                    followersNumber = data.followers_count,
                    tweetsNumber = data.statuses_count;

                html += name + " (@" + username + ") joined Twitter on " + created.toDateString() + ". " + name.split(' ')[0] + " currently has " + followersNumber + " followers and has published a total number of " + tweetsNumber + " tweets."; // test


                getLinks(myUser); // getting those links from tweets
            }

            $('#myUser').html(name);
            $('.userinfo').html(html);
        }
    });
}

//extract links from url
function getLinks(myUser) {
    var tweetsToFetch = 100, minNrOfLinks = 10;

    $('#embeds').addClass('state-loading').html("Looking for tweeted links...");

    // loop through all tweets and generate embed (loop missing for now, testing the whole thing with most recent tweet)

    var params = {
        'screen_name': myUser,
        'include_entities': true,
        'include_rts': false,
        'since_id': 1,
        'count' : tweetsToFetch,
    };
    $.getJSON('https://api.twitter.com/1/statuses/user_timeline.json?&callback=?', params, function(data) {
        $.each(data, function(index, tweet) {
            if (minNrOfLinks > 0) {
                var text = tweet.text;
                $.each(tweet.entities.urls, function(i, url_entity) {
                    var link = url_entity.expanded_url;
                    minNrOfLinks -= 1;
                    generateEmbed(link);
                    console.log("The link-url is: " + link + " and the tweet text is " + text);

                    if (minNrOfLinks == 0) {
                        // we break the each loop here since we have enough links found
                        return false;
                    }
                });
            } else {
                // we break each loop
                console.log("we have enough links found");
                return false;
            }
        });
    });
};

//create oEmbed of link from tweet
function generateEmbed(link) {

    //cache container DOM element
    var $embeds = $('#embeds');

    $.getJSON('http://api.embed.ly/1/oembed?key=ab0fdaa34f634136bf4eb2325e040527&url=' + link + '&maxwidth=500', function(embed) {
            var title = embed.title,
            description = embed.description,
            url = embed.url,
            provider = embed.provider_name,
            provider_url = embed.provider_url,
            img_url = embed.thumbnail_url,

            //cache teaser DOM elements for faster access
            $teaser = $('<div class="teaser" />'),
            $img = $('<div class="img" />'),
            $article = $('<article />'),
            $title = $('<h3 />'),
            $description = $('<div class="description" />'),
            $credits = $('<div class="credits" />');

            //get rid of loading message if loading class is still applied
            if ($embeds.hasClass('state-loading')) {
                $embeds.removeClass('state-loading').html('');
            }

            //create a new teaser element with all subelements
            $embeds.append($teaser);
            $teaser.append($img);
            $teaser.append($article);
            $article.append($title);
            $article.append($description);
            $article.append($credits);

            //asssign correct content to all those elements
            $img.html("<a href='" + url + "'>" + "<img src='" + img_url + "' width='250px'></a><br/>");
            $title.html("<a href='" + url + "'>" + title + "</a><br />");
            $description.html(description);
            $credits.html("Published by: <a href='" + provider_url + "'>" + provider + "</a>");
    });
};
