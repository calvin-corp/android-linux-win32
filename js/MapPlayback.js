/**
 * FILE: MapPlayback.js
 * DESCRIPTION: MapPlayback is a class that provides animation capabilities to a Google Map.
 * DATE: March 14, 2015
 * DESIGNER: Calvin Rempel
 * PROGRAMMER: Calvin Rempel
 * 
 * @param Map _map the Google Map being animated upon
 * @param function stopHandler a function to call when the animation has been stopped
 * @param Object playBtn the Play Button
 * @param Object pauseBtn the Pause Button
 * @param Object stopBtn the Stop Button
 */
function MapPlayback(_map, stopHandler, playBtn, pauseBtn, stopBtn)
{
    /** PRIVATE 'CONSTANTS' **/
    var BUTTON_DISABLED_OPACITY = 0.5;
    var ANIMATION_SPEED = 100;
    var MOVEMENT_SPEED = 5;
    var TRACKER_COLOUR = '#00f';
    var LINE_COLOUR = '#444';
    
    /** PRIVATE DATA **/
    var onStopHandler = stopHandler;
    var playing = false;
    var paused = false;
    var buttonPlay = playBtn;
    var buttonPause = pauseBtn;
    var buttonStop = stopBtn;
    var data;
    var polyLines;
    var animInfo;
    var numCompleted;
    var map = _map;
    var timer;
    var lineSymbol = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            strokeColor: LINE_COLOUR
        };
    var trackerSymbol = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            strokeColor: TRACKER_COLOUR
        };
    
    // Disable pause and stop buttons on load
    buttonPause.css({'opacity': BUTTON_DISABLED_OPACITY});
    buttonStop.css({'opacity': BUTTON_DISABLED_OPACITY});
    
    /**
     * FUNCTION: play(data)
     * DESCRIPTION: this function begins animating the paths represented by gpsPings.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param array gpsPings an array of arrays of map markers, where each sub-array represents an
     *              animateable path.
     */
    this.play = function(gpsPings)
    {   
        if (playing && !paused)
            return;

        // Toggle appropriate buttons.
        buttonPlay.css({'opacity': BUTTON_DISABLED_OPACITY});
        buttonPause.css({'opacity': 1});
        buttonStop.css({'opacity': 1});
        
        // If we need to start from the beginning, reset all values
        if (!playing)
        {
            // Add Starting Info for all devices
            polyLines = [];
            animInfo = [];
            numCompleted = 0;
            data = gpsPings;
            for (var i = 0; i < gpsPings.length; i += 1)
            {
                var completed = false;
                var line = null;

                // Reverse GpsPings to make them ascending in time
                gpsPings[i].reverse();

                // If there is not enough data for an animation, dont allow the tracker to start
                if (gpsPings[i][0] == null || gpsPings[i][1] == null)
                    completed = true;
                else
                    line = createLine(gpsPings[i][0], gpsPings[i][1]);

                // Percent through line, start, end, current line, current line number, anim complete
                animInfo.push([0, gpsPings[i][0], gpsPings[i][1], line, 1, completed]);
            }
        }
        
        playing = true;
        paused = false;
        
        animate();
    }

    /**
     * FUNCTION: pause()
     * DESCRIPTION: this function pauses the currently running animation. If the animation is not
     *              currently playing, calling it has no effect.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     */
    this.pause = function()
    {
        if (paused || !playing)
            return;

        // Stop animation updates
        clearTimeout(timer);
        paused = true;
        
        // Toggle appropriate buttons
        buttonPlay.css({'opacity': 1});
        buttonPause.css({'opacity': BUTTON_DISABLED_OPACITY});
        buttonStop.css({'opacity': 1});
    }

    /**
     * FUNCTION: stop()
     * DESCRIPTION: Stop the currently playing animation, thus resetting it. If the animation is
     *              not currently playing (may also be paused), calling it has no effect.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     */
    this.stop = function()
    {
        if (!playing)
            return;

        // Stop the animation updates
        clearTimeout(timer);
        playing = false;
        paused = false;
        
        // Toggle appropriate buttons
        buttonPlay.css({'opacity': 1});
        buttonPause.css({'opacity': BUTTON_DISABLED_OPACITY});
        buttonStop.css({'opacity': BUTTON_DISABLED_OPACITY});
        
        // Remove PolyLines
        for (var i = 0; i < polyLines.length; i += 1)
        {
            polyLines[i].setMap(null);
        }
        
        polyLines = [];
        onStopHandler();
    }
    
    /**
     * FUNCTION: isPlaying()
     * DESCRIPTION: Checks if the animator is currently playing.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @returns Boolean true if playing (or paused), false otherwise.
     */
    this.isPlaying = function()
    {
        return playing;
    }
    
    /**
     * FUNCTION: isPaused();
     * DESCRIPTION: Checks if the animator is currently paused.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @returns Boolean true if paused, false otherwise.
     */
    this.isPaused = function()
    {
        return paused;
    }
    
    /** 
     * 
     * --------- PRIVATE FUNCTIONS --------- 
     * 
     */
    
    /**
     * FUNCTION: animate();
     * DESCRIPTION: Updates the animation frame and requests the next.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     */
    function animate()
    {
        var count = 0;
        
        // If the user paused the animation, don't animate!
        if (paused)
            return;
        
        // Loop through all devices and animate their trackers
        for (var i = 0; i < animInfo.length; i += 1)
        {
            // If this device is complete, skip it
            if (animInfo[i][5] == true)
                continue;
            
            // Check if we need to transition to the next segment
            if (animInfo[i][0] + MOVEMENT_SPEED > 100)
            {
                // If there is another marker, create a line and move to it
                if (animInfo[i][2] != null && data[i][animInfo[i][4] + 1] != undefined)
                {
                    // Move the marker into the next line
                    animInfo[i][0] = (animInfo[i][0] + MOVEMENT_SPEED) % 101;
                    
                    // Swap out start/end markers
                    animInfo[i][1] = animInfo[i][2];
                    animInfo[i][4] += 1;
                    animInfo[i][2] = data[i][animInfo[i][4]];
                    
                    // Remove Circle from previous line
                    animInfo[i][3].setOptions({icons: [{
                        icon: lineSymbol,
                        offset: '100%'
                      }]});
                    
                    // Create New Line
                    animInfo[i][3] = createLine(animInfo[i][1], animInfo[i][2]);
                }
                // If there are no more markers, go to the end of the current line and stop.
                else
                {
                    animInfo[i][0] = 100;
                    numCompleted += 1;
                }
            }
            // If in the middle of a line, move along the line.
            else   
            {
                animInfo[i][0] = animInfo[i][0] + MOVEMENT_SPEED;
            }
            
            // Update the tracker icon's position.
            animInfo[i][3].icons[0].offset = animInfo[i][0] + '%';
            animInfo[i][3].set('icons', animInfo[i][3].get('icons'));
        }
        
        // While Animation is not complete, request another update
        if (numCompleted < animInfo.length)
            timer = window.setTimeout(animate, ANIMATION_SPEED);
    }
    
    /**
     * FUNCTION: createLine(start, end)
     * DESCRIPTION:Create an arrow and place the tracker at the beginning of it.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param Marker start the marker at the start of the line
     * @param Marker end the marker at the end of the line
     * @returns google.maps.Polyline the new PolyLine
     */
    function createLine(start, end)
    {
        // Create the line from the marker positions
        var lineCoordinates = [
            new google.maps.LatLng(start.position.k, start.position.D),
            new google.maps.LatLng(end.position.k, end.position.D)
          ];

        // Create the Line
        var line = new google.maps.Polyline({
          path: lineCoordinates,
          strokeColor: LINE_COLOUR,
          icons: [{
            icon: trackerSymbol,
            offset: '0%'
          },{
            icon: lineSymbol,
            offset: '100%'
          }],
          map: map
        });
        
        // Add the line to the list of lines and return it.
        polyLines.push(line);
        return line;
    }
}