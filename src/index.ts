import { HuijiWiki } from './HuijiWiki/HuijiWiki';

async function tryTest() {
    const test = new HuijiWiki('danteng');
    if (await test.login('Yuee bot', '')) {
        console.log('login success');
    } else {
        console.log('login failed');
        return;
    }

    const res = await test.edit('Testabc', 'testcontentB', {
        summary: 'test',
        isBot: false,
    });

    console.log(JSON.stringify(res));
}

tryTest();

export { HuijiWiki };
