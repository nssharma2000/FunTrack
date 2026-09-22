import { useContext } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './pages/Home.tsx'
import SignUp from './pages/SignUp.tsx'
import Login from './pages/Login.tsx'
import { ThemeProvider } from './theme-provider'
import { GoogleOAuthProvider } from '@react-oauth/google'
import AuthContextProvider, { AuthContext } from './context/AuthContext.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Layout from './pages/layout/Layout.tsx'
import Games from './pages/appPages/games/Games.tsx'
import LoadingPage from './components/LoadingPage.tsx'
import Collections from './pages/appPages/collections/Collections.tsx'
import Tracking from './pages/appPages/tracking/Tracking.tsx'
import Analytics from './pages/appPages/analytics/Analytics.tsx'


const ProtectedRoutes = () => {

  const auth = useContext(AuthContext)

  if(!auth)
  {
    return null
  }

  const loggedIn = { auth }
  
  if(loggedIn === null)
  {
    return (<LoadingPage />)
  }

  return (loggedIn ? <Layout /> : <Login />)
  
}

const routes = [
  {
    index: true,
    Component: Home
  },
  {
    path: "/sign_up",
    Component: SignUp
  },
  {
    path: "/login",
    Component: Login
  },
  {
    path: "/app",
    Component: ProtectedRoutes,
    children: [
      {
        path: "games",
        Component: Games
      },
      {
        path: "collections",
        Component: Collections
      },
      {
        path: "tracking",
        Component: Tracking
      },
      {
        path: "analytics",
        Component: Analytics
      }
    ]
  }
]

const router = createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(
  
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <GoogleOAuthProvider clientId='980568631154-ljs2ssuribc0krnrroagl1aou1u20do0.apps.googleusercontent.com'>
        <AuthContextProvider>
          <RouterProvider router={router} />
        </AuthContextProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
)
