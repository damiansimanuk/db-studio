
export type OmitNever<T> = { [K in keyof T as T[K] extends undefined | never ? never : K]: T[K] }
export type StatusSuccess<T> = { [K in keyof T as K extends 200 | 201 | 202 | 203 | 204 | 205 | 206 ? K : never]: T[K] }
export type StatusError<T> = { [K in keyof T as K extends 400 | 401 | 403 | 404 | 500 ? K : never]: T[K] }

// cd .\ui\src\core\api\request\ 
// curl -o .\swagger.json http://localhost:58218/swagger/v1/swagger.json                                                                                                                      
// npx openapi-typescript swagger.json --output swagger.ts
// npx openapi-typescript http://localhost:5299/swagger/v1/swagger.json --output swagger.ts

export function RequestBuilder<Paths>(caller: ((url: string, method: string, body: string | null) => Promise<any>) | null = null) {
    function entryPoint<
        Url extends keyof Paths,
        Method extends keyof Omit<OmitNever<Paths[Url]>, "parameters">,
        P extends Required<Paths[Url][Method]>,
        Param extends Required<Extract<P, { parameters: any }>['parameters']>,
        Resp extends StatusSuccess<Extract<P, { responses: any }>['responses']>,
        Result extends { [P in keyof Resp as keyof Resp[P]]: Resp[P]['content']['application/json']; }['content'],
        Path extends Extract<Param, { path: any }>['path'],
        Query extends Extract<Param, { query: any }>['query'],
        Body extends Extract<Required<P>, { requestBody: { content: { 'application/json': any } } }>['requestBody']['content']['application/json'],
        O extends { path: Path; query: Query; body: Body; },
        Option extends Pick<O, keyof OmitNever<O>>
    >(url: Url, method: Method) {

        async function invoke(options: Option): Promise<Result> {
            let path = (options as any).path as Path;
            let query = (options as any).query as Query;
            let body = (options as any).body as Body;

            let parsedUrl = `${url as string}`;
            if (path) {
                Object.keys(path || {}).forEach((p) => {
                    parsedUrl = parsedUrl.replace(`{${p}}`, `${path[p]}`);
                });
            }
            const queryParams = new URLSearchParams(query).toString();
            const parsedQuery =
                queryParams.length > 0 && !queryParams.startsWith('null')
                    ? '?' + queryParams
                    : '';
            parsedUrl = parsedUrl + parsedQuery;

            try {
                var res = await caller(parsedUrl, method, body)
                return res as Result
            }
            catch (e) {
                throw e
            }
        }

        return {
            invoke,
            method: method as string,
            url: url as string,
            types: {
                resultStatus: {} as Resp,
                result: {} as Result,
                path: {} as Path,
                query: {} as Query,
                body: {} as Body,
                options: {} as Option,
                schema: {} as Paths[Url][Method],
            }
        };
    }

    return { entryPoint };
}
