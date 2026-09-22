import axios from "axios"
import { getAccessToken, setAccessToken } from "./tokenStorage"

const api = axios.create({
    baseURL: import.meta.env.VITE_SPRING_BOOT_BACKEND_URL,
    withCredentials: true
})

let refreshPromise: Promise<string> | null = null

const doRefresh = async (): Promise<string> => {
    try 
    {
        const response = await api.post("/auth/refresh")

        const newAccessToken = response.data.accessToken

        setAccessToken(newAccessToken)

        return newAccessToken
    }
    finally 
    {
        refreshPromise = null
    }
}

export const refreshAccessToken = async (): Promise<string> => {
    
    if(refreshPromise)
    {
        return refreshPromise
    }
    
    refreshPromise = doRefresh()

    return refreshPromise
}

api.interceptors.request.use((config) => {

    const token = getAccessToken()

    if(token) 
    {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (originalRequest.url === "/auth/refresh") {
            return Promise.reject(error)
        }

        if (error.response?.status === 401 && !originalRequest._retry) 
        {
            originalRequest._retry = true

            try 
            {
                const newAccessToken = await refreshAccessToken()
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

                return api(originalRequest)
            } 
            catch(refreshError) 
            {
                setAccessToken(null)
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api