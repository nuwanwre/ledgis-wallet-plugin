# ECRX Wallet Library for JS based Applications

This library is meant to be used together with applications that are planning to integrate ECRX Mobile wallet into their respective applications. Target release platforms are JS based Web Apps and Hybrid mobile frameworks such as React Native to seamlessly integrate wallet functions.

This library utilizes the Authentication Protocol Specified by [EOSIO](https://github.com/EOSIO/eosio-authentication-transport-protocol-spec). According this specification, three major components are involved when authenticating, or signing transactions.

![Sequence Diagram](https://i.imgur.com/YDT4C0T.png)


>A simple Websocket Relay that serves the purpose of the Callback server can be found [here](https://github.com/nuwanwre/simple-ws-relay)


## dApp/Web App Integration Guide

This section shows how to authenticate and sign transactions using ECRX Wallet through dApp or Web App.

1. Use ```npm``` or ```yarn``` to install the package.

    `yarn add git+https://github.com/nuwanwre/ecrx-wallet-js-sdk.git`

2. Import the package.
   
    `import ecrx from '@ibct/ecrx-wallet-sdk';`

3. Initialize the instance
    ``` js
    const options = {
        webSocketURL: 'ws://192.168.1.78:1337',
        callback: this.callback
    }

    const ecrxObj = new ecrx(options);
    ```

    * **webSocketURL**: URL of the webSocket that acts as the relay from ECRX wallet to your dApp/Web App. Secured **wss** ports are recommended.
    * **callback**: A callback function that is essential on your dApp/Web App that will listen to incoming messages via the websocket. You need to implement this.

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

    Once the request has been fulfilled by ECRX wallet, the response will be passed on to the callback function.
    ```js
    const callback = (res) => {
        console.log(res.data);
        
        // Do stuff
    }
    ```

## ECRX Wallet Integration Guide

This section is for ECRX Wallet developers to integrate communication protocols to authenticate transactions, allowing full-duplex communication between dApps/Web Apps and ECRX Wallet.

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

    * **webSocketURL**: URL of the webSocket that acts as the relay from ECRX wallet to relevant dApp/Web App.

4. Completing a request
    ```js
    // Sample get account
    eosRpc.get_account('testaccount123').then(res => {
      const accData = `account: ${res.account_name}\nbalance: ${
        res.core_liquid_balance
      }`;
      ecrxObj.sendResponse(JSON.stringify({to: request.requestId, data: accData}));
    });
    ```

    * **sendResponse**: Returns a JSON Object to callbackURL
    * **requestId**: requestId originally specified by incoming deep link

## Complete API reference

To be added 