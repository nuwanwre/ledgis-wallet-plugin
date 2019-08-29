import uuid from 'uuid';

import { UserAgent } from './constants';

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

    }

    /**
     * Handle incoming responses from the websocket
     * @param {String} - Contains the response relayed throught the callback server
     * @return {Promise} Account - Returns a promise that, when fulfilled, will either return 
     * a JSON object bearing the account information or an Error detailing the issue
     */
    getAccount() {

    }

    helloWorld() {
        return "Hello World!";
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
        throw "Not implemented";
    }
}