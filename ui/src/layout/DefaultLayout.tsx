import { Outlet } from "react-router-dom";
import { Spinner } from "./Spinner";
import { userInfoStore } from "../core/api/Shared";
import { HeaderBar } from "./HeaderBar";

export const DefaultLayout: React.FC<{}> = () => {
    const userInfo = userInfoStore.use()

    return (
        <div className="main-container relative">
            <header className="flex w-full p-0 m-0 z-1">
                <HeaderBar />
            </header>

            <main className="container relative p-2 z-0">
                <Spinner loading={(!userInfo.done || userInfo.isLoading)} className="absolute bg-black-alpha-20" />
                <div className="h-full w-full relative" >
                    <Outlet />
                </div>
            </main>

            <footer>
                &copy; {new Date().getFullYear()} E Commerce Demo
            </footer>
        </div>
    );
}; 
