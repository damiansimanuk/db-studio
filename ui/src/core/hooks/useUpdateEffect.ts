import { type DependencyList, type EffectCallback, useEffect, useRef } from "react";

/**
 * A custom useEffect hook that only triggers on updates, not on initial mount 
 */
export default function useUpdateEffect(effect: EffectCallback, deps: DependencyList = [], notNullDeps: DependencyList = []) {
    const skipExecute = useRef(true);

    useEffect(() => {
        if (skipExecute.current || notNullDeps.findIndex(d => d == null || !d) >= 0) {
            skipExecute.current = false;
        } else {
            return effect();
        }
    }, deps);
}