import { useState, useRef, useEffect, useContext } from 'react'
import LogoSmall from '../images/Logo_small.png'
import { Moon, Sun, User } from 'lucide-react'
import { useTheme } from "../theme-provider.tsx"
import { Link, useNavigate } from 'react-router'
import { AuthContext } from '../context/AuthContext.tsx'


function Navbar() {

    const { setTheme } = useTheme()

    let theme = localStorage.getItem("theme") || "light"

    const toggleTheme = () => {
        localStorage.setItem("theme", theme === "light" ? "dark" : "light")
        setTheme(theme === "light" ? "dark" : "light")
    }

    const auth = useContext(AuthContext)

    let loggedIn: boolean | null
    let logout: () => Promise<void>

    if(auth)
    {
       loggedIn = auth.loggedIn
       logout = auth.logout
    }

     
    
    

    let hasProfilePic: boolean = false

    const menuRef = useRef<HTMLDivElement>(null)

    const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false)

    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

    const profileMenuItemStyle = `w-full p-4 flex justify-center text-center lg:text-3xl items-center rounded-lg hover:bg-red-500 hover:text-white dark:text-white transition-all duration-200 cursor-pointer`

    function handleClickOutside(e: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setIsMenuVisible(false)

            setTimeout(() => {
                setIsMenuOpen(false)
            }, 300)

        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)

        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (isMenuOpen) {
            setIsMenuVisible(true)
        }
    }, [isMenuOpen])


    const navigate = useNavigate()



    function ProfileMenu() {
        return (
            <div ref={menuRef} className={`w-[40vw] md:w-[30vw] xl:w-[20vw] h-auto gap-2 ${isMenuVisible ? "opacity-100" : "opacity-0"} p-2 flex backdrop-blur flex-col justify-start absolute right-0 md:top-[12vh] top-[8vh] items-center bg-white dark:bg-zinc-600 transition-opacity duration-300 font-semibold rounded-md`}>
                { !loggedIn && 

                    <Link to={ "/login" } className={ profileMenuItemStyle }>
                        Log in
                    </Link>
                }
                { !loggedIn &&
                <Link to={ "/sign_up" } className={ profileMenuItemStyle}>
                    Sign up
                </Link>
                }
                <Link to={ "/app/games" } className={profileMenuItemStyle}>
                    My Games
                </Link>
                <Link to={ "/app/collections" } className={profileMenuItemStyle}>
                    My Collections
                </Link>
                <Link to={ "/app/analytics" } className={profileMenuItemStyle}>
                    Analytics
                </Link>
                <Link to={ "/app/tracking" } className={profileMenuItemStyle}>
                    Tracking
                </Link>
                { loggedIn && 
                <button className={profileMenuItemStyle}
                onClick={ async () => 
                            { 
                                await logout()
                                navigate("/")
                            }
                        }>
                        Log out
                </button>
                }
            </div>
        )
    }

    return (
        <div className="mx-auto w-full md:h-[13vh] h-[8vh] bg-red-500/80 dark:bg-red-600/80 z-997 backdrop-blur-md flex absolute fixed top-0 justify-around lg:gap-70 items-center">
            <div className="max-w-16 sm:max-w-20 md:max-w-24 rounded-md bg-[#ef4444] cursor-pointer" onClick={ () => navigate("/")}>
                <img src={LogoSmall} className="mx-auto w-full rounded-md" />
            </div>
            {

            }
            <div className="flex justify-center gap-6 items-center">
                <div className="lg:w-[8vh] w-[6vh] lg:h-[8vh] h-[6vh] rounded-full flex justify-center items-center">
                    <button className="w-full h-full inset-shadow-sm/30 rounded-full bg-neutral-300 dark:bg-slate-600 flex justify-center items-center hover:cursor-pointer" onClick={() => toggleTheme()}>
                        {theme === "dark" ?
                            <Sun className="w-[60%] h-[60%] text-yellow-400" />
                            :
                            <Moon className="w-[60%] h-[60%] text-gray-700" />
                        }
                    </button>
                </div>
                <div className="w-[6vh] lg:w-[8vh] h-[6vh] lg:h-[8vh] rounded-full flex justify-center dark:text-white items-center inset-shadow-sm/30 bg-zinc-300 dark:bg-slate-600">
                    <User className="w-[60%] h-[60%] mx-auto" onClick={() => setIsMenuOpen(true)} />
                </div>
            </div>
            {isMenuOpen &&
                <ProfileMenu />
            }
        </div>
    )
}

export default Navbar