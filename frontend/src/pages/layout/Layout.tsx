import { Helmet } from 'react-helmet'
import Navbar from "../../components/Navbar"
import "../../css/appLayout.css"
import { Outlet } from 'react-router'



function Layout() {
 

  

  return (
    <>
      <Helmet>
        <title>FunTrack - Your game buddy!</title>
      </Helmet>

      <div className="w-full mx-auto flex justify-center items-start">
        <div className="w-full flex justify-center items-start">
          <div className="w-full bg-linear-to-r from-orange-400 to-orange-200 dark:from-indigo-800 dark:to-indigo-950 bg-gradientAnimation bg-size-[200%_200%] flex justify-center items-start">
            <Navbar />

            <Outlet />

          </div>
        </div>
      </div>

    </>
  )
}

export default Layout
