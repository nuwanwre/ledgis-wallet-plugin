import uuid from 'uuid';

/**
 * @classdesc Represents the LEDGIS Wallet SDK. It allows the client applications to integrate with wallet functionalities
 * @class
 */
export default class ledgis {
    /**
     * Create an ecrx object
     * @constructor
     * @param {String} options.webSocketURL - webSocket URL once the request has been fulfilled
     * @param {String} options.callback - Callback function that listens to incoming websocket data
     * @param {String} options.fallbackURL - URL to fallback once the request has been fulfilled/rejected
     */
    constructor(options) {
        this.webSocketURL = options.webSocketURL;
        this.clientId = uuid.v4();
        this.callback = options.callback;
        this.fallbackURL = options.fallbackURL;
        this.connected = false;
        this.connectWebSocket(options.callback);
    }

    /**
     * Connects to websocket and binds with associated events
     */
    connectWebSocket(callback) {
        this.webSocket = new WebSocket(`${this.webSocketURL}/?id=${this.clientId}`);
    
        // Attach event listeners
        this.webSocket.onopen = () => {
            this.connected = true;
        };
    
        this.webSocket.onclose = () => {
            this.connected = false;
        }
    
        this.webSocket.onerror = (e) => {
            this.connected = false;
            this.webSocket.close();
        }
    
        this.webSocket.onmessage = (e) => {
            callback(e);
        }
    }

    /**
     * Gets the clientId associated with this instance
     * @returns {UUID} A unique id associcated with this instance
     */
    getClientId() {
        return this.clientId;
    }

    /**
     * Gets if current instance is connected to the websocket
     * @returns {boolean} connection status
     */
    getIsConnected() {
        return this.connected;
    }

    /**
     * Request account from LEDGIS Wallet
     * @param {JSON} request - A JSON object detailing the connecting app and relevant data
     * @return {URL} - A deep link URL to invoke the wallet
     */
    getAccount() {
        const request = {
            payload: {
                action: Actions.WALLET_LOGIN,
                callbackURL: this.webSocketURL,
                fallbackURL: this.fallbackURL,
            },
            requestId: this.clientId,
        };

        return Utils.generateDeepLink(request);
    }

    /**
     * Request transaction authorization from LEDGIS Wallet
     * @param {JSON} request - A JSON object with all the data required to request a transaction 
     * @return {URL} - A deep link URL to invoke the wallet
     */
    authorizeTransaction(request) {
        const sendRequest = {
            payload: {
                action: Actions.WALLET_TRANSACTION,
                callbackURL: this.webSocketURL,
                fallbackURL: this.fallbackURL,
                request: request
            },
            requestId: this.clientId
        };

        return Utils.generateDeepLink(sendRequest);
    }

    /**
     * Send response back to calling application
     * @param {String} response - Contains the response relayed throught the callback server
     * @return {Promise} Account - Returns a promise that, when fulfilled, will either return 
     * a JSON object bearing the account information or an Error detailing the issue
     */
    sendResponse(response) {
        if (!this.connected)
            this.connectWebSocket(this.callback);

        return new Promise((resolve, reject) => {
            try {
                this.webSocket.send(response);
                resolve(true);
            }
            catch (e) {
                reject(e);
            }
        })
    }

    /**
     * Handle incoming requests connecting apps and parse to JSON
     * @param {String} request - String detailing the request
     * @return {JSON} JSON object bearing the account information or an Error detailing the issue
     */
    static parseRequest(request) {
        let regex = /[?&]([^=#]+)=([^&#]*)/g,
        params = {},
        match;

        while ((match = regex.exec(request))) {
            params[match[1]] = match[2];
        }

        const payload = Utils.hexDecode(params.payload);

        const response = {
            payload: payload,
            requestId: params.requestId
        } 

        return response;
    }
}

/**
 * @classdesc Helper functions
 * @class
 */
class Utils {
    /**
     * Parses a request into a deep link
     * @param {String} request.body - A JSON object containing the action
     * @return {JSON} Deep link containg the request to the app
     */
    static generateDeepLink(request) {
        let encoded = Utils.hexEncode(JSON.stringify(request.payload));

        if (request.payload.action === Actions.WALLET_LOGIN) {
            return `${WalletConstants.WALLET_NAME}://request?payload=${encoded}&requestId=${request.requestId}`;
        }
    }

    /**
     * Parses a given string to hex
     * @param {String} payload - A JSON object containing the payload
     * @return {String} Encoded hex string containing the payload
     */
    static hexEncode(payload) {
        let hex, i;
        let result = "";
        for (i=0; i<payload.length; i++) {
            hex = payload.charCodeAt(i).toString(16);
            result += ("000"+hex).slice(-4);
        }
    
        return result
    }

    /**
     * Parses a given hex to string
     * @param {String} payload - Hex encoded string containing the payload
     * @return {JSON} JSON payload
     */
    static hexDecode(payload) {
        let j;
        let hexes = payload.match(/.{1,4}/g) || [];
        let result = "";
        for(j = 0; j<hexes.length; j++) {
            result += String.fromCharCode(parseInt(hexes[j], 16));
        }

        return JSON.parse(result);
    }
}

/**-----------------------------
 *       SDK CONSTANTS
-------------------------------*/

const WalletConstants = {
    WALLET_NAME: 'ledgis'
};

const Actions = {
    WALLET_LOGIN: 'login',
    WALLET_TRANSACTION: 'transaction'
};