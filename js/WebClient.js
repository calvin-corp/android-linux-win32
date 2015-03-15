/** 
 *  FILE: WebClient.js
 *  DESCRIPTION: WebClient is a class that simplifies connecting to a WebSocket and retreiving
 *               messages from the server.
 *  DESIGNER: Calvin Rempel
 *  PROGRAMMER: Calvin Rempel
 *  DATE: March 12, 2015
 */
var WebClient = function()
{
    var socket;
    var callback;
    
    /**
     * FUNCTION: connect(host, port)
     * DESCRIPTION: this function attempts to connect to the given host on the given port.
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param String host the Host to connect to.
     * @param Integer port the Port to communicate to the Host on.
     */
    this.connect = function(host, port)
    {
        // Do not allow connect to create multiple sockets
        if (socket === undefined)
        {
            socket = new WebSocket("ws://" + host + ':' + port + '/');
            socket.onmessage = messageReceived;
        }
    };
    
    /**
     * FUNCTION: setCallback(callbackFunction)
     * DESCRIPTION: change the handler that gets called when a server message is available.
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMME: Calvin Rempel
     * 
     * @param function callbackFunction the function to call when a server message is available
     */
    this.setCallback = function(callbackFunction)
    {
        callback = callbackFunction;
    }
    
    /**
     * 
     * ----- PRIVATE FUNCTIONS -----
     * 
     */
    
    /*
     * FUNCTION: messageReceived(message)
     * DESCRIPTION: This function is called when a server message is received and passes it to the
     *              user defined callback.
     * DATE: March 12, 2015
     * DESIGNER: Calvin Rempel
     * PROGRAMMER: Calvin Rempel
     * 
     * @param message the Server message
     */
    function messageReceived(message)
    {
        if (callback !== undefined)
        {
            var data = JSON.parse(message.data);
            callback(data);
        }
    }
};
