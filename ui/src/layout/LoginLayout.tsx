import { Link, Outlet } from "react-router-dom";

export const LoginLayout: React.FC<{}> = () => {
    return (
        <div className="main-container">
            <header className="flex align-items-center align-content-center">
                <span> <Link to="/">Home</Link> </span>
            </header>
            <main className="container">
                <Outlet />
            </main>
            <footer>
                &copy; {new Date().getFullYear()} Login Layout
            </footer>
        </div>
    );
};
