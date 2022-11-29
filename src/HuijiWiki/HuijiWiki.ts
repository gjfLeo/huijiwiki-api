import { USER_AGENT } from '../config';
import { HuijiCookies } from './HuijiCookie';
import { HuijiRequests } from './HuijiRequests';

export interface HuijiWikiSession {
    prefix: string;
    cookie: HuijiCookies;
    csrftoken: string;
    apiUrl: string;
    headers: Record<string, string>;
    reqIndex: number;
    userName: string;
}

export class HuijiWiki {
    private session: HuijiWikiSession;

    constructor(prefix: string) {
        this.session = {
            prefix,
            apiUrl: `https://${prefix}.huijiwiki.com/api.php`,
            headers: {
                'User-Agent': USER_AGENT,
            },
            cookie: new HuijiCookies(),
            csrftoken: '',
            reqIndex: 0,
            userName: '',
        };
    }

    async login(username: string, password: string) {
        let loginToken = '';
        {
            const reqToken = new HuijiRequests(this.session, {
                action: 'query',
                meta: 'tokens',
                type: 'login',
            });
            try {
                const resToken = await reqToken.execute();
                loginToken = resToken.query.tokens.logintoken;
            } catch (e) {
                throw new Error('获取登录令牌失败：' + (e as Error).message);
            }
        }

        {
            const reqLogin = new HuijiRequests(this.session, {
                action: 'clientlogin',
                username: username,
                password: password,
                logintoken: loginToken,
                loginreturnurl: 'https://danteng.huijiwiki.com',
                rememberMe: '1',
            });
            const resLogin = await reqLogin.execute();
            this.session.userName = resLogin.clientlogin.username;
        }

        {
            const reqToken = new HuijiRequests(this.session, {
                action: 'query',
                meta: 'tokens',
            });
            const resToken = await reqToken.execute();
            this.session.csrftoken = resToken.query.tokens.csrftoken;
        }

        {
            const reqEdit = new HuijiRequests(this.session, {
                action: 'edit',
                title: 'test',
                text: 'testaacsdcsdsabbb',
                summary: 'test',
                bot: '1',
                token: this.session.csrftoken,
            });
            const resEdit = await reqEdit.execute();
            console.log(resEdit);
        }
    }

    // async login_fetch(username: string, password: string) {
    //     let loginToken = '';
    //     {
    //         const reqToken = new HuijiRequests(this.session, {
    //             action: 'query',
    //             meta: 'tokens',
    //             type: 'login',
    //         });
    //         try {
    //             const resToken = await reqToken.execute();
    //             loginToken = resToken.query.tokens.logintoken;
    //         } catch (e) {
    //             throw new Error('获取登录令牌失败：' + (e as Error).message);
    //         }
    //     }

    //     {
    //         const reqLogin = new HuijiRequests(this.session, {
    //             action: 'clientlogin',
    //             username: username,
    //             password: password,
    //             logintoken: loginToken,
    //             loginreturnurl: 'https://danteng.huijiwiki.com',
    //             rememberMe: '1',
    //         });
    //         const resLogin = await reqLogin.execute();
    //         this.session.userName = resLogin.clientlogin.username;
    //     }

    //     {
    //         const reqToken = new HuijiRequests(this.session, {
    //             action: 'query',
    //             meta: 'tokens',
    //         });
    //         const resToken = await reqToken.execute();
    //         this.session.csrftoken = resToken.query.tokens.csrftoken;
    //     }

    //     {
    //         const reqEdit = new HuijiRequests(this.session, {
    //             action: 'edit',
    //             title: 'test',
    //             text: 'testaaabbb',
    //             summary: 'test',
    //             bot: '1',
    //             token: this.session.csrftoken,
    //         });
    //         const resEdit = await reqEdit.execute();
    //         console.log(resEdit);
    //     }
    // }
}
