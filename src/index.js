import uuid from 'uuid';
import socketClient from 'socket.io-client';
/**
 * @classdesc Represents the LEDGIS Wallet Plugin. It allows the client applications to integrate with wallet functionalities
 * @class
 */
export default class ledgis {
    /**
     * Create an ecrx object
     * @constructor
     * @param {String} options.webSocketURL - webSocket URL once the request has been fulfilled
     * @param {String} options.callback - Callback function that listens to incoming websocket data
     * @param {String} options.fallbackURL - URL to fallback once the request has been fulfilled/rejected
     * @param {String} options.appName - Name of the connecting app
     */
    constructor(options) {
        this.webSocketURL = options.webSocketURL;
        this.clientId = uuid.v4();
        this.callback = options.callback;
        this.fallbackURL = options.fallbackURL;
        this.connected = false;
        this.appName = options.appName;
        this.connectWebSocket(options.callback);
    }

    /**
     * Connects to websocket and binds with associated events
     * @param {function} - A callback function to return response events from WS
     */
    connectWebSocket(callback) {
        this.webSocket = socketClient(this.webSocketURL);

        this.webSocket.on('connect', () => {
            this.webSocket.emit('authentication', {
                clientId: this.clientId
            })
        })

        this.webSocket.on('authenticated', () => {
            this.connected = true;
        })

        this.webSocket.on('unauthorized', (reason) => {
            console.log(`WEBSOCKET_UNAUTHORIZED: ${reason}`);
            this.webSocket.disconnect();
            this.connected = false;
        });

        this.webSocket.on('disconnect', (reason) => {
            console.log(`WEBSOCKET_DISCONNECTED: ${reason}`);
            this.connected = false;
        });

        this.webSocket.on('message', (data) => {
            callback(data);
        });

        this.webSocket.open();
    }

    /**
     * Reconnects the websocket in the case of an connection reset
     * @returns {UUID}
     */
    reconnectWebSocket() {
        return new Promise((resolve, reject) => {
            this.webSocket = socketClient(this.webSocketURL);

            this.webSocket.on('connect', () => {
                this.webSocket.emit('authentication', {
                    clientId: this.clientId
                })
            })

            this.webSocket.on('authenticated', () => {
                this.connected = true;
            })

            this.webSocket.on('unauthorized', (reason) => {
                console.log(`WEBSOCKET_UNAUTHORIZED: ${reason}`);
                this.webSocket.disconnect();
                this.connected = false;
                reject(reason);
            });

            this.webSocket.on('disconnect', (reason) => {
                console.log(`WEBSOCKET_DISCONNECTED: ${reason}`);
                this.connected = false;
                reject(reason);
            });

            this.webSocket.on('message', (data) => {
                this.callback(data);
            });

            this.webSocket.open();
            resolve(true);
        })
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
     * @param {String} chainId - Chain ID of the account that you are requesting
     * @return {URL} - A deep link URL to invoke the wallet
     */
    getAccount(chainId) {
        if (chainId === "" || (typeof chainId === "undefined"))
            throw 'ChainId not defined';

        const request = {
            payload: {
                action: Actions.WALLET_LOGIN,
                callbackURL: this.webSocketURL,
                fallbackURL: this.fallbackURL,
                appName: this.appName,
                chainId: chainId,
            },
            requestId: this.clientId,
        };

        return Utils.generateDeepLink(request);
    }

    /**
     * Request transaction authorization from LEDGIS Wallet
     * @param {String} request.currentAccount - Name of the account which the transaction should be executed
     * @param {String} request.chainId - Chain ID of the account that you are requesting
     * @param {JSON} request.action - JSON object detailing the action that needs to be executed
     * @return {URL} - A deep link URL to invoke the wallet
     */
    sendAction(request) {
        if (request.chainId === "" || (typeof request.chainId === "undefined"))
            throw 'ChainId not defined';
        if (request.currentAccount === "" || (typeof request.currentAccount === "undefined"))
            throw 'CurrentAccount not defined';
        if (request.action === {} || (typeof request.action === "undefined"))
            throw 'Actions not defined';


        const sendRequest = {
            payload: {
                action: Actions.WALLET_TRANSACTION,
                callbackURL: this.webSocketURL,
                fallbackURL: this.fallbackURL,
                currentAccount: request.currentAccount,
                chainId: request.chainId,
                request: request.action,
                appName: this.appName,
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
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                this.reconnectWebSocket()
                    .then(() => {
                        try {
                            this.webSocket.emit({payload: response});
                            resolve(true);
                        } catch (e) {
                            reject(e);
                        }
                    })
            } else {
                try {
                    this.webSocket.emit({payload: response});
                    resolve(true);
                } catch (e) {
                    reject(e);
                }
            }
        })
    };

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
 * @classdesc Utility functions to encode, decode, and generate Deep Links
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

        return `${WalletConstants.WALLET_NAME}://request?payload=${encoded}&requestId=${request.requestId}`;
    }

    /**
     * Parses a given string to hex
     * @param {String} payload - A JSON object containing the payload
     * @return {String} Encoded hex string containing the payload
     */
    static hexEncode(payload) {
        let hex, i;
        let result = "";
        for (i = 0; i < payload.length; i++) {
            hex = payload.charCodeAt(i).toString(16);
            result += ("000" + hex).slice(-4);
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
        for (j = 0; j < hexes.length; j++) {
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