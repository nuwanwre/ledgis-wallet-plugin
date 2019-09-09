import WS from 'jest-websocket-mock';
import ecrx from '../src/index';

const server = new WS("ws://localhost:1773");

/**----------------------
 *  Init new ecrx object
 -------------------------**/
 test('Initialze new ecrx object', async () => {
     const options = {
         webSocketURL: 'ws://localhost:1773',
        };

    const ecrxObj = new ecrx(options);
    await server.connected;
    
    expect(ecrxObj.getClientId()).toBeDefined();
    expect(ecrxObj.getIsConnected()).toBe(true);
})

afterAll(() => {
    WS.clean();
})
