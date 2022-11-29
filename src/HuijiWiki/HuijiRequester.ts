import axios from 'axios';
import { USER_AGENT } from '../config';
import { HuijiCookies } from './HuijiCookie';

type RequestParams = { action: string; method?: 'GET' | 'POST' } & Record<string, any>;

export class HuijiRequester {
    private prefix: string;
    private apiUrl: string;
    private cookie: HuijiCookies;
    private csrftoken: string = '';
    private headers: Record<string, string>;

    /** 请求计数器 */
    private reqIndex: number = 0;

    // private method: 'GET' | 'POST';
    // private params: RequestParams;
    private lastResult: any;
    // private retryCount = 0;
    private maxRetryCount = 3;

    constructor(prefix: string) {
        this.prefix = prefix;
        this.apiUrl = `https://${prefix}.huijiwiki.com/api.php`;
        this.cookie = new HuijiCookies();
        this.headers = {
            'User-Agent': USER_AGENT,
        };

        // this.params = params;
        // this.params.format = 'json';
        // this.params.utf8 = '1';
        // this.method = this.getMethod();
    }

    static getMethod(params: RequestParams) {
        if (params.action === 'query') {
            return 'GET';
        }
        if (params.action === 'parse' && !params.text) {
            return 'GET';
        }
        return 'POST';
    }

    setMaxRetryCount(count: number) {
        this.maxRetryCount = count;
    }

    async get<T = any>(params: RequestParams): Promise<T> {
        return await this.request(params, 'GET');
    }

    async post<T = any>(params: RequestParams): Promise<T> {
        return await this.request(params, 'POST');
    }

    async request<T = any>(params: RequestParams, method?: 'GET' | 'POST'): Promise<T> {
        this.reqIndex++;
        params.format = 'json';
        params.utf8 = '1';
        if (!method) {
            method = HuijiRequester.getMethod(params);
        }
        return await this.execute(params, method, 0);
    }

    private async execute<T = any>(params: RequestParams, method: 'GET' | 'POST', retryCount: number): Promise<T> {
        const res = method === 'GET' ? await this.handleGet(params) : await this.handlePost(params);
        if (res.status === 200) {
            this.cookie.setCookies(res.headers['set-cookie'] || []);
            this.lastResult = res.data;
            if (this.lastResult.error) {
                throw new Error(this.lastResult.error.info);
            }
            return this.lastResult;
        } else {
            if (retryCount < this.maxRetryCount) {
                retryCount++;
                return await this.execute(params, method, retryCount);
            } else {
                throw new Error(`Request failed with status code ${res.status}`);
            }
        }
    }

    private async handleGet(params: RequestParams) {
        return await axios.request({
            url: this.apiUrl + '?' + new URLSearchParams(params),
            method: 'GET',
            headers: {
                ...this.headers,
                cookie: this.cookie.getCookies(),
            },
        });
    }

    private async handlePost(params: RequestParams) {
        // TODO: 还要适配上传文件时的 POST 请求
        return await axios.request({
            url: this.apiUrl,
            method: 'POST',
            data: new URLSearchParams(params),
            headers: {
                ...this.headers,
                cookie: this.cookie.getCookies(),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    }

    getLastResult() {
        return this.lastResult;
    }
}
