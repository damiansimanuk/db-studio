import { useEffect } from "react";
import "./Spinner.css";
import { useDebounce } from 'primereact/hooks';

export function Spinner(props: React.PropsWithChildren<{
    loading?: boolean,
    debounce?: number,
    debounceStop?: number,
    background?: string,
    className?: string,
}>) {
    const [_start, startDebounced, setStart] = useDebounce(false, props.debounce ?? 100);
    const [running, runningDebounced, setRunning] = useDebounce(false, props.debounceStop ?? 100);

    useEffect(() => {
        setStart(props.loading);
    }, [props.loading])

    useEffect(() => {
        if (startDebounced && !running) {
            setRunning(true);
        }
        else if (!startDebounced && runningDebounced) {
            setRunning(false);
        }
    }, [startDebounced, runningDebounced])

    const visible = running || runningDebounced

    return (
        <div className={'w-full h-full top-0 left-0 ' + (props.className ?? "")}>
            {visible &&
                <div className="spinner-container">
                    <div className="flex flex-column align-items-center">
                        <div className="p-4">
                            <svg
                                className="rotation"
                                xmlns="http://www.w3.org/2000/svg"
                                width="8rem"
                                height="8rem"
                                viewBox="0 0 48 48"
                            >
                                <circle cx="24" cy="4" r="4" fill="var(--green-500)" />
                                <circle cx="12.19" cy="7.86" r="3.7" fill="var(--green-500)" />
                                <circle cx="5.02" cy="17.68" r="3.4" fill="var(--green-400)" />
                                <circle cx="5.02" cy="30.32" r="3.1" fill="var(--green-400)" />
                                <circle cx="12.19" cy="40.14" r="2.8" fill="var(--green-300)" />
                                <circle cx="24" cy="44" r="2.5" fill="var(--green-300)" />
                                <circle cx="35.81" cy="40.14" r="2.2" fill="var(--green-200)" />
                                <circle cx="42.98" cy="30.32" r="1.9" fill="var(--green-200)" />
                                <circle cx="42.98" cy="17.68" r="1.6" fill="var(--green-100)" />
                                <circle cx="35.81" cy="7.86" r="1.3" fill="var(--green-100)" />
                            </svg>
                        </div>
                        {/* <span className="pb-2">
                            Loading...
                        </span> */}
                    </div>
                </div>
            }

            {props.children}

        </div >
    );
}