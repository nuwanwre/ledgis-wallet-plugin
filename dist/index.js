"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _uuid = _interopRequireDefault(require("uuid"));

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
   */
  function ledgis(options) {
    _classCallCheck(this, ledgis);

    this.webSocketURL = options.webSocketURL;
    this.clientId = _uuid["default"].v4();
    this.callback = options.callback;
    this.connected = false;
    this.connectWebSocket(options.callback);
  }
  /**
   * Connects to websocket and binds with associated events
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
        callback(e);
      };
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
          callbackURL: this.webSocketURL
        },
        requestId: this.clientId
      };
      return Utils.generateDeepLink(request);
    }
    /**
     * Request transaction authorization from LEDGIS Wallet
     * @param {JSON} request - A JSON object with all the data required to request a transaction 
     * @return {URL} - A deep link URL to invoke the wallet
     */

  }, {
    key: "authorizeTransaction",
    value: function authorizeTransaction(request) {
      var sendRequest = {
        payload: {
          action: Actions.WALLET_TRANSACTION,
          callbackURL: this.webSocketURL,
          request: request
        },
        requestId: this.clientId
      };
      return Utils.generateDeepLink(sendRequest);
    }
    /**
     * Handle incoming responses from the websocket
     * @param {String} response - Contains the response relayed throught the callback server
     * @return {Promise} Account - Returns a promise that, when fulfilled, will either return 
     * a JSON object bearing the account information or an Error detailing the issue
     */

  }, {
    key: "handleResponse",
    value: function handleResponse(response) {
      alert(response);
      throw "Not implemented exception";
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
      if (this.connected) this.webSocket.send(response);else {
        this.connectWebSocket(this.callback);
        this.webSocket.send(response);
      }
    }
    /**
     * Handle incoming requests connecting apps and parse to JSON
     * @param {String} request - String detailing the request
     * @return {JSON} JSON object bearing the account information or an Error detailing the issue
     */

  }, {
    key: "invokeWallet",

    /**
     * Invoke LEDGIS Wallet
     * @param {JSON} request - JSON object containing the request that needs to be fulfilled
     */
    value: function invokeWallet(request) {
      return Utils.generateDeepLink(request);
    }
  }], [{
    key: "parseRequest",
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

      if (request.payload.action === Actions.WALLET_LOGIN) {
        return "".concat(WalletConstants.WALLET_NAME, "://request?payload=").concat(encoded, "&requestId=").concat(request.requestId);
      }
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