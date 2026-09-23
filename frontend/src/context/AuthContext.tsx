import api, { refreshAccessToken } from "../api/api";
import { setAccessToken } from "../api/tokenStorage";
import { createContext, useEffect, useState, type PropsWithChildren } from "react";

type AuthContextType = {
    loggedIn: boolean | null
    setLoggedIn: React.Dispatch<React.SetStateAction<boolean | null>>
    username: string | null
    setUsername: React.Dispatch<React.SetStateAction<string | null>>
    logout: () => Promise<void>
};



export const AuthContext = createContext<AuthContextType | null>(null)

export default function AuthContextProvider({ children }: PropsWithChildren)
{
    const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
    const [username, setUsername] = useState<string | null>(null)

    const refresh = async () => {
      try 
      {
        await refreshAccessToken()
        setLoggedIn(true) 
      }

      catch(error)
      {
        console.error(error)

        if(loggedIn)
        {
          await logout()
        }

        setLoggedIn(false)
      }
    }

    useEffect(() => {
      refresh()
    }, [])

    const logout = async () => {
      try
      {
        const logoutResponse = await api.post("/auth/logout", {}, { withCredentials: true })
        console.log("logout response: ", logoutResponse)
      }
      catch(error)
      {
        console.error(error)
      }
      setLoggedIn(false)
      setAccessToken(null)
    }

    


    return (
      <AuthContext value={{ loggedIn, setLoggedIn, username, setUsername, logout }}>
        {children}
      </AuthContext>
    )
}

