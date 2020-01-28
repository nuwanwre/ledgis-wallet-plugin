# LEDGIS Wallet Plugin for JS based Applications

**Update: This library is no longer maintained at this repository. It has been moved [here](https://github.com/ibct-dev/ledgis-wallet-plugin)**

This library is meant to be used together with applications that are planning to integrate LEDGIS Mobile wallet into their respective applications. Target release platforms are JS based Web Apps and Hybrid mobile frameworks such as React Native to seamlessly integrate wallet functions.

This library utilizes the [Authentication Protocol](https://github.com/EOSIO/eosio-authentication-transport-protocol-spec) Specified by EOSIO. According this specification, three major components are involved when authenticating, or signing transactions.

![Sequence Diagram](https://i.imgur.com/YDT4C0T.png)


>A simple Websocket Relay that serves the purpose of the Callback server can be found [here](https://github.com/nuwanwre/simple-ws-relay)


## Integration Guide for Web Apps and dApps

This section shows how to authenticate and sign transactions using LEDGIS Wallet throughw dApp or Web App.

1. Use ```npm``` or ```yarn``` to install the package.

    ``` bash
    yarn add git+https://github.com/nuwanwre/ledgis-wallet-plugin.git
    ```

2. Import the package.
   
    ``` js
    import ecrx from '@ibct/ledgis-wallet-plugin';
    ```

3. Initialize the instance
    ``` js
    const options = {
        webSocketURL: 'ws://192.168.1.78:1337',
        callback: this.callback,
        fallbackURL: 'https://dapp.io/fallback',
        appName: 'myapp'
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
        | Firefox - iOS, Android     | `firefox://open-url?url=http://dapp.io` |
        | Native App - iOS, Android  | `myapp://fallback`                     |

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

### Note on dApps on iOS using Ledgis Wallet Plugin 

On iOS, native applications are unable to keep a WebSocket connection open for more than 30 seconds due to resoure limitations. To tackle this issue, native dApps can utilize application state to reconnect to websocket. 

For React Native, a guide on App States can be found [here](https://facebook.github.io/react-native/docs/appstate)

Sample code on how to utilize this function,

```js
 ledgis.reconnectWebSocket()
    .then(() => alert('connected'))
    .catch(e => alert(e));
```

Initializing a new ledgis object will discard old responses, and the cache will be invalidated. Therefore, reconnecting to the existing websocket should suffice.

## Integration Guide for LEDGIS Wallet

This section is for LEDGIS Wallet developers to integrate communication protocols to authenticate transactions, allowing full-duplex communication between dApps/Web Apps and LEDGIS Wallet.

1. Use ```npm``` or ```yarn``` to install the package.

    `yarn add git+https://github.com/nuwanwre/ecrx-wallet-js-sdk.git`

2. Import the package.
   
    ```js
    import ecrx from '@ibct/ecrx-wallet-sdk';
    ```

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

Assume `ledgis` is previously instantiated object.

* `getAccount()` - Invokes Ledgis wallet to get Account information

    Get account action requires that the requesting app provide Chain ID of the blockchain.
    
    **Login Request**
    ```js
    const loginURL = window.ledgis.getAccount('<chainID>');

    window.location = loginURL; // Web only
    Linking.openURL(loginURL).catch(err => // React-Native only
      // Handle errors
    );    
    ```

* `sendAction()` - Invokes Ledgis wallet on a certain action that can operate on the chain

    Action requests follows the eosjs format

    **Transfer Request**
    ```js
    const txReq = {
        currentAccount: 'test112.ibct',
        action: {
            actions: [{
                account: 'led.token',
                name: 'transfer',
                authorization: [{
                    actor: 'test111.ibct',
                    permission: 'owner',
                }],
                data: {
                    from: 'test111.ibct',
                    to: 'test112.ibct',
                    quantity: '1.0000 LED',
                    memo: 'Signed with Ledgis Mobile',
                },
            }]
        }
    }

    const txURL = window.ledgis.sendAction(txRequest);
    window.location = txURL; // Web only
    Linking.openURL(txURL).catch(err => // React-Native only
      // Handle errors
    );    
    ```

    **Stake Request**
    ```js
    const txRequest = {
        currentAccount: 'test111.ibct',
        action: {
            actions: [{
            account: 'led',
            name: 'delegatebw',
            authorization: [{
                actor: 'test111.ibct',
                permission: 'owner',
            }],
            data: {
                from: 'test111.ibct',
                receiver: 'test111.ibct',
                stake_net_quantity: "1.0000 LED",
                stake_cpu_quantity: "1.0000 LED",
                transfer:false
            },
        }]
    }

    const txURL = window.ledgis.sendAction(txRequest);
    window.location = txURL; // Web only
    Linking.openURL(txURL).catch(err => // React-Native only
      // Handle errors
    );
    ```
