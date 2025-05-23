
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