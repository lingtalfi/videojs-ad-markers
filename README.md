Videojs Ad Markers
=======================
2015-12-06


Plugin for videojs which provides basic functionality to implement an advertising system.


It depends from [jquery](https://jquery.com/).



What's the goal
--------------------

The goal is to generate advertising that comes in the middle of a video (aka mid-rolls).
A lot like youtube.com does.

A photo might actually give you a better idea:

![ad markers](http://s19.postimg.org/6sq8qb5pf/ad_markers.png)


See the yellow squares on the timeline?
Each of them represents a point in time where we will play an ad.



Features
--------------------

- easy timeline point customization via css
- designed to work with player.currentTime (whatever that means) 


Example
-----------

### Developer example
 
The example below is a development (not production) example which displays both video containers (see the concept of video containers
in the "How does it work?" section).
In order to successfully implement this example, you need to have some mp4 files on your machine.


```html
<!DOCTYPE html>
<html>
<head>
    
    <script src="http://vjs.zencdn.net/5.3.0/video.js"></script>
    <link href="http://vjs.zencdn.net/5.3.0/video-js.css" rel="stylesheet">

    <!-- If you'd like to support IE8 -->
    <script src="http://vjs.zencdn.net/ie8/1.1.0/videojs-ie8.min.js"></script>
    
    
    <!-- ad markers plugin, depends from jquery -->
    <script src="http://code.jquery.com/jquery-2.0.3.min.js"></script>    
    <script src="/js/vjs-5.3.0/plugins/admarkers/ad-markers.js"></script>
    <link href="/js/vjs-5.3.0/plugins/admarkers/ad-markers.css" rel="stylesheet">    
</head>


<body>


<!-- This is the main video -->
<video id="my-video" class="video-js" controls preload="auto" width="640" height="264"
       poster="https://s-media-cache-ak0.pinimg.com/736x/81/23/e1/8123e1e5525c730644f85df3bb85b9ae.jpg"
    >
    <source src="http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4"
            type='video/mp4'>
    <p class="vjs-no-js">
        To view this video please enable JavaScript, and consider upgrading to a web browser that
        <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
    </p>
</video>



<!-- This is the ads video container -->
<video id="ads-container" class="video-js" controls preload="auto" width="640" height="264"
       poster="https://s-media-cache-ak0.pinimg.com/736x/81/23/e1/8123e1e5525c730644f85df3bb85b9ae.jpg"
    >
    <source src="/mp4/beer.mp4" type="video/mp4">
    <p class="vjs-no-js">
        To view this video please enable JavaScript, and consider upgrading to a web browser that
        <a href="http://videojs.com/html5-video-support/" target="_blank">supports HTML5 video</a>
    </p>
</video>



<script>

    (function ($) {


        //------------------------------------------------------------------------------/
        // CONFIG
        //------------------------------------------------------------------------------/
        var startTime = 5;
        var myPlayer = videojs('my-video');
        var adsPlayer = videojs('ads-container');
        adsPlayer.on('ended', function () {
            myPlayer.play();
            myPlayer.adMarkers.adPlaying = false; // whenever an ad ends, you must set this flag to false
        });




        myPlayer.adMarkers({
            markers: [
                // In this example, we use server hosted mp4 only
                {time: 20, ad: "/mp4/matrix.mp4"}, 
                {time: 50, ad: "/mp4/beer.mp4"},
                {time: 80, ad: "/mp4/pont-espion.mp4"},
                {time: 180, ad: "/mp4/www-uponastar.mp4"}
            ],
            prepareNextAd: function(nextMarker){
                console.log("Preparing next marker");
                console.log(nextMarker);
                adsPlayer.src(nextMarker.ad);
                adsPlayer.load();
            },
            playAd: function(marker){
                console.log("playing ad");
                console.log(marker);
                myPlayer.pause();
                adsPlayer.play();
            }
        });

	    /**
	     * Trick if you want to play/start the main video from a position different than 0. 
         */
        myPlayer.on('loadedmetadata', function () {
            myPlayer.currentTime(startTime);
            myPlayer.play();
        });

    })(jQuery);
</script>

</body>
</html>

```

 
 
Note: in the above example I use a default video for the ad video container, so that there is no js error.   
 
 
 
 
 
How does it work?
-----------------------


### Which callbacks

Each marker is represented by a "square" on the timeline.
The big picture is that when the playhead reaches a square, it triggers the playAd callback,
and then triggers the prepareNextAd callback.

So, if you have 5 points in your timeline, when you reach point 3, then the ad#3 is played,
and ad#4 is prepared.

More info in the source code.


### What's the mechanism to display ad

This plugin is originally designed to work with two video containers (the video html tag): 
one for the main video, and one for the ads.

The ads container should be updated (see my examples above) on every timeline ad point.
Also, you should handle the visibility (using a css class with display:none) of the video containers so that
only the appropriate video container shows up. 
I personally use a css class named shadowed, and using jquery I remove/add this css class on the appropriate video container.






History Log
------------------
    
    
- 1.0.0 -- 2015-12-07

    - initial commit

- 0.0.1 -- 2015-12-06

    - first sketch