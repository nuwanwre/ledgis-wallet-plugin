import uuid from 'uuid';

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
            payload: {
                action: Actions.WALLET_LOGIN
            },
            requestId: this.clientId,
        }

        return Utils.generateDeepLink(request);
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
     * Handle incoming requests connecting apps and parse to JSON
     * @param {String} request - String detailing the request
     * @return {JSON} JSON object bearing the account information or an Error detailing the issue
     */
    parseRequest(request) {
        let regex = /[?&]([^=#]+)=([^&#]*)/g,
        params = {},
        match;
        while ((match = regex.exec(url))) {
            params[match[1]] = match[2];
        }
    }

    /**
     * Invoke ECRX Wallet
     * @param {JSON} request - JSON object containing the request that needs to be fulfilled
     */
    invokeWallet(request) {
        return Utils.generateDeepLink(request);
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
}

/**-----------------------------
 *       SDK CONSTANTS
-------------------------------*/

const UserAgent = {
    USER_AGENT_IOS: 'ios',
    USER_AGENT_ANDROID:'android',
    USER_AGENT_DESKTOP_WEB: 'desktop-web',
    USER_AGENT_MOBILE_WEB: 'mobile-web'
};

const WalletConstants = {
    WALLET_NAME: 'sigprovider'
};

const Actions = {
    WALLET_LOGIN: 'login'
};