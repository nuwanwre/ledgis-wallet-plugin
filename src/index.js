import uuid from 'uuid';
import { box, randomBytes } from 'tweetnacl';
import {
    decodeUTF8,
    encodeUTF8,
    encodeBase64,
    decodeBase64,
} from 'tweetnacl-util';

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
        this.keyPair = Utils.generateKeyPair();
    }

    /**
     * Connects to websocket and binds with associated events
     * @param {function} - A callback function to return response events from WS
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
            const encrypted = e.data.data;
            const shared = box.before(e.data.publicKey, this.keyPair.secretKey)
            const decrypted = Utils.decrypt(shared, encrypted);

            e.data.data = decrypted;
            callback(e.data);
        }
    }

    /**
     * Reconnects the websocket in the case of an connection reset
     * Note: 
     * No callback function is passed on this function
     */
    reconnectWebSocket() {
        return new Promise((resolve,reject) => {
            this.webSocket = new WebSocket(`${this.webSocketURL}/?id=${this.clientId}`);
            
            this.webSocket.onopen = () => {
                this.connected = true;
                resolve(true);
            };
        
            this.webSocket.onclose = () => {
                this.connected = false;
                reject(false);
            }
            
            this.webSocket.onerror = (e) => {
                this.connected = false;
                this.webSocket.close();
                reject(e);
            }
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
            publicKey: this.keyPair.publicKey,
        };

        return Utils.generateDeepLink(request);
    }

    /**
     * Request transaction authorization from LEDGIS Wallet
     * @param {String} request.currentAccount - Name of the account which the transaction should be executed
     * @param {JSON} request.action - JSON object detailing the action that needs to be executed
     * @return {URL} - A deep link URL to invoke the wallet
     */
    sendAction(request) {
        const sendRequest = {
            payload: {
                action: Actions.WALLET_TRANSACTION,
                callbackURL: this.webSocketURL,
                fallbackURL: this.fallbackURL,
                currentAccount: request.currentAccount,
                request: request.action,
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
        return new Promise ((resolve, reject) => {
            this.reconnectWebSocket()
            .then(() => {
                try {
                    const sharedA = box.before(response.publicKey, this.keyPair.secretKey);
                    const encryptedData = Utils.encrypt(sharedA, response.data);
                    
                    response.publicKey = this.keyPair.publicKey;
                    response.data = encryptedData;
                    this.webSocket.send(response);
                    resolve(true);
                }
                catch (e) {
                    reject(e);
                }
            })
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

    /**
     * Encrypts using keypair
     * @return {String} A fully base64 encrypted message
     */
    static encrypt(secretOrSharedKey, json, key) {
        const nonce = this.newNonce();
        const messageInUTF8 = decodeUTF8(JSON.stringify(json));
        const encrypted = key ? box(messageInUTF8, nonce, key, secretOrSharedKey) :
                                box.after(messageInUTF8, nonce, secretOrSharedKey);

        const fullMessage = new Uint8Array(nonce.length + encrypted.length);
        fullMessage.set(nonce);
        fullMessage.set(encrypted, nonce.length);

        const base64FullMessage = encodeBase64(fullMessage);
        return base64FullMessage;
    }

    /**
     * Decrypt using Keypair
     * @return {String} Decoded data
     */
    static decrypt(secretOrSharedKey, messageWithNonce, key) {
        const messageWithNonceUTF8 = decodeBase64(messageWithNonce);
        const nonce = messageWithNonceUTF8.slice(0, box.nonceLength);
        const message = messageWithNonceUTF8.slice(
            box.nonceLength,
            messageWithNonce.length
        );

        const decrypted = key ? box.open(message, nonce, key, secretOrSharedKey) :
                                box.open.after(message, nonce, secretOrSharedKey);

        if (!decrypted) {
            throw new Error('Could not decrypt message');
        }

        const base64DecryptedMessage = encodeUTF8(decrypted);
        return JSON.parse(base64DecryptedMessage);
    }

    /**
     * Creates a nonce
     * @return {String} A string containing the nonce
     */
    static newNonce() {
        return randomBytes(box.nonceLength);
    }

    /**
     * Generates a keypair, public and secret
     * @return {JSON} JSON payload
     */
    static generateKeyPair() {
        return box.keyPair();
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