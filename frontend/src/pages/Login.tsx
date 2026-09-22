import { Helmet } from 'react-helmet'
import Navbar from '../components/Navbar'
import { useContext, useEffect, useState, type JSX } from 'react'
import greenTick from "../images/tick-green-icon.svg"
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { AuthContext } from '../context/AuthContext'
import api from "../api/api"
import { setAccessToken } from '../api/tokenStorage'
import { useNavigate } from 'react-router'
import Home from './Home'

function Login() {

  const oAuthClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
  const javaBackendUrl = import.meta.env.VITE_SPRING_BOOT_BACKEND_URL

  const [email, setEmail] = useState<string | "">("")
  const [password, setPassword] = useState<string | "">("")

  const [errors, setErrors] = useState<string[]>([])

  const auth = useContext(AuthContext)

  const navigate = useNavigate()


  if(!auth)
  {
    throw new Error("AuthContext not found.")
  }

  const { loggedIn, setLoggedIn } = auth

  useEffect(() => {
    if(loggedIn)
    {
      navigate("/")
    }
  }, [navigate, loggedIn])
  

  const localLogin = async () => {

    const formEmail = email.trim()
    const formPassword = password.trim()

    setErrors([])

    try
    {
        const response = await api.post(javaBackendUrl + "/auth/login", { email: formEmail, password: formPassword }, { withCredentials: true })
        console.log(response)

        setAccessToken(response.data.accessToken)
        setLoggedIn(true)
        navigate("/")
    }
    catch(error)
    {
      console.error(error)
      if(formEmail === "" || formPassword === "")
      {
        setErrors((prev) => [ ...prev, "Please enter e-mail and password."])
      }
      else
      {
        setErrors((prev) => [ ...prev, "Incorrect e-mail or password."])
      }
    }
  }
  

  

  const onGoogleSuccess = async (credentialResponse: any) => {
     try 
     {
        setErrors([])

        const response = await api.post(`${javaBackendUrl}/auth/google`,
                        {
                            idToken:
                            credentialResponse.credential
                        },
                        {
                            withCredentials:
                            true
                        }
                    );

        console.log(response);
        
        if(response.status === 200)
        {
          if(auth)
          {
            const { setLoggedIn } = auth
            setAccessToken(response.data.accessToken)
            setLoggedIn(true)
            navigate("/")
          }
        }
      } 
      catch(error) 
      {
        console.error(error);
      }
  }

  const ErrorBox = () => {
    return (
      <div className="mx-auto p-6 text-white font-semibold w-[80%] bg-red-600 rounded-lg flex flex-col justify-start items-center gap-3">
        {
          errors.map((error) =>
            <div>
            { error }
            </div>
          )
        }
      </div>

    )
  }

  return (
    <>
      <Helmet>
        <title>FunTrack - Your game buddy!</title>
        <meta name="google-signin-client_id" content={`${oAuthClientId}.apps.googleusercontent.com`}></meta>
        
      </Helmet>

      <div id="main_container" className="mx-auto w-full h-full">
        <div id="bg" className="mx-auto w-full h-full min-h-screen bg-linear-to-r from-purple-200 via-pink-200 to-fuchsia-200 dark:from-slate-600 dark:via-indigo-950 dark:to-purple-800 animate-gradientAnimation bg-size-[200%_200%]">
          <Navbar />
          <br />
          <div className="w-full h-full flex flex-col justify-around gap-10 items-center">
              <div className="mt-[15vh] text-xl lg:text-3xl font-bold text-[purple] dark:text-white">
                Login
              </div>
              <div className="bg-slate-100/60 backdrop-blur-xl dark:bg-slate-600/60 dark:text-white flex flex-col justify-start items-start rounded-md shadow-md/20 py-8 px-4 lg:px-12 gap-4 text-lg lg:text-xl">
                <form action={ async () => await localLogin() } className="flex flex-col justify-start items-start gap-5">
                  <div className="w-full flex flex-col justify-center items-start gap-1">
                    <div className="text-xl font-semibold dark:text-white tracking-tighter">
                      <div className="text-red-500 inline-block">*</div> <div className="inline-block">  E-mail </div>
                    </div>
                    <input className="lg:w-[40vw] w-[80vw] rounded-lg dark:text-black bg-slate-100 px-4 py-2 outline-none border-blue-300 border-2 focus:border-indigo-500 dark:border-sky-200 dark:focus:border-sky-500 transition-all duration-700"
                    value={email}
                    name="email"
                    onChange={ (e) => setEmail(e.target.value) }
                    placeholder="user@gmail.com"
                    />
                  </div>
                  <div className="w-full flex flex-col justify-center items-start gap-1">
                    <div className="text-xl font-semibold dark:text-white tracking-tighter">
                      <div className="text-red-500 inline-block">*</div> <div className="inline-block"> Password </div>
                    </div>
                    <input className="lg:w-[40vw] w-[80vw] dark:text-black rounded-lg bg-slate-100 px-4 py-2 outline-none border-blue-300 border-2 focus:border-indigo-500 dark:border-sky-200 dark:focus:border-sky-500 transition-all duration-700"
                    type="password"
                    value={password}
                    name="password"
                    onChange={ (e) => setPassword(e.target.value) }
                    />
                  </div>
                  {
                    errors.length > 0 &&
                    <ErrorBox />
                  }
                  <div className="w-full mt-8 flex justify-center items-center">
                    <button className="rounded-lg bg-blue-500 text-xl font-semibold tracking-tight shadow-sm/30 text-white px-6 py-3 hover:bg-blue-700 transition-all duration-800 hover:cursor-pointer"
                    type="submit"
                    >
                    Login
                    </button>
                  </div>
                  <div className="w-full flex justify-center items-center">
                    <GoogleLogin
                    onSuccess={ async (credentialResponse) => await onGoogleSuccess(credentialResponse) }
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
    </>

    
  )
}

export default Login
