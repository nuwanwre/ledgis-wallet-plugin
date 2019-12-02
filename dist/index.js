"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _uuid = _interopRequireDefault(require("uuid"));

var _socket = _interopRequireDefault(require("socket.io-client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * @classdesc Represents the LEDGIS Wallet Plugin. It allows the client applications to integrate with wallet functionalities
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
   * @param {String} options.appName - Name of the connecting app
   */
  function ledgis(options) {
    _classCallCheck(this, ledgis);

    this.webSocketURL = options.webSocketURL;
    this.clientId = _uuid["default"].v4();
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


  _createClass(ledgis, [{
    key: "connectWebSocket",
    value: function connectWebSocket(callback) {
      var _this = this;

      this.webSocket = (0, _socket["default"])(this.webSocketURL);
      this.webSocket.on('connect', function () {
        _this.webSocket.emit('authentication', {
          clientId: _this.clientId
        });
      });
      this.webSocket.on('authenticated', function () {
        _this.connected = true;
      });
      this.webSocket.on('unauthorized', function (reason) {
        console.log("WEBSOCKET_UNAUTHORIZED: ".concat(reason));

        _this.webSocket.disconnect();

        _this.connected = false;
      });
      this.webSocket.on('disconnect', function (reason) {
        console.log("WEBSOCKET_DISCONNECTED: ".concat(reason));
        _this.connected = false;
      });
      this.webSocket.on('message', function (data) {
        callback(data);
      });
      this.webSocket.open();
    }
    /**
     * Reconnects the websocket in the case of an connection reset
     * @returns {UUID}
     */

  }, {
    key: "reconnectWebSocket",
    value: function reconnectWebSocket() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.webSocket = (0, _socket["default"])(_this2.webSocketURL);

        _this2.webSocket.on('connect', function () {
          _this2.webSocket.emit('authentication', {
            clientId: _this2.clientId
          });
        });

        _this2.webSocket.on('authenticated', function () {
          _this2.connected = true;
        });

        _this2.webSocket.on('unauthorized', function (reason) {
          console.log("WEBSOCKET_UNAUTHORIZED: ".concat(reason));

          _this2.webSocket.disconnect();

          _this2.connected = false;
          reject(reason);
        });

        _this2.webSocket.on('disconnect', function (reason) {
          console.log("WEBSOCKET_DISCONNECTED: ".concat(reason));
          _this2.connected = false;
          reject(reason);
        });

        _this2.webSocket.on('message', function (data) {
          _this2.callback(data);
        });

        _this2.webSocket.open();

        resolve(true);
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
     * @param {String} chainId - Chain ID of the account that you are requesting
     * @return {URL} - A deep link URL to invoke the wallet
     */

  }, {
    key: "getAccount",
    value: function getAccount(chainId) {
      if (chainId === "" || typeof chainId === "undefined") throw 'ChainId not defined';
      var request = {
        payload: {
          action: Actions.WALLET_LOGIN,
          callbackURL: this.webSocketURL,
          fallbackURL: this.fallbackURL,
          appName: this.appName,
          chainId: chainId
        },
        requestId: this.clientId
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

  }, {
    key: "sendAction",
    value: function sendAction(request) {
      if (request.chainId === "" || typeof request.chainId === "undefined") throw 'ChainId not defined';
      if (request.currentAccount === "" || typeof request.currentAccount === "undefined") throw 'CurrentAccount not defined';
      if (request.action === {} || typeof request.action === "undefined") throw 'Actions not defined';
      var sendRequest = {
        payload: {
          action: Actions.WALLET_TRANSACTION,
          callbackURL: this.webSocketURL,
          fallbackURL: this.fallbackURL,
          currentAccount: request.currentAccount,
          chainId: request.chainId,
          request: request.action,
          appName: this.appName
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
        if (!_this3.connected) {
          _this3.reconnectWebSocket().then(function () {
            try {
              _this3.webSocket.emit({
                payload: response
              });

              resolve(true);
            } catch (e) {
              reject(e);
            }
          });
        } else {
          try {
            _this3.webSocket.emit({
              payload: response
            });

            resolve(true);
          } catch (e) {
            reject(e);
          }
        }
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
 * @classdesc Utility functions to encode, decode, and generate Deep Links
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