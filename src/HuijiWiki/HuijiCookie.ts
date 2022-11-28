export class HuijiCookies {
    private cookies: Record<string, string> = {};

    constructor(cookies?: string) {
        this.cookies = {};
        if (cookies) {
            this.setCookies(cookies);
        }
    }

    setCookies(cookies: string) {
        const cookiesParts = cookies.split(',');
        for (const cookiePart of cookiesParts) {
            const cookieList = cookiePart.split(';');
            for (const cookie of cookieList) {
                const [key, value] = cookie.trim().split('=');
                if (key && value) {
                    this.cookies[key] = value;
                }
            }
        }
    }

    getCookies() {
        return Object.entries(this.cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');
    }
}
