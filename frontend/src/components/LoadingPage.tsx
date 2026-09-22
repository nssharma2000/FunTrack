import { useState, useRef, useEffect } from 'react'
import LogoSmall from '../images/Logo_small.png'
import { Moon, Sun, User } from 'lucide-react'
import { useTheme } from "../theme-provider.tsx"
import { Link, useNavigate } from 'react-router'


function LoadingPage() {
    

    

    return (
        <div id="main_container" className="mx-auto w-full h-full">
            <div id="bg" className="mx-auto flex flex-col justify-center items-center w-full h-screen bg-linear-to-r from-purple-200 via-pink-200 to-fuchsia-200 dark:from-slate-600 dark:via-indigo-950 dark:to-purple-800 animate-gradientAnimation bg-size-[200%_200%]">
                <div className="rounded-full w-[30vw] h-[30vw] lg:w-[10vw] lg:h-[10vw] border-t border-t-[3vw] lg:border-t-[1vw] border-t-pink-500 border-[3vw] lg:border-[1vw] border-pink-500/20 animate-spin">

                </div>
            </div>
        </div>
    )
}

export default LoadingPage