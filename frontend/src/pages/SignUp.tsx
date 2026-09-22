import { Helmet } from 'react-helmet'
import Navbar from '../components/Navbar'
import { useContext, useEffect, useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { AuthContext } from '../context/AuthContext'
import axios from 'axios'
import { useNavigate } from 'react-router'
import LoadingPage from '../components/LoadingPage'
import type { CredentialResponse } from '@react-oauth/google'

function SignUp() {

  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")
  const [firstPassword, setFirstPassword] = useState<string>("")
  const [secondPassword, setSecondPassword] = useState<string>("")
  const [email, setEmail] = useState<string>("")

  const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null)
  const [doPasswordsMatch, setDoPasswordsMatch] = useState<boolean | null>(null)
  
  const [errors, setErrors] = useState<string[]>([])

  const auth = useContext(AuthContext)

  const [isLoading, setIsLoading] = useState(true)

  if(!auth)
  {
    throw new Error("AuthContext not found.")
  }

  const { loggedIn, setLoggedIn } = auth

  const navigate = useNavigate()


  const inputStyle = `rounded-md focus:border-pink-400 dark:text-white dark:border-sky-200 dark:focus:border-blue-600 border-2 border-pink-200 bg-white text-black px-3 py-2 w-full
   outline-none inset-shadow inset-shadow-md/10 transition-border duration-400`

  const oAuthClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID
  const javaBackendUrl = import.meta.env.VITE_SPRING_BOOT_BACKEND_URL

  const checkPasswordValid = (password: string): boolean => {
    const pattern: RegExp = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
    const matchesPattern: boolean = pattern.test(password)

    return matchesPattern
  }

  

  useEffect(() => {
    setIsLoading(false)
  }, [])


  useEffect(() => {
    if(loggedIn)
    {
      navigate("/")
    }
  }, [navigate, loggedIn])

  async function register()
  {
    if(isPasswordValid && doPasswordsMatch)
    {

      const password = firstPassword
      const response = await axios.post(
        `${javaBackendUrl}/auth/register`,

        {
          firstName,
          lastName,
          email,
          password
        },
        {
          withCredentials: true
        }
      )

      console.log(response)
      navigate("/")
    }
  }

  function ErrorBox()
  {
    return (
      <div className={`mx-auto h-[15vh] ${errors.length > 0 ? "bg-red-500" : "invisible"} p-3 md:p-6 rounded-lg flex flex-col gap-3 justify-center items-center`}>
        { errors.length > 0 ?
          errors.map((error) =>
            <div className="text-md h-[80%] text-white lg:text-xl font-semibold">
              { error }
            </div>)
          :
          <div className="text-md h-[80%] flex justify-center items-center text-white lg:text-xl font-semibold">
              
          </div>
          
        }
      </div>
    )
  }

  function PasswordStatusBox()
  {
    const renderPasswordStatusBox = () => {
      if(isPasswordValid === false)
      {
        return (
          <div className={`mx-auto mt-10 h-[15vh] p-3 md:p-6 rounded-lg flex flex-col gap-3 justify-center items-center`}>
            <div className="text-md bg-red-500 px-5 py-3 rounded-full flex justify-center items-center text-white lg:text-xl">
                Password is invalid. 
            </div>
            <div className="text-md px-5 invisible py-3 rounded-full bg-green-500 flex justify-center items-center text-white lg:text-xl">
                  Passwords match.
            </div>      
          </div> 
        )
      }
      else
      {
        if(isPasswordValid === null)
        {
          return (
            <div className={`mx-auto mt-10 h-[15vh] invisible p-3 md:p-6 rounded-lg flex flex-col gap-3 justify-center items-center`}>
              <div className="text-md bg-green-500 px-5 py-3 rounded-full flex justify-center items-center text-white lg:text-xl">
                  Password is valid.
              </div>
              <div className="text-md px-5 py-3 rounded-full bg-green-500 flex justify-center items-center text-white lg:text-xl">
                  Passwords match.
              </div>     
          </div> 
          )
        }

        if(doPasswordsMatch)
        {
          return (
              <div className={`mx-auto mt-10 h-[15vh] p-3 md:p-6 rounded-lg flex flex-col gap-3 justify-center items-center`}>
                <div className="text-md bg-green-500 px-5 py-3 rounded-full flex justify-center items-center text-white lg:text-xl">
                  Password is valid.
                </div>
                <div className="text-md px-5 py-3 rounded-full bg-green-500 flex justify-center items-center text-white lg:text-xl">
                  Passwords match.
                </div>    
              </div>
          
          )
        }
        else
        {
          if(doPasswordsMatch === false)
          {
            return (
              <div className={`mx-auto mt-10 h-[15vh] p-3 md:p-6 rounded-lg flex flex-col gap-3 justify-center items-center`}>
                <div className="text-md flex px-5 py-3 bg-green-500 rounded-full justify-center items-center text-white lg:text-xl">
                    Password is valid. 
                </div>
                <div className="text-md px-5 py-3 bg-red-500 rounded-full flex justify-center items-center text-white lg:text-xl">
                    Passwords don't match. 
                </div>   
              </div> 
            )
          }
          else
          {
            return (
              <div className={`mx-auto mt-10 h-[15vh] p-3 md:p-6 rounded-lg flex flex-col gap-3 justify-center items-center`}>
                <div className="text-md flex px-5 py-3 rounded-full bg-green-500 justify-center items-center text-white lg:text-xl">
                    Password is valid. 
                </div>
                <div className="text-md px-5 py-3 invisible rounded-full bg-green-500 flex justify-center items-center text-white lg:text-xl">
                  Passwords match.
                </div>   
              </div>
            )
          }
        }
      }
    }
    
    return renderPasswordStatusBox()
  }

  useEffect(() => {
    setIsPasswordValid(null)
    setDoPasswordsMatch(null)

    const password1 = firstPassword.trim()
    const password2 = secondPassword.trim()

    if(password1 !== "" && password2 !== "")
    {
      if(checkPasswordValid(password1))
      {
        if(password2 !== password1)
        {
          setIsPasswordValid(true)
          setDoPasswordsMatch(false)
        }
        else
        {
          setIsPasswordValid(true)
          setDoPasswordsMatch(true)
        }
      }
      else
      {
        setDoPasswordsMatch(null)
        setIsPasswordValid(false)
      }
    }
    else if(password1 !== "" && password2 === "")
    {
      if(checkPasswordValid(password1))
      {
        setIsPasswordValid(true)
      }
      else
      {
        setIsPasswordValid(false)
      }
    }
    else
    {
      setIsPasswordValid(null)
      setDoPasswordsMatch(null)
    }
  }, [firstPassword, secondPassword])

  useEffect(() => {
     setErrors([])
  }, [])

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
     try 
     {

        const response = await axios.post(`${javaBackendUrl}/auth/google`,
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
          setLoggedIn(true)
        }
      } 
      catch(error) 
      {
        console.error(error)
      }
  }

  return (
    <>
      <Helmet>
        <title>FunTrack - Your game buddy!</title>
        <meta name="google-signin-client_id" content={`${oAuthClientId}.apps.googleusercontent.com`}></meta>
        
      </Helmet>

      <div id="main_container" className="mx-auto w-full h-full">
        <div id="bg" className="mx-auto w-full h-full bg-linear-to-r from-purple-200 via-pink-200 to-fuchsia-200 dark:from-slate-600 dark:via-indigo-950 dark:to-purple-800 animate-gradientAnimation bg-size-[200%_200%]">
          <Navbar />
          <br />
          { isLoading ? 
          <LoadingPage /> 
          :
          (<div className="w-full h-full flex flex-col justify-around gap-10 items-center">
              <div className="mt-[15vh] text-xl lg:text-3xl font-bold text-[purple] dark:text-white">
                Sign up
              </div>
              <div className="bg-slate-100/60 backdrop-blur-xl dark:bg-slate-600/60 dark:text-white flex flex-col justify-center items-start rounded-md shadow-xl/30 py-8 px-12 gap-4 text-lg lg:text-xl">
                <form action={ async () => await register() }>
                  <div className="flex flex-col w-full justify-start gap-1 items-start">
                    <div className="flex justify-around gap-2 font-semibold items-center">
                      <span className="text-red-500">*</span> E-mail
                    </div>
                    <input type="text" className={ inputStyle } onChange={ (e) => setEmail(e.target.value) } /> 
                  </div>
                  <div className="flex flex-col w-full justify-start gap-1 items-start">
                    <div className="flex justify-around gap-2 font-semibold items-center">
                      <span className="text-red-500">*</span> First Name
                    </div>
                    <input type="text" className={ inputStyle } onChange={ (e) => setFirstName(e.target.value) } /> 
                  </div>
                  <div className="flex flex-col w-full justify-start gap-1 items-start">
                    <div className="flex justify-around font-semibold items-center">
                      Last Name
                    </div>
                    <input type="text" className={ inputStyle } onChange={ (e) => setLastName(e.target.value) } /> 
                  </div> 
                  <div className="flex flex-col w-full justify-start gap-1 items-start"> 
                    <div className="flex justify-around font-semibold gap-2 items-center">
                      <span className="text-red-500">*</span> Password
                    </div>
                    <input type="password" value={ firstPassword } className={ inputStyle } onChange={ (e) => setFirstPassword(e.target.value) } /> 
                  </div>
                  <div className="flex flex-col w-full justify-start gap-1 items-start"> 
                    <div className="flex justify-around font-semibold gap-2 items-center">
                      <span className="text-red-500">*</span> Retype password
                    </div>
                    <input type="password" value={ secondPassword } className={ inputStyle } onChange={ (e) => setSecondPassword(e.target.value) } /> 
                  </div>
                  {
                    <PasswordStatusBox />
                  }
                  {
                    <ErrorBox />
                  }
                  <div className="flex justify-center items-start">
                    <div className="min-w-[80%] lg:w-[90%] mt-6 p-6 lg:p-10 rounded-lg dark:bg-blue-800 bg-pink-500 text-white flex flex-col justify-center items-start">
                      <div className="text-xl font-medium">
                        Password should have:
                      </div>
                      <ul className="list-disc list-inside">
                        <li>at least 8 characters</li>
                        <li>at least 1 uppercase character</li>
                        <li>at least 1 lowercase character</li>
                        <li>at least 1 special character (like % or $)</li>
                      </ul>
                    </div>
                    <br />
                  </div>
                  <div className="mx-auto w-full flex flex-col p-5 justify-center gap-6 items-center">
                    <button type="submit" className="bg-linear-to-r rounded-md text-white text-2xl font-semibold cursor-pointer px-8 py-4 shadow-md/20 from-blue-500 bg-size-[200%_200%] hover:bg-position-[100%_100%] to-violet-600 transition-all duration-600">
                      Create account
                    </button>
                    <GoogleLogin
                    onSuccess={ async (credentialResponse) => await onGoogleSuccess(credentialResponse) }
                    />
                  </div>
                </form>
              </div>
            </div>)
          }
          </div>
        </div>
    </>
  )
}

export default SignUp
