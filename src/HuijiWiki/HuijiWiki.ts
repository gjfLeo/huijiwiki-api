import { HuijiRequester } from './HuijiRequester';

enum LOG_LEVEL {
    INFO = 10,
    WARN = 20,
    ERROR = 30,
    NONE = 1000,
}

export class HuijiWiki {
    private prefix: string;
    private huijiRequester: HuijiRequester;
    private csrfToken: string = '';
    private username: string = '';
    private lastError: string = '';

    private loginUsername: string = '';
    private loginPassword: string = '';

    private logLevel: LOG_LEVEL;

    constructor(prefix: string, logLevel?: LOG_LEVEL) {
        this.prefix = prefix;
        this.huijiRequester = new HuijiRequester(prefix);
        this.logLevel = logLevel ?? LOG_LEVEL.INFO;
    }

    log(msg: string, level: LOG_LEVEL = LOG_LEVEL.INFO) {
        if (level < this.logLevel) {
            return;
        }
        switch (level) {
            case LOG_LEVEL.INFO:
                console.log(msg);
                break;
            case LOG_LEVEL.WARN:
                console.warn(msg);
                break;
            case LOG_LEVEL.ERROR:
                this.lastError = msg;
                console.error(msg);
                break;
            default:
                console.log(msg);
                break;
        }
    }

    warn(msg: string) {
        this.log(msg, LOG_LEVEL.WARN);
    }

    error(msg: string) {
        this.log(msg, LOG_LEVEL.ERROR);
    }

    getLastErrorMessage() {
        return this.lastError;
    }

    async login(username: string, password: string) {
        username = username.trim();
        password = password.trim();
        let loginToken = '';
        {
            const resToken = await this.huijiRequester.request({
                action: 'query',
                meta: 'tokens',
                type: 'login',
            });
            loginToken = resToken.query.tokens.logintoken;
        }
        {
            const resLogin = await this.huijiRequester.request({
                action: 'clientlogin',
                username: username,
                password: password,
                logintoken: loginToken,
                loginreturnurl: `https://${this.prefix}.huijiwiki.com`,
                rememberMe: '1',
            });
            if (resLogin.clientlogin.status === 'PASS') {
                this.username = resLogin.clientlogin.username;
                // 记录下以备后续重新登录用
                this.loginUsername = username;
                this.loginPassword = password;
                this.log(`登录成功，用户名：${this.username}`);
                return true;
            } else {
                this.error(`登录失败，错误信息：${resLogin.clientlogin.message}`);
                return false;
            }
        }
    }

    async getCsrfToken(): Promise<string> {
        if (this.csrfToken !== '') {
            return this.csrfToken;
        }
        const res = await this.huijiRequester.request({
            action: 'query',
            meta: 'tokens',
        });
        this.csrfToken = res.query.tokens.csrftoken;
        if (this.csrfToken === '+\\') {
            this.csrfToken = '';
            // 尝试重新登录
            if (this.loginUsername !== '' && this.loginPassword !== '') {
                if (await this.login(this.loginUsername, this.loginPassword)) {
                    return await this.getCsrfToken();
                } else {
                    this.loginUsername = '';
                    this.loginPassword = '';
                    this.error('获取 CSRF Token 失败，且尝试重新登录失败');
                }
            } else {
                this.error('获取 CSRF Token 失败：因为没有登录');
            }
        }
        return this.csrfToken;
    }

    async edit(title: string, text: string, options?: { isBot?: boolean; summary?: string }) {
        const csrfToken = await this.getCsrfToken();
        options = options || {};
        const isBot = options.isBot ?? true;
        const summary = options.summary ?? 'Huiji Bot 编辑';

        return await this.huijiRequester.request({
            action: 'edit',
            title: title,
            text: text,
            summary: summary,
            token: csrfToken,
            ...(isBot ? { bot: '1' } : {}),
        });
    }
}
