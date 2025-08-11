
export type DotPrefix<T extends string> = T extends '' ? '' : `.${T}`;


export type DotNestedKeys<T> = (
    T extends Record<string, unknown>
    ? { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<
        keyof T,
        symbol
    >]
    : ''
) extends infer D
    ? Extract<D, string>
    : never;




export function toBoolean(val: any): boolean | null {
    return val == null
        ? null
        : val == "1" || val == 1 || val == "True" || val == "true" || val == true
            ? true
            : false
}

export function boolToString(val: any): string | null {
    var bool = toBoolean(val)
    return bool == null ? null : bool ? "1" : "0"
}