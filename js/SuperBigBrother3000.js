/**
 * FILE: SuperBigBrother3000.js
 * DESCRIPTION: This is the main program logic for the SuperBigBrother3000 web application. It
 *              populates the client list, coordinates data retrieval and server message handling.
 *              It also allows the user to toggle visibility of clients, and to control animation
 *              playback.
 * DATE: March 12, 2015
 * DESIGNER: Calvin Rempel
 * PROGRAMMER: Calvin Rempel
 * REVISIONS: March 13, 2015 - Calvin Rempel: Added Marker Retrieval from Database
 *            March 14, 2015 - Calvin Rempel: Added Animation
 */
$().ready(function() {
    /** PRIVATE DATA **/
    var MAX_MARKERS_PER_DEVICE = 100;
    var map;
    var numToShowPerClient;
    var markers = {};
    var visibleMarkers = {};
    var visibleClients = [];
    var savedVisibleClients;
    var animator;
    
    /**
     * FUNCTION: init()
     * DESCRIPTION: Initialize SuperBigBrother3000. Setup UI and the WebClient.
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     */
    function init()
    {
        numToShowPerClient = MAX_MARKERS_PER_DEVICE;
        
        // Get Buttons for Playback Control
        var buttonPlay = $("#play");
        var buttonPause = $("#pause");
        var buttonStop = $("#stop");
        
        // Bind actions to playback buttons
        buttonPlay.on('click', onPlay);
        buttonPause.on('click', onPause);
        buttonStop.on('click', onStop);
        
        // Bind "Apply" button to action
        $("#set-num-markers").on('click', setNumMarkers);
        
        // Initialize the map.
        var mapOptions = {
            zoom: 8,
            center: new google.maps.LatLng(49, -123)
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        
        // Create Animator
        animator = new MapPlayback(map, onAnimationStopped, buttonPlay, buttonPause, buttonStop);
        
        // Get all Devices and Add them to the device list!
        getAllDevices(onGetAllDevices);
        
        // Start Listening for Server Updates
        try
        {
            var client = new WebClient();
            client.setCallback(handleServerMessage);
            client.connect('74.91.112.181', 7001);
        }
        catch(exception)
        {
            console.log("Connection Error:");
            console.log(exception);
        }
    }
    
    /**
     * FUNCTION: handleServerMessage(message)
     * DESCRIPTION: Respond to messages from the Server connected via websockets. Provided as a
     *              callback to WebClient.
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param JSON message returned data from the Server
     */
    function handleServerMessage(message)
    {
        // If no message type is specified, it is implicitly a GPS Update
        if (message.msgType === undefined)
        {
            addGpsPing(message);
        }
        // If the message type is "setup" add all supplied connected devices
        else if (message.msgType === "setup")
        {
            for (i = 0; i < message.devices.length; i+=1)
            {
                addDevice(message.devices[i], true);
            }
        }
        // If the message type is "connected" add the connected device
        else if (message.msgType === "connected")
        {
            addDevice(message.id, true);
        }
        // If the message type is "disconnected" remove the connected device
        else if (message.msgType === "disconnected")
        {
            removeLiveUser(message.id);
        }
    }
    
    /**
     * FUNCTION: toggleVisibility(id, overrideUI, visible)
     * DESCRIPTION: Toggle the visibility of the markers associated with the given client.
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param string id the ID of the client whose markers to toggle
     * @param boolean overrideUI {optional} if true, override the UI checkboxes
     * @param boolean visible {optional} only used if overrideUI is true
     */
    function toggleVisibility(id, overrideUI, visible)
    {
        // Set Default values for optional parameters
        if (typeof(overrideUI)==='undefined') overrideUI = false;
        if (typeof(visible)==='undefined') visible = true;
        
        // Enable Visibility
        if ((overrideUI && visible) || (!overrideUI && document.getElementById('vis_' + id).checked))
        {
            // Get the Clients history
            visibleMarkers[id] = 0;
            visibleClients.push(id);
            markers["id_" + id] = [];
            getRecentHistory(id, numToShowPerClient, onGetHistory);
        }
        // Disable Visibility
        else
        {
            // Set the map of all markers to null
            for (var i = 0; i < markers["id_" + id].length; i+=1)
            {
                markers["id_" + id][i].setMap(null);
            }
            
            // Mark the client id as not visible
            delete visibleMarkers[id];
            markers["id_" + id] = [];
            
            var index = visibleClients.indexOf(id);
            visibleClients.splice(index, 1);
        }
    }
    
    /**
     * FUNCTION: addDevice(id, live)
     * DESCRIPTION: Add a new Live Android Device to the Page
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param String id the ID of the Android Device
     * @param Boolean live if True, the device is live, if false it is not
     */
    function addDevice(id, live)
    {
        var element = document.getElementById("#tracked-" + id);
        
        // Existing User came online
        if (element)
        {
            // Change Live Indicator
            var img = element.getElementsByTagName("img")[0];
            img.setAttribute("src", "img/live.png");
            img.setAttribute("alt", "Live");
        }
        // New user (not seen before)
        else
        {
            // If currently playing, disable and uncheck, otherwise check and enable
            var disabled = animator.isPlaying() ? 'disabled' : '';
            
            // Add HTML to the users table
            var html;
            html = "<tr id='#tracked-" + id + "'>";
            html +=     "<td>" + id + "</td>";
            html +=     "<td><input id='vis_"+id+"' type='checkbox' " + disabled + " /></td>";
            
            // Indicate whether online or not
            if (live)
            {
                html +=     "<td><img src='img/live.png' alt='Live' /></td>";
            }
            else
            {
                html +=     "<td><img src='img/not-live.png' alt='Not Live' /></td>";
            }
            html += "</tr>";
            $("#live-users").append(html);
            
            // Add a change listener to the checkbox to toggle visibility
            document.getElementById("vis_" + id).addEventListener("change", function(){
                toggleVisibility(id);
            });
            
            // Update lifetime tracker counter
            var numTotal = parseInt($("#total-users-count").html());
            $("#total-users-count").html(numTotal + 1);
        }
        
        // Create Map Entry for the device
        if (!("id_" + id in markers))
            markers["id_" + id] = [];
        
        // Update the Track Counter
        if (live)
        {
            var numLive = parseInt($("#live-users-count").html());
            $("#live-users-count").html(numLive + 1);
        }
    }
    
    /**
     * FUNCTION: removeLiveUser(id)
     * DESCRIPTION: Mark an existing live device as no longer live
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param String id the id of the device
     */
    function removeLiveUser(id)
    {
        var element = document.getElementById("#tracked-" + id);
        
        // Ensure the user was previously added before setting them as offline
        if (element)
        {
            // Change Live Indicator
            var img = element.getElementsByTagName("img")[0];
            img.setAttribute("src", "img/not-live.png");
            img.setAttribute("alt", "Not Live");
            
            // Update the Track Counter
            var numLive = parseInt($("#live-users-count").html());
            $("#live-users-count").html(numLive - 1);
        }
    }
    
    /**
     * FUNCTION: addGpsPing(gpsPing)
     * DESCRIPTION: Add a GPS Ping to the Map
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param Object gpsPing the data containing the gps ping data
     */
    function addGpsPing(gpsPing)
    {
        // If the program is not a state of accepting the clients pings, return immediately
        if (!document.getElementById('vis_' + gpsPing.id).checked || animator.isPlaying())
            return;
        
        // Increase the visible marker count for the client
        visibleMarkers[gpsPing.id] += 1;
        
        // If adding a marker will cause the markers too many markers, remove the oldest
        if (visibleMarkers[gpsPing.id] > numToShowPerClient)
        {
            visibleMarkers[gpsPing.id] = Math.max(numToShowPerClient, visibleMarkers[gpsPing.id] + 1);
            markers["id_"+gpsPing.id][0].setMap(null);
            markers["id_"+gpsPing.id].splice(0, 1);
        }
        
        var markerData = {
            position: new google.maps.LatLng(gpsPing.lat, gpsPing.lon),
            map: map
        };
        
        // Create the marker
        var marker = new google.maps.Marker(markerData);
        var inserted = false;
        
        var infowindow = new google.maps.InfoWindow({
            content: buildInfoHtml(gpsPing)
        });
        
        google.maps.event.addListener(marker, 'click', function() {
          infowindow.open(map,marker);
        });
        
        // Add the marker to the list of markers
        markers["id_"+gpsPing.id].push(marker);
    }
    
    /**
     * FUNCTION: setNumberMakers(event)
     * DESCRIPTION: Set the number of markers to show per client (called by pressing "apply")
     * DATE: March 13, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param the event that triggered the event
     */
    function setNumMarkers(event)
    {
        // Get the Max Number of Markers to Show
        var count = $("#num-markers").val();
        count = parseInt(count);

        // If no number set or number greater than max, use max number value
        if (isNaN(count) || count > MAX_MARKERS_PER_DEVICE)
        {
            count = MAX_MARKERS_PER_DEVICE;
            $("#num-markers").val(count);
        }
        else if (count < 0)
        {
            count = 0;
            $("#num-markers").val(count);
        }
        
        numToShowPerClient = count;
        var clients = visibleClients.slice();
        
        // Update all visible clients
        for (var i = 0; i < clients.length; i += 1)
        {
            var id = clients[i];
            toggleVisibility(id, true, false);
            toggleVisibility(id);
        }
    }   
    
    /**
     * FUNCTION: onGetAllDevices(devices)
     * DESCRIPTION: The callback provided to MongoInterface getAllDevices(). It populates the device
     *              list with the returned devices.
     * DATE: March 13, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param String[] devices the id's of the devices that have connected in the past
     */
    function onGetAllDevices(devices)
    {
        for (var i=0; i < devices.length; i+=1)
        {
            addDevice(devices[i], false);
        }
    }
    
    /**
     * FUNCTION: onGetHistory(history)
     * DESCRIPTION: The callback to MongoInterface getRecentHistory(). When history is returned for
     *              a client, add the markers to the map.
     * DATE: March 13, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param history the clients history
     */
    function onGetHistory(history)
    {
        for (var i = 0; i < history.length; i+=1)
        {
            addGpsPing(history[i]);
        }
    }
    
    /**
     * FUNCTION: buildInfoHtml(gpsPing)
     * DESCRIPTION: Build the HTML for a marker info window with the given gpsPing data.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param JSON Object gpsPing the GPS Ping data to display
     * @returns HTML the html used to display the information
     */
    function buildInfoHtml(gpsPing)
    {
        var date = new Date(gpsPing.timestamp*1000);
        var html;
        
        html =  '<div class="map-marker-info">';
        html +=     '<h3>' + gpsPing.id + '</h3>';
        html +=     '<table>';
        html +=         '<tr>';
        html +=             '<td>Date </td><td>' + date.toLocaleString() + '</td>';
        html +=         '</tr>';
        html +=         '<tr>';
        html +=             '<td>IP:Port </td><td>' + gpsPing.ip + '</td>';
        html +=         '</tr>';
        html +=         '<tr>';
        html +=             '<td>Latitude </td><td>' + gpsPing.lat + '</td>';
        html +=         '</tr>';
        html +=         '<tr>';
        html +=             '<td>Longitude </td><td>' + gpsPing.lon + '</td>';
        html +=         '</tr>';
        html +=         '<tr>';
        html +=             '<td>Altitude </td><td>' + gpsPing.altitude + '</td>';
        html +=         '</tr>';
        html +=         '<tr>';
        html +=             '<td>Speed </td><td>' + gpsPing.speed + '</td>';
        html +=         '</tr>';
        html +=     '</table>';
        html += '</div>';
        
        return html;
    }
    
    /**
     * FUNCTION: onPlay(event)
     * DESCRIPTION: The callback that is triggered by pressing "play". Builds a copy of the visible
     *              markers, then removes all markers from the map and starts the Animator playback.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param Event event the Event that triggered the call.
     */
    function onPlay(event)
    {
        $("#set-num-markers").prop('disabled', 'true');
        $("input[type=checkbox]").prop('disabled', 'true');
        
        var animMarkers = [];
        
        // Build a 2D array of the markers to animate over
        if (!animator.isPlaying())
        {
            savedVisibleClients = visibleClients.slice(0);
            for (var i = 0; i < savedVisibleClients.length; i += 1)
            {
                var _markers = markers['id_' + savedVisibleClients[i]].slice(0);
                animMarkers[i] = _markers;
                toggleVisibility(savedVisibleClients[i], true, false);
            }
        }
        
        animator.play(animMarkers);
    }
    
    /**
     * FUNCTION: onPause(event)
     * DESCRIPTION: The callback that is triggered by pressing "pause". Pauses Animator playback.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param Event event the Event that triggered the call.
     */
    function onPause(event)
    {
        animator.pause();
    }
    
    /**
     * FUNCTION: onStop(event)
     * DESCRIPTION: The callback that is triggered by pressing "stop". Stops Animator playback.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param Event event the Event that triggered the call.
     */
    function onStop(event)
    {
        animator.stop();
        $("#set-num-markers").removeAttr('disabled');
        $("input[type=checkbox]").removeAttr('disabled');
    }
    
    /**
     * FUNCTION: onAnimationStopped()
     * DESCRIPTION: The callback that is triggered when the Animator has stopped animating. Restores
     *              the markers that were visibile before starting animation playback.
     * DATE: March 14, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     */
    function onAnimationStopped()
    {
        visibleClients = savedVisibleClients.splice(0);
        setNumMarkers(null);
    }
    
    /**
     * Initialize SuperBigBrother3000 once all compontents are loaded.
     */
    init();
});