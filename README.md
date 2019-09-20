# LEDGIS Wallet Plugin for JS based Applications

This library is meant to be used together with applications that are planning to integrate LEDGIS Mobile wallet into their respective applications. Target release platforms are JS based Web Apps and Hybrid mobile frameworks such as React Native to seamlessly integrate wallet functions.

This library utilizes the [Authentication Protocol](https://github.com/EOSIO/eosio-authentication-transport-protocol-spec) Specified by EOSIO. According this specification, three major components are involved when authenticating, or signing transactions.

![Sequence Diagram](https://i.imgur.com/YDT4C0T.png)


>A simple Websocket Relay that serves the purpose of the Callback server can be found [here](https://github.com/nuwanwre/simple-ws-relay)


## Integration Guide for Web Apps and dApps

This section shows how to authenticate and sign transactions using LEDGIS Wallet throughw dApp or Web App.

1. Use ```npm``` or ```yarn``` to install the package.

    `yarn add git+https://github.com/nuwanwre/ecrx-wallet-js-sdk.git`

2. Import the package.
   
    `import ecrx from '@ibct/ecrx-wallet-sdk';`

3. Initialize the instance
    ``` js
    const options = {
        webSocketURL: 'ws://192.168.1.78:1337',
        callback: this.callback,
        fallbackURL: 'https://dapp.io/fallback'
    }

    const ledgisObj = new ecrx(options);

    window.ledgis = ledgisObj;
    ```

    * **webSocketURL**: URL of the webSocket that acts as the relay from LEDGIS wallet to your dApp/Web App. Secured **wss** ports are recommended.
    * **callback**: A callback function that is essential on your dApp/Web App that will listen to incoming messages via the websocket. You need to implement this.
    * **fallbackURL**: A fallback URL to return from LEDGIS Wallet from once the request has been fulfilled or rejected.
    
        Depending on the application and the platform, the fallbackURL may differ.

        | Client - Platform          | fallbackURL                            |
        |----------------------------|:--------------------------------------:|
        | Safari - iOS               | `http://dapp.io/fallback`              |
        | Chrome - iOS               | `googlechrome://dapp.io/fallback`      |
        |                            | `googlechromes://dapp.io/fallback`     |
        | Firefox - iOS, Android     | `firefox://open-url?url=http://dapp.io`|

        Calling applications should provide correct URI schemes depending on the client platform.

    It's strongly recommend that you keep the created plugin object in a global scope to avoid making a new websocket connection with each request. 

    For subsequent requests, simply use `window.ledgis` object.

4. Invoking wallet on a certain action.

    **Authenticating and getting user account info**
    ```js
    // generate URL to invoke depending on the required action
    const location = ecrxObj.getAccount();

    // on Web
    window.location = location;

    // on React Native
    Linking.openURL(location);
    ```

    Once the request has been fulfilled by LEDGIS wallet, the response will be passed on to the callback function.
    ```js
    const callback = (res) => {
        console.log(res.data);
        
        // Do stuff
    }
    ```

## Integration Guide for LEDGIS Wallet

This section is for LEDGIS Wallet developers to integrate communication protocols to authenticate transactions, allowing full-duplex communication between dApps/Web Apps and LEDGIS Wallet.

1. Use ```npm``` or ```yarn``` to install the package.

    `yarn add git+https://github.com/nuwanwre/ecrx-wallet-js-sdk.git`

2. Import the package.
   
    `import ecrx from '@ibct/ecrx-wallet-sdk';`

3. Initialize the instance
    ``` js
    // Get the URL obtained via deep-linking
    // Linking.getInitialURL() <-- React Native
    const request = ecrx.parseRequest(url);

    const options = {
        webSocketURL: request.payload.callbackURL,
    }

    // Initialize ecrx object
    const ecrxObj = new ecrx(options);
    ```

    * **webSocketURL**: URL of the webSocket that acts as the relay from LEDGIS wallet to relevant dApp/Web App.

4. Completing a request
    ```js
    // Sample get account
    eosRpc.get_account('testaccount123').then(res => {
      const accData = `account: ${res.account_name}\nbalance: ${
        res.core_liquid_balance
      }`;

      const response = {
          requestId: request.requestId,
          success: true,
          data: accData,
      }
      ecrxObj.sendResponse(JSON.stringify(response));
    });
    ```

    * **sendResponse**: Returns a JSON Object to callbackURL
    * **requestId**: requestId originally specified by incoming deep link

## Complete API reference

* `getAccount()` - Invokes Ledgis wallet to get Account information

* `sendAction()` - Invokes Ledgis wallet on a certain action that can operate on the chain