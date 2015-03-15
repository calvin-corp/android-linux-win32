/**
 * FILE: MongoInterface.js
 * DESCRIPTION: This file provides an interface for retreiving data from a MongoLabs Database.
 * DATE: March 14, 2015
 * DESIGNER: Eric Tsang
 * PROGRAMMER: Calvin Rempel
 */

/**
 * API KEY for MongoLabs Database
 */
API_KEY = 'nxNLPjBWmx7LTIZTFxEdH52YO20vVzEo';

/**
 * FUNCTION: getRecentHistory(id, count, onRespond)
 * DESCRIPTION: Get the last 'count' records for the client with the given id. When done, onRespond
 *              is called with the retrieved values.
 * DATE: March 14, 2015
 * DESIGNER: Eric Tsang
 * PROGRAMMER: Eric Tsang
 * 
 * @param String id the client ID
 * @param Integer count the number of records to retrieve
 * @param Function onRespond callback function to call when results are available
 */
getRecentHistory = function(id,count,onRespond)
{
    var request = new XMLHttpRequest();

    // Build the HTTP Query
    var query = 'https://api.mongolab.com/api/1/databases/locations/collections/locations'
        +'?apiKey='+API_KEY
        +'&l='+count
        +'&s={"timestamp":-1}'
        +'&q={"id":"'+id+'"}';

    // Call onRespond when the results are available
    request.open('GET',query,true);
    request.onreadystatechange = function() {
        if(request.status == 200 && request.readyState == 4)
        {
            // Call the callback function with the returned data.
            onRespond(JSON.parse(request.responseText));
        }
    };

    // Make the HTTP Request
    request.send();
}

/**
 * FUNCTION: getAllDevices(onRespond)
 * DESCRIPTION: Get all client id's that have ever sent GPS data to the server. Call onRespond with
 *              the list when it is retrieved.
 * DATE: March 14, 2015
 * DESIGNER: Eric Tsang
 * PROGRAMMER: Eric Tsang
 * 
 * @param Function onRespond callback function to call when results are available
 */
getAllDevices = function(onRespond)
{
    var request = new XMLHttpRequest();

    // Build the HTTP request.
    var url = 'https://api.mongolab.com/api/1/databases/locations/runCommand?apiKey='+API_KEY;

    request.open('POST',url,true);
    request.setRequestHeader("type","POST");
    request.setRequestHeader("Content-Type","application/json");

    // Call onRespond when the results are available
    request.onreadystatechange = function() {
        if(request.status == 200 && request.readyState == 4)
        {
            onRespond(JSON.parse(request.responseText).values);
        }
    };

    // Make the HTTP Request
    request.send(JSON.stringify({"distinct":"locations","key":"id","filter":{"id":1}}));
}
