/*! ad-markers */
'use strict';

(function ($, videojs, undefined) {
    //default setting
    var defaultSetting = {
        announceTime: 15,
        stylizeMarker: function (jMarkerDiv, position) {
            jMarkerDiv.css({
                "left": position + '%'
            });
        },
        getMarkerTime: function (marker) {
            return marker.time;
        },
        onMarkerClick: function (marker) {
        },
        onMarkerReached: function (marker) {
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

        var setting = $.extend(true, {}, defaultSetting, options),
            markersMap = {},
            markersList = [], // list of adMarkers sorted by time
            videoWrapper = $(this.el()),
            currentMarkerIndex = -1,
            player = this,
            overlayIndex = -1;

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
                if ('undefined' === typeof marker.loader) {
                    marker.loader = false;
                }

                videoWrapper.find('.vjs-progress-control').append(createMarkerDiv(marker));

                // store marker in an internal hash map
                markersMap[marker.key] = marker;
                markersList.push(marker);
            });

            sortMarkersList();
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
            currentMarkerIndex = -1;

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
            /*
             check marker reached in between adMarkers
             the logic here is that it triggers a new marker reached event only if the player 
             enters a new marker range (e.g. from marker 1 to marker 2). Thus, if player is on marker 1 and user
             clicked on marker 1 again, no new reached event is triggered)
             */

            var getNextMarkerTime = function (index) {
                if (index < markersList.length - 1) {
                    return setting.getMarkerTime(markersList[index + 1]);
                }
                // next marker time of last marker would be end of video time
                return player.duration();
            }
            var currentTime = player.currentTime();
            var newMarkerIndex;


            if (currentMarkerIndex != -1) {
                // check if staying at same marker
                var nextMarkerTime = getNextMarkerTime(currentMarkerIndex);
                if (currentTime >= setting.getMarkerTime(markersList[currentMarkerIndex]) && currentTime < nextMarkerTime) {
                    return;
                }
            }

            // check first marker, no marker is selected
            if (markersList.length > 0 &&
                currentTime < setting.getMarkerTime(markersList[0])) {
                newMarkerIndex = -1;
            } else {
                // look for new index
                for (var i = 0; i < markersList.length; i++) {
                    nextMarkerTime = getNextMarkerTime(i);
                    if (currentTime >= setting.getMarkerTime(markersList[i]) &&
                        currentTime < nextMarkerTime) {
                        newMarkerIndex = i;
                        break;
                    }
                }
            }

            // set new marker index
            if (newMarkerIndex != currentMarkerIndex) {
                // trigger event
                if (newMarkerIndex != -1 && options.onMarkerReached) {
                    options.onMarkerReached(markersList[newMarkerIndex]);
                }
                currentMarkerIndex = newMarkerIndex;
            }

        }

        // setup the whole thing
        function initialize() {

            // remove existing adMarkers if already initialized
            player.adMarkers.removeAll();
            addMarkers(options.markers);

            onTimeUpdate();
            player.on("timeupdate", onTimeUpdate);
        }

        // setup the plugin after we loaded video's meta data
        player.on("loadedmetadata", function () {
            initialize();
        });

        // exposed plugin API
        player.adMarkers = {
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
