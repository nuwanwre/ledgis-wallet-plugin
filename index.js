import uuid from 'uuid';

import { Actions, WalletConstants } from './constants';

/**
 * @classdesc Represents the ECRX Wallet SDK. It allows the client applications to integrate with wallet functionalities
 * @class
 */
export default class ecrx {
    /**
     * Create an ecrx object
     * @constructor
     * @param {String} options.callbackURL - Callback URL once the request has been fulfilled
     */
    constructor(options) {
        this.callbackURL = options.callbackURL;
        this.clientId = uuid.v4();
        this.connectWebSocket();
    }
    
    /**
     * Connects to websocket and binds with associated events
     */
    connectWebSocket() {
        this.webSocket = new WebSocket(`${this.callbackURL}/?id=${this.clientId}`);
    
        // Attach event listeners
        this.webSocket.onopen = () => {
            this.connected = true;
        };
    
        this.webSocket.onclose = () => {
            this.connected = false;
        }
    
        this.webSocket.onerror = (e) => {
            console.error("ERR ecrx: ", e);
        }
    
        this.webSocket.onmessage = (e) => {
            handleResponse(e);
        }
    }

    /**
     * Request account from ECRX Wallet
     * @return {Promise} Account - Returns a promise that, when fulfilled, will either return 
     * a JSON object bearing the account information or an Error detailing the issue
     */
    getAccount() {
        const request = {
            action: Actions.WALLET_LOGIN
        }

        return new Promise((resolve, reject) => {
            
        })
    }

    /**
     * Handle incoming responses from the websocket
     * @param {String} response - Contains the response relayed throught the callback server
     * @return {Promise} Account - Returns a promise that, when fulfilled, will either return 
     * a JSON object bearing the account information or an Error detailing the issue
     */
    handleResponse(response) {
        throw "Not implemented exception";
    }

    /**
     * Invoke ECRX Wallet
     * @param {String} request - JSON object containing the request that needs to be fulfilled
     */
    invokeWallet(request) {
        const location = generateDeepLink(request);        
        window.location(location);
    }
}

/**
 * @classdesc Helper functions
 * @class
 */
class Utils {
    /**
     * Parses a request into a deep link
     * @constructor
     * @param {String} request.body - A JSON object containing the actionab
     */
    static generateDeepLink(request) {
        if (request.action === Actions.WALLET_LOGIN) {
            return `${WalletConstants.WALLET_NAME}://request?payload=${request.WALLET_LOGIN}`;
        }
    }
}