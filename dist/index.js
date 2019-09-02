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
 * @classdesc Represents the ECRX Wallet SDK. It allows the client applications to integrate with wallet functionalities
 * @class
 */
var ecrx =
/*#__PURE__*/
function () {
  /**
   * Create an ecrx object
   * @constructor
   * @param {String} options.callbackURL - Callback URL once the request has been fulfilled
   */
  function ecrx(options) {
    _classCallCheck(this, ecrx);

    this.callbackURL = options.callbackURL;
    this.clientId = _uuid["default"].v4();
    this.connectWebSocket();
  }
  /**
   * Connects to websocket and binds with associated events
   */


  _createClass(ecrx, [{
    key: "connectWebSocket",
    value: function connectWebSocket() {
      var _this = this;

      this.webSocket = new WebSocket("".concat(this.callbackURL, "/?id=").concat(this.clientId)); // Attach event listeners

      this.webSocket.onopen = function () {
        _this.connected = true;
      };

      this.webSocket.onclose = function () {
        _this.connected = false;
      };

      this.webSocket.onerror = function (e) {
        console.error("ERR ecrx: ", e);
      };

      this.webSocket.onmessage = function (e) {
        handleResponse(e);
      };
    }
    /**
     * Request account from ECRX Wallet
     * @return {Promise} Account - Returns a promise that, when fulfilled, will either return 
     * a JSON object bearing the account information or an Error detailing the issue
     */

  }, {
    key: "getAccount",
    value: function getAccount() {
      var request = {
        payload: {
          action: Actions.WALLET_LOGIN
        },
        requestId: this.clientId
      };
      return Utils.generateDeepLink(request);
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
      throw "Not implemented exception";
    }
    /**
     * Handle incoming requests connecting apps and parse to JSON
     * @param {String} request - String detailing the request
     * @return {JSON} JSON object bearing the account information or an Error detailing the issue
     */

  }, {
    key: "parseRequest",
    value: function parseRequest(request) {
      var regex = /[?&]([^=#]+)=([^&#]*)/g,
          params = {},
          match;

      while (match = regex.exec(url)) {
        params[match[1]] = match[2];
      }
    }
    /**
     * Invoke ECRX Wallet
     * @param {JSON} request - JSON object containing the request that needs to be fulfilled
     */

  }, {
    key: "invokeWallet",
    value: function invokeWallet(request) {
      return Utils.generateDeepLink(request);
    }
  }]);

  return ecrx;
}();
/**
 * @classdesc Helper functions
 * @class
 */


exports["default"] = ecrx;

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
  }]);

  return Utils;
}();
/**-----------------------------
 *       SDK CONSTANTS
-------------------------------*/


var UserAgent = {
  USER_AGENT_IOS: 'ios',
  USER_AGENT_ANDROID: 'android',
  USER_AGENT_DESKTOP_WEB: 'desktop-web',
  USER_AGENT_MOBILE_WEB: 'mobile-web'
};
var WalletConstants = {
  WALLET_NAME: 'sigprovider'
};
var Actions = {
  WALLET_LOGIN: 'login'
};