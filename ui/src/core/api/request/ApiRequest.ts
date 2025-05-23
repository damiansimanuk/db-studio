
import type { paths } from "./swagger";
import { RequestBuilder } from "./RequestBuilder";

export type Paths = paths 

export class HttpError extends Error {
    constructor(
        public message: string,
        public errors: { code: string, message: string }[]
    ) {
        super(message)
    }
}


export function ApiRequest(baseUrl = "http://localhost:5189", useCookies = false) {
    const requestBuilder = RequestBuilder<paths>(customFetch)
    let accessToken = localStorage.getItem("accessToken")

    async function customFetch<T>(url: string, method: string, body: any) {
        return fetch(
            baseUrl + url,
            {
                body: JSON.stringify(body),
                method,
                credentials: useCookies ? "include" : "omit",
                mode: "cors",
                redirect: 'error',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(useCookies || accessToken == null ? {} : { 'Authorization': `Bearer ${accessToken}` })
                }
            })
            .then(e => parseJson(e))
            .then(e => e ?? {} as T)
    }

    async function parseJson(response: Response) {

        const isOk = response?.ok ?? false
        const typeJson = response.headers.get("content-type")?.includes("json") ?? false

        console.log({ isOk, typeJson, headers: response.headers })
        const respText = await response.text()

        // console.log({ respText })

        const resp = typeJson && respText.length > 0
            ? JSON.parse(respText)
            : {}

        if (isOk) {
            return resp
        }

        let summary = `Error al procesar la solicitud status:${response.status}`

        if (resp.errors) {
            throwError(resp.errors)
        }
        if (resp instanceof Array) {
            throwError(resp)
        }

        switch (response?.status) {
            case 0:
                summary = 'No es posible conectarse con el servidor'
                break
            case 401:
                summary = 'Usuario no Autenticado'
                break
            case 403:
                summary = 'No tiene premisos para realizar esta solicitud'
                break
            case 404:
                summary = 'La solicitud es inválida'
                break
            case 500:
                summary = 'El servidor no pudo procesar dicha solicitud'
                if (resp?.summary) {
                    summary = resp.summary
                }
                break
            case 422:
                summary = 'Los datos enviados en la solicitud son inválidos'
                break
        }

        throw new Error(summary)
    }

    function throwError(obj: any) {
        if (obj instanceof String) {
            throw new HttpError("HttpError", [{
                code: "Message",
                message: `${obj}`
            }]);
        }

        var result: { code: string, message: string }[] = []
        Object.keys(obj).forEach((key) => {
            var value = obj[key]
            if (value instanceof Array && value.length > 0) {
                result.push({
                    code: key,
                    message: value[0]
                })
            }
            else if (value instanceof Object) {
                result.push({
                    code: value?.code ?? key,
                    message: value.message ?? value.error ?? value.title ?? value.detail ?? ""
                })
            }
            else {
                result.push({
                    code: key,
                    message: `${value}`
                })
            }
        })

        throw new HttpError("HttpError", result);
    }

    function setAccessToken(token: string | null) {
        accessToken = token
        localStorage.setItem("accessToken", token ?? "")
    }

    return {
        setAccessToken,
        entryPoint: requestBuilder.entryPoint
    }
}

