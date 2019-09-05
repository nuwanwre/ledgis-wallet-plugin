import WS from 'jest-websocket-mock';
import ecrx from '../src/index';

const server = new WS("ws://localhost:1773");

/**----------------------
 *  Init new ecrx object
 -------------------------**/
 test('Initialze new ecrx object', () => {
     const options = {
         webSocketURL: 'ws://localhost:1773',
        };

    const ecrxObj = new ecrx(options);
    
    expect(ecrxObj.getClientId()).toBeDefined();
    expect(ecrxObj.getIsConnected()).toBeTruthy(true);
})

afterAll(() => {
    WS.clean();
})
