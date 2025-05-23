import { PrimeReactProvider } from 'primereact/api'
import './App.css'
import { TableList } from './components/TableList'
import { SchemasTabs } from './layout/SchemasTabs'

function App() {

  return (
    <>
      <PrimeReactProvider>
        <div className="main-container relative">
          <header className="flex w-full p-0 m-0 z-1">
            {/* <HeaderBar /> */}
          </header>

          <main className="container relative p-2 z-0">
            {/* <Spinner loading={(!userInfo.done || userInfo.isLoading)} className="absolute bg-black-alpha-20" /> */}
            <div className="h-full w-full relative" >
              <SchemasTabs />
            </div>
          </main>

          <footer>
            &copy; {new Date().getFullYear()} E Commerce Demo
          </footer>
        </div>
      </PrimeReactProvider>
    </>
  )
}

export default App
