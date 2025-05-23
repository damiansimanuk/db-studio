import { useRef, useLayoutEffect, useState } from "react";


type TOptions = {
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    offsetHeight?: number;
    offsetWidth?: number;
    discounts?: string[];
}

const defaultOptions: TOptions = {
    minHeight: 0, 
    maxHeight: 4000,
    minWidth: 0, 
    maxWidth: 4000,
    offsetHeight: 0,
    offsetWidth: 0,
    discounts: [".p-paginator-bottom", ".p-datatable-header"]
}

export function useElementSize<T extends Element>(options: TOptions = defaultOptions) {
    options = { ...defaultOptions, ...options }
    const ref = useRef<T>(null)
    const [height, setHeight] = useState(`${options.minHeight}px`)
    const [width, setWidth] = useState(`${options.minWidth}px`)

    useLayoutEffect(() => {
        const observer = new ResizeObserver(entries => {
            const rec = entries[0].contentRect

            var discount = 0
            for (const element of options.discounts) {
                discount += ref.current?.querySelector(element)?.clientHeight ?? 0;
            }

            let height = rec.height - options.offsetHeight - discount
            let width = rec.width - options.offsetWidth
            height = Math.min(Math.max(height, options.minHeight), options.maxHeight)
            width = Math.min(Math.max(width, options.minWidth), options.maxWidth)

            setHeight(`${height}px`)
            setWidth(`${width}px`)
        })
        ref.current && observer.observe(ref.current)
        return () => ref.current && observer.unobserve(ref.current)
    }, []);

    return { ref, height, width }
}


