import { HuijiWikiSession } from './HuijiWiki';

type RequestParams = { action: string; method?: 'GET' | 'POST' } & Record<string, any>;

export class HuijiRequests {
    private session: HuijiWikiSession;
    private method: 'GET' | 'POST';
    private params: RequestParams;
    private result: any;
    private retryCount = 0;
    private maxRetryCount = 3;

    constructor(session: HuijiWikiSession, params: RequestParams) {
        this.session = session;
        this.params = params;
        this.params.format = 'json';
        this.params.utf8 = '1';
        this.method = params.method || this.getMethod();
    }

    getMethod() {
        if (this.params.action === 'query') {
            return 'GET';
        }
        if (this.params.action === 'parse' && !this.params.text) {
            return 'GET';
        }
        return 'POST';
    }

    setMaxRetryCount(count: number) {
        this.maxRetryCount = count;
    }

    async execute<T = any>(): Promise<T> {
        const res = this.method === 'GET' ? await this.handleGet() : await this.handlePost();
        if (res.status === 200) {
            this.session.cookie.setCookies(res.headers.get('set-cookie') || '');
            this.result = await res.json();
            if (this.result.error) {
                throw new Error(this.result.error.info);
            }
        } else {
            if (this.retryCount < this.maxRetryCount) {
                this.retryCount++;
                return await this.execute();
            } else {
                throw new Error(`Request failed with status code ${res.status}`);
            }
        }
        return this.result;
    }

    private async handleGet() {
        return await fetch(this.session.apiUrl + '?' + new URLSearchParams(this.params), {
            method: 'GET',
            headers: {
                ...this.session.headers,
                cookie: this.session.cookie.getCookies(),
            },
        });
    }

    private async handlePost() {
        return await fetch(this.session.apiUrl, {
            method: 'POST',
            body: new URLSearchParams(this.params),
            headers: {
                ...this.session.headers,
                cookie: this.session.cookie.getCookies(),
            },
        });
    }

    getResult() {
        return this.result;
    }
}
