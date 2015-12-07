/*! ad-markers */
'use strict';

(function ($, videojs, undefined) {
    //default setting
    var defaultSetting = {
        stylizeMarker: function (jMarkerDiv, position) {
            jMarkerDiv.css({
                "left": position + '%'
            });
        },
        getMarkerTime: function (marker) {
            return marker.time;
        },
        /**
         * Personal note:
         * This allows us to load the next ad, set it on pause, and we will play it when the next marker
         * will trigger the playAd callback.
         * I noticed that some youtube videos (at least on the youtube.com website), if paused for too long,
         * won't resume when we push the play button.
         * We can deal with this problem within this callback because we have the nextMarker info,
         * so we can set a timeout if the nextMarker is too far away from the current time.
         * The current time is accessible via player.currentTime() if needed.
         *
         */
        prepareNextAd: function (nextMarker) {
        },
        playAd: function (marker) {
        },
        markers: []
    };

    // create a non-colliding random number
    function generateUUID() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };


    function registerVideoJsMarkersPlugin(options) {
        /**
         * register the adMarkers plugin (dependent on jquery)
         */

        var setting = $.extend(true, {}, defaultSetting, options);
        var markersMap = {};
        var markersList = []; // list of adMarkers sorted by time
        var videoWrapper = $(this.el());
        var nextMarker = null;
        var prepareMode = true;
        var player = this;
        var isInitialized = false;


        function sortMarkersList() {
            // sort the list by time in asc order
            markersList.sort(function (a, b) {
                return setting.getMarkerTime(a) - setting.getMarkerTime(b);
            });
        }

        function addMarkers(newMarkers) {

            // create the adMarkers
            $.each(newMarkers, function (index, marker) {
                marker.key = generateUUID();
                videoWrapper.find('.vjs-progress-control').append(createMarkerDiv(marker));

                // store marker in an internal hash map
                markersMap[marker.key] = marker;
                markersList.push(marker);
            });

            sortMarkersList();
        }

        function getNextMarker(time) {
            for (var i in markersList) {
                if (markersList[i].time >= time) {
                    return markersList[i];
                }
            }
            return false;
        }

        function getPosition(marker) {
            return (setting.getMarkerTime(marker) / player.duration()) * 100
        }

        function createMarkerDiv(marker) {
            var markerDiv;

            if (false !== marker.loader) {
                markerDiv = $("<div class='vjs-admarker vjs-admarker-announcer'></div>");
            }
            else {
                markerDiv = $("<div class='vjs-admarker'></div>");
            }


            // stylize (and position) the marker
            setting.stylizeMarker(markerDiv, getPosition(marker));


            markerDiv
                .attr("data-marker-key", marker.key)
                .attr("data-marker-time", setting.getMarkerTime(marker));

            return markerDiv;
        }


        function removeMarkers(indexArray) {

            for (var i = 0; i < indexArray.length; i++) {
                var index = indexArray[i];
                var marker = markersList[index];
                if (marker) {
                    // delete from memory
                    delete markersMap[marker.key];
                    markersList[index] = null;

                    // delete from dom
                    videoWrapper.find(".vjs-admarker[data-marker-key='" + marker.key + "']").remove();
                }
            }

            // clean up array
            for (var i = markersList.length - 1; i >= 0; i--) {
                if (markersList[i] === null) {
                    markersList.splice(i, 1);
                }
            }

            // sort again
            sortMarkersList();
        }


        function onTimeUpdate() {
            if (false === player.adMarkers.adPlaying) {
                if (false !== nextMarker) {

                    if (true === prepareMode) {
                        prepareNextAd(nextMarker);
                    }
                    else {
                        var currentTime = player.currentTime();
                        /**
                         * I noticed that 0 is a special value that occurs even when I used
                         * the player.currentTime(120) function.
                         * So I prefer to skip it.
                         *
                         */
                        if (0 !== currentTime) {
                            if (nextMarker.time <= currentTime) {
                                options.playAd(nextMarker);
                                player.adMarkers.adPlaying = true;
                                nextMarker = getNextMarker(currentTime);
                                prepareMode = true;
                            }
                        }
                    }
                }
            }
        }

        function prepareNextAd(nextMarker) {
            setting.prepareNextAd(nextMarker);
            prepareMode = false;
        }


        // setup the whole thing
        function initialize() {
            if (false === isInitialized) {

                isInitialized = true;
                // remove existing adMarkers if already initialized
                player.adMarkers.removeAll();
                addMarkers(options.markers);

                nextMarker = getNextMarker(0);
                if (false !== nextMarker) {
                    prepareNextAd(nextMarker);
                }
                player.on("timeupdate", onTimeUpdate);
            }
        }

        // setup the plugin after we loaded video's meta data
        player.on("loadedmetadata", function () {
            initialize();
        });

        // exposed plugin API
        player.adMarkers = {
            adPlaying: false,
            getMarkers: function () {
                return markersList;
            },
            add: function (newMarkers) {
                // add new adMarkers given an array of index
                addMarkers(newMarkers);
            },
            remove: function (indexArray) {
                // remove adMarkers given an array of index
                removeMarkers(indexArray);
            },
            removeAll: function () {
                var indexArray = [];
                for (var i = 0; i < markersList.length; i++) {
                    indexArray.push(i);
                }
                removeMarkers(indexArray);
            },
            reset: function (newMarkers) {
                // remove all the existing adMarkers and add new ones
                player.adMarkers.removeAll();
                addMarkers(newMarkers);
            },
            destroy: function () {
                // unregister the plugins and clean up even handlers
                player.adMarkers.removeAll();
                delete player.adMarkers;
            }
        };
    }

    videojs.plugin('adMarkers', registerVideoJsMarkersPlugin);

})(jQuery, window.videojs);
