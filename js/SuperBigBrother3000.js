$().ready(function() {
    var map;
    
    /**
     * Initialize SuperBigBrother3000
     */
    function init()
    {
        // Initialize DateTime pickers
        $('#start-time').datetimepicker();
        $('#end-time').datetimepicker();
        
        // Initialize the map.
        var mapOptions = {
        zoom: 8,
        center: new google.maps.LatLng(-34.397, 150.644)
        };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }
    
    // Run the Initialization function.
    init();
});