import '../css/Home.css'
import { Helmet } from 'react-helmet'
import Navbar from '../components/Navbar'



function Home() {

  const wasGamePlayedToday = false  

  

  return (
    <>
      <Helmet>
        <title>FunTrack - Your game buddy!</title>
      </Helmet>

      <div id="main_container" className="mx-auto w-full h-full">
        <div id="bg" className="mx-auto w-full min-h-screen bg-linear-to-r from-purple-200 via-pink-200 to-fuchsia-200 dark:from-slate-600 dark:via-indigo-950 dark:to-purple-800 animate-gradientAnimation bg-size-[200%_200%]">
          <Navbar />
          <br />
          <div id="main_grid" className="w-full grid grid-cols-5 lg:grid-cols-10 gap-y-10 lg:gap-12 justify-items-center grid-rows-auto overflow-hidden">
            
              <div className="w-[80%] lg:w-[60%] h-[50vh] col-span-full p-2 lg:p-8 mt-[15vh] bg-white/60 dark:bg-blue-900/60 flex justify-center animate-appear backdrop-blur-[2px] items-center rounded-md">
                <div className="w-[80%] h-full mx-auto text-center lg:text-[5em] text-[3em] bg-linear-to-r bg-clip-text font-semibold from-purple-600 via-pink-600 text-transparent to-fuchsia-600
                animate-gradientAnimation flex justify-center items-center" style={{ backgroundSize: "300% 300%" }}>
                  Welcome to FunTrack!
                </div>
              </div>

            <div className="w-[70%] h-[40vh] lg:h-[20vh] flex justify-center items-center text-center text-lg lg:text-2xl col-span-full dark:text-white shadow-lg font-medium bg-white/40 dark:bg-slate-800/60 rounded-[30px] p-12 border-slate-100 border">
              Track games, create collections and do a lot more!
            </div>
         </div>

      </div>
      </div>
    </>
  )
}

export default Home
