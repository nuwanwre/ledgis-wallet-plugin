"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _uuid = _interopRequireDefault(require("uuid"));

var _tweetnacl = require("tweetnacl");

var _tweetnaclUtil = require("tweetnacl-util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * @classdesc Represents the LEDGIS Wallet SDK. It allows the client applications to integrate with wallet functionalities
 * @class
 */
var ledgis =
/*#__PURE__*/
function () {
  /**
   * Create an ecrx object
   * @constructor
   * @param {String} options.webSocketURL - webSocket URL once the request has been fulfilled
   * @param {String} options.callback - Callback function that listens to incoming websocket data
   * @param {String} options.fallbackURL - URL to fallback once the request has been fulfilled/rejected
   */
  function ledgis(options) {
    _classCallCheck(this, ledgis);

    this.webSocketURL = options.webSocketURL;
    this.clientId = _uuid["default"].v4();
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


  _createClass(ledgis, [{
    key: "connectWebSocket",
    value: function connectWebSocket(callback) {
      var _this = this;

      this.webSocket = new WebSocket("".concat(this.webSocketURL, "/?id=").concat(this.clientId)); // Attach event listeners

      this.webSocket.onopen = function () {
        _this.connected = true;
      };

      this.webSocket.onclose = function () {
        _this.connected = false;
      };

      this.webSocket.onerror = function (e) {
        _this.connected = false;

        _this.webSocket.close();
      };

      this.webSocket.onmessage = function (e) {
        var encrypted = e.data.data;

        var shared = _tweetnacl.box.before(e.data.publicKey, _this.keyPair.secretKey);

        var decrypted = Utils.decrypt(shared, encrypted);
        e.data.data = decrypted;
        callback(e.data);
      };
    }
    /**
     * Reconnects the websocket in the case of an connection reset
     * Note: 
     * No callback function is passed on this function
     */

  }, {
    key: "reconnectWebSocket",
    value: function reconnectWebSocket() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.webSocket = new WebSocket("".concat(_this2.webSocketURL, "/?id=").concat(_this2.clientId));

        _this2.webSocket.onopen = function () {
          _this2.connected = true;
          resolve(true);
        };

        _this2.webSocket.onclose = function () {
          _this2.connected = false;
          reject(false);
        };

        _this2.webSocket.onerror = function (e) {
          _this2.connected = false;

          _this2.webSocket.close();

          reject(e);
        };
      });
    }
    /**
     * Gets the clientId associated with this instance
     * @returns {UUID} A unique id associcated with this instance
     */

  }, {
    key: "getClientId",
    value: function getClientId() {
      return this.clientId;
    }
    /**
     * Gets if current instance is connected to the websocket
     * @returns {boolean} connection status
     */

  }, {
    key: "getIsConnected",
    value: function getIsConnected() {
      return this.connected;
    }
    /**
     * Request account from LEDGIS Wallet
     * @return {URL} - A deep link URL to invoke the wallet
     */

  }, {
    key: "getAccount",
    value: function getAccount() {
      var request = {
        payload: {
          action: Actions.WALLET_LOGIN,
          callbackURL: this.webSocketURL,
          fallbackURL: this.fallbackURL
        },
        requestId: this.clientId,
        publicKey: this.keyPair.publicKey
      };
      return Utils.generateDeepLink(request);
    }
    /**
     * Request transaction authorization from LEDGIS Wallet
     * @param {String} request.currentAccount - Name of the account which the transaction should be executed
     * @param {JSON} request.action - JSON object detailing the action that needs to be executed
     * @return {URL} - A deep link URL to invoke the wallet
     */

  }, {
    key: "sendAction",
    value: function sendAction(request) {
      var sendRequest = {
        payload: {
          action: Actions.WALLET_TRANSACTION,
          callbackURL: this.webSocketURL,
          fallbackURL: this.fallbackURL,
          currentAccount: request.currentAccount,
          request: request.action
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

  }, {
    key: "sendResponse",
    value: function sendResponse(response) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.reconnectWebSocket().then(function () {
          try {
            var sharedA = _tweetnacl.box.before(response.publicKey, _this3.keyPair.secretKey);

            var encryptedData = Utils.encrypt(sharedA, response.data);
            response.publicKey = _this3.keyPair.publicKey;
            response.data = encryptedData;

            _this3.webSocket.send(response);

            resolve(true);
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }], [{
    key: "parseRequest",

    /**
     * Handle incoming requests connecting apps and parse to JSON
     * @param {String} request - String detailing the request
     * @return {JSON} JSON object bearing the account information or an Error detailing the issue
     */
    value: function parseRequest(request) {
      var regex = /[?&]([^=#]+)=([^&#]*)/g,
          params = {},
          match;

      while (match = regex.exec(request)) {
        params[match[1]] = match[2];
      }

      var payload = Utils.hexDecode(params.payload);
      var response = {
        payload: payload,
        requestId: params.requestId
      };
      return response;
    }
  }]);

  return ledgis;
}();
/**
 * @classdesc Helper functions
 * @class
 */


exports["default"] = ledgis;

var Utils =
/*#__PURE__*/
function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: "generateDeepLink",

    /**
     * Parses a request into a deep link
     * @param {String} request.body - A JSON object containing the action
     * @return {JSON} Deep link containg the request to the app
     */
    value: function generateDeepLink(request) {
      var encoded = Utils.hexEncode(JSON.stringify(request.payload));
      return "".concat(WalletConstants.WALLET_NAME, "://request?payload=").concat(encoded, "&requestId=").concat(request.requestId);
    }
    /**
     * Parses a given string to hex
     * @param {String} payload - A JSON object containing the payload
     * @return {String} Encoded hex string containing the payload
     */

  }, {
    key: "hexEncode",
    value: function hexEncode(payload) {
      var hex, i;
      var result = "";

      for (i = 0; i < payload.length; i++) {
        hex = payload.charCodeAt(i).toString(16);
        result += ("000" + hex).slice(-4);
      }

      return result;
    }
    /**
     * Parses a given hex to string
     * @param {String} payload - Hex encoded string containing the payload
     * @return {JSON} JSON payload
     */

  }, {
    key: "hexDecode",
    value: function hexDecode(payload) {
      var j;
      var hexes = payload.match(/.{1,4}/g) || [];
      var result = "";

      for (j = 0; j < hexes.length; j++) {
        result += String.fromCharCode(parseInt(hexes[j], 16));
      }

      return JSON.parse(result);
    }
    /**
     * Encrypts using keypair
     * @return {String} A fully base64 encrypted message
     */

  }, {
    key: "encrypt",
    value: function encrypt(secretOrSharedKey, json, key) {
      var nonce = this.newNonce();
      var messageInUTF8 = (0, _tweetnaclUtil.decodeUTF8)(JSON.stringify(json));
      var encrypted = key ? (0, _tweetnacl.box)(messageInUTF8, nonce, key, secretOrSharedKey) : _tweetnacl.box.after(messageInUTF8, nonce, secretOrSharedKey);
      var fullMessage = new Uint8Array(nonce.length + encrypted.length);
      fullMessage.set(nonce);
      fullMessage.set(encrypted, nonce.length);
      var base64FullMessage = (0, _tweetnaclUtil.encodeBase64)(fullMessage);
      return base64FullMessage;
    }
    /**
     * Decrypt using Keypair
     * @return {String} Decoded data
     */

  }, {
    key: "decrypt",
    value: function decrypt(secretOrSharedKey, messageWithNonce, key) {
      var messageWithNonceUTF8 = (0, _tweetnaclUtil.decodeBase64)(messageWithNonce);
      var nonce = messageWithNonceUTF8.slice(0, _tweetnacl.box.nonceLength);
      var message = messageWithNonceUTF8.slice(_tweetnacl.box.nonceLength, messageWithNonce.length);
      var decrypted = key ? _tweetnacl.box.open(message, nonce, key, secretOrSharedKey) : _tweetnacl.box.open.after(message, nonce, secretOrSharedKey);

      if (!decrypted) {
        throw new Error('Could not decrypt message');
      }

      var base64DecryptedMessage = (0, _tweetnaclUtil.encodeUTF8)(decrypted);
      return JSON.parse(base64DecryptedMessage);
    }
    /**
     * Creates a nonce
     * @return {String} A string containing the nonce
     */

  }, {
    key: "newNonce",
    value: function newNonce() {
      return (0, _tweetnacl.randomBytes)(_tweetnacl.box.nonceLength);
    }
    /**
     * Generates a keypair, public and secret
     * @return {JSON} JSON payload
     */

  }, {
    key: "generateKeyPair",
    value: function generateKeyPair() {
      return _tweetnacl.box.keyPair();
    }
  }]);

  return Utils;
}();
/**-----------------------------
 *       SDK CONSTANTS
-------------------------------*/


var WalletConstants = {
  WALLET_NAME: 'ledgis'
};
var Actions = {
  WALLET_LOGIN: 'login',
  WALLET_TRANSACTION: 'transaction'
};