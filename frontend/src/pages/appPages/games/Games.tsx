import { ExternalLink, Plus, Search, Star, Trash, X } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { type myGame, type fetchedGame, type userAndGame } from "../../types/games"
import api from "../../../api/api"
import { AuthContext } from '../../../context/AuthContext'
import "../../../css/Games.css"
import gamePlaceholderImage from "../../../images/gamePlaceholderImage.png"
import APISearchResultBox from "./APISearchResultsBox"
import DeleteUserGameDialog from './DeleteUserGameDialog'



function Games() {
 
  const [userGames, setUserGames] = useState<myGame[]>([])
  const [apiSearchValue, setApiSearchValue] = useState<string>("")
  const [apiSearchResultBoxVisible, setApiSearchResultBoxVisible] = useState<boolean>(false)
  const [apiSearchResults, setApiSearchResults] = useState<myGame[]>([])
  const [selectedGameToAdd, setSelectedGameToAdd] = useState<myGame | null>(null)
  const [selectedUserGame, setSelectedUserGame] = useState<myGame | null>(null)
  const [userGamePageNumber, setUserGamePageNumber] = useState<number | null>(null)
  const [userGameTotalPages, setUserGameTotalPages] = useState<number | null>(null)
  const [selectedUserGameToDelete, setSelectedUserGameToDelete] = useState<myGame | null>(null)
  const [doesApiSearchHaveMore, setDoesApiSearchHaveMore] = useState<boolean>(true)
  const [apiSearchLoading, setApiSearchLoading] = useState<boolean>(false)
  const [isGameDeleteDialogOpen, setIsGameDeleteDialogOpen] = useState<boolean>(false)
  const [areApiSearchGamesLoading, setApiSearchGamesLoading] = useState<boolean>(false)
  const [userGameSearchValue, setUserGameSearchValue] = useState<string>("")
  const [currentStarIndex, setCurrentStarIndex] = useState<number>(0)
  const [currentUserAndGame, setCurrentUserAndGame] = useState<userAndGame | null>(null)
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false)

  const apiSearchTimeoutRef = useRef<number | null>(null)
  const apiSearchValueRef = useRef<string>("")
  const apiSearchOffsetRef = useRef<number>(0)

  const apiSearchResultBoxRef = useRef<HTMLDivElement | null>(null)
  const apiSearchDivRef = useRef<HTMLDivElement | null>(null)
  const userGamePageScrollDivRef = useRef<HTMLDivElement | null>(null)

  const userGameSearchTimeoutRef = useRef<number | null>(null)
  const userGameSearchValueRef = useRef<string>("")

  const auth = useContext(AuthContext)

  if(!auth)
  {
    throw new Error("Auth is not defined.")
  }

  useEffect(() => 
    {
      document.addEventListener("pointerdown", handleClickApiSearchResultBox)

      return () => 
      {
        document.removeEventListener("pointerdown", handleClickApiSearchResultBox)
      }
  }, [])

  useEffect(() => {
    const handleFetchUserGames = async () => {
      const totalUserGamePages = await fetchUserGamesTotalPages()
    
      if(!totalUserGamePages)
      {
        return 
      }

      fetchUserGames(1)
      setUserGamePageNumber(1)
    }

    handleFetchUserGames()


  }, [])

  const fetchUserGames = async (pageNumber: number) => {
      const response = await api.get("/games/" + pageNumber)

      const games: myGame[] = response.data

      if(!games.length)
      {
        return 
      }

     
      setUserGames(games)
    }

  const fetchUserGamesTotalPages = async () => {
    const response = await api.get("/games/user_games_total_pages")
    console.log("total pages response: ", response)
    const totalPages = response.data 

    setUserGameTotalPages(totalPages)
    return totalPages
  }

  const fetchUserAndGame = async (game: myGame) => {
    const response = await api.get("/games/get_user_and_game?id=" + game.id)
    console.log("Fetched user and game: ", response)

    const userAndGame: userAndGame = {
      user: { id: response.data.user.id, email: response.data.user.email },
      userGameId: response.data.userGame.id,
      favorite: response.data.favorite,
      id: response.data.id,
      rating: response.data.rating,
      review: response.data.review
    }
    
    setCurrentUserAndGame(userAndGame)
  }

  const resetUserGameSearch = async () => {
    const totalPages = await fetchUserGamesTotalPages()
    setUserGameTotalPages(totalPages)
    userGameSearchValueRef.current = ""
    
    if(totalPages)
    {
      fetchUserGames(1)
      setUserGamePageNumber(1)
    }
    else
    {
      setUserGames([])
      setUserGamePageNumber(null)
    }
  }
  
  const onUserGameSearchValueChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value

    setUserGameSearchValue(searchQuery)

    if(userGameSearchTimeoutRef.current)
    {
      clearTimeout(userGameSearchTimeoutRef.current) 
    }

    

    userGameSearchValueRef.current = searchQuery


    userGameSearchTimeoutRef.current = setTimeout(() => {
      userGamesSearch(userGameSearchValueRef.current, 1)      
    },
    300)
  }

  const userGamesSearch = async (query: string, pageNumber: number) => {

    await fetchUserGamesSearchTotalPages(query)

    const response = await api.post("/games/user_games_search", { query, pageNumber })
    console.log("User game search response: ", response.data, "query: ", query)

    if(!response.data?.length)
    {
      setUserGames([])
      setUserGamePageNumber(null)
      setUserGameTotalPages(null)
      return
    }

    setUserGames(response.data)
    setUserGamePageNumber(pageNumber)
    
  }

  const fetchUserGamesSearchTotalPages = async (query: string) => {
    const response = await api.get("/games/user_games_search_total_pages?q=" + query)
    const totalPages = response.data

    setUserGameTotalPages(totalPages)
    return totalPages 
  }

  const handleClickApiSearchResultBox = (e: MouseEvent) => 
    {
      if(apiSearchDivRef.current && !apiSearchDivRef.current.contains(e.target as Node) &&
        apiSearchResultBoxRef.current && !apiSearchResultBoxRef.current.contains(e.target as Node))
      {
        setApiSearchResultBoxVisible(false)
        setApiSearchResults([])
        apiSearchOffsetRef.current = 0
      }
  }

  const getDate = (dateString: number) => 
  {
    const date = new Date((dateString) * 1000)
    return date
  }

  const apiSearch = async (query: string, offset: number) => {

    try 
    {
      setDoesApiSearchHaveMore(true)

      const response = await api.post("/games/api_search", { query: query, offset: offset })

      console.log(response.data)

      setApiSearchGamesLoading(false)

      if(response.data.length === 0)
      {
        setDoesApiSearchHaveMore(false)
        return
      }
      

      if(query !== apiSearchValueRef.current)
      {
        return
      }
      
      const fetchedGames = response.data.map((game: fetchedGame) => {

        const fetchedReleaseDate = game.first_release_date
        let convertedReleaseDate
        let releaseYear
        let summary

        if(fetchedReleaseDate)
        {
          const releaseDate = getDate(fetchedReleaseDate)
          convertedReleaseDate = releaseDate.toLocaleDateString().replaceAll("/", "-")
          releaseYear = releaseDate.getFullYear()
        }

        const coverUrl = game?.cover?.url
        let coverImageUrl

        if(coverUrl)
        {
          coverImageUrl = "http:" + coverUrl
        }

        let updatedData: myGame = { name: game.name, id: game.id }

        summary = game.summary

        if(summary)
        {
          updatedData = { ...updatedData, summary: summary }
        }

        if(coverImageUrl)
        {
          updatedData = { ...updatedData, imageUrl: coverImageUrl }
        }

        if(convertedReleaseDate)
        {
          updatedData = { ...updatedData, releaseDate: convertedReleaseDate }
        }

        if(releaseYear)
        {
          updatedData = { ...updatedData, releaseYear: releaseYear }
        }

        return updatedData
      })

      setApiSearchResults((prev) => [ ...prev, ...fetchedGames])
    }
    catch(error) 
    {
      console.error(error)
    }
    finally
    {
      setApiSearchGamesLoading(false)
    }
  }

  const onApiSearchValueChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value
    setApiSearchValue(searchQuery)
    apiSearchValueRef.current = searchQuery

    
    apiSearchOffsetRef.current = 0

    if(apiSearchTimeoutRef.current)
    {
      clearTimeout(apiSearchTimeoutRef.current)
    }
    
    const timeout = setTimeout(() => {
        if(!searchQuery.trim()) 
        {
          return
        }

        setApiSearchResultBoxVisible(true)

        setApiSearchResults([])
        setApiSearchGamesLoading(true)
        apiSearch(searchQuery, 0)
    }, 300)

    apiSearchTimeoutRef.current = timeout

    if(apiSearchResultBoxRef.current)
    {
      apiSearchResultBoxRef.current.scrollTop = 0
    }

  }

  const loadMoreApiSearchGames = async () => 
  {
    const searchQuery = apiSearchValueRef.current
    apiSearchOffsetRef.current = apiSearchOffsetRef.current + 10
    const offset = apiSearchOffsetRef.current

    setApiSearchLoading(true)

    try
    {
      await apiSearch(searchQuery, offset)
    }
    catch(error)
    {
      console.error(error)
    }
    finally
    {
      setApiSearchLoading(false)
    }
  }

  const clearSelectedGameToAdd = () => {
    setSelectedGameToAdd(null)
  }

  const clearSelectedUserGame = () => {
    setSelectedUserGame(null)
  }
     
  const addGame = async () => {
    const response = await api.post("/games/add_game", selectedGameToAdd, { withCredentials: true })
    console.log(response)

    const totalPages = await fetchUserGamesTotalPages()

    fetchUserGames(userGamePageNumber || 1)
    setUserGameTotalPages(totalPages)
    
    if(!userGamePageNumber)
    {
      setUserGamePageNumber(1)
    }
  }

  const openEBayForGameToAdd = () => {
    const name = selectedGameToAdd?.name.trim()

    if(!name)
    {
      return 
    }

    const searchQuery = name.toLowerCase().split(/[^a-zA-Z0-9]+/).join("+")
    window.open(`https://www.ebay.com/sch/i.html?_nkw=${searchQuery}&_sacat=0&_from=R40&rt=nc`)
  }

  const openEBayForUserGame = () => {
    const name = selectedUserGame?.name.trim()

    if(!name)
    {
      return 
    }

    const searchQuery = name.toLowerCase().split(/[^a-zA-Z0-9]+/).join("+")
    window.open(`https://www.ebay.com/sch/i.html?_nkw=${searchQuery}&_sacat=0&_from=R40&rt=nc`)
  }

  const deleteUserGame = async (game: myGame) => {
    setSelectedUserGameToDelete(game)
    setIsGameDeleteDialogOpen(true)
    
  }

  const rateGame = async (game: myGame, rating: number) => {
    try
    {
      const response = await api.patch("/games/rate_game", { rating: rating }, { params: { gameId: game.id }})
      fetchUserAndGame(game)
      console.log(response)
    }
    catch(error)
    {
      console.error(error)
    }
  }

  const saveReview = async (game: myGame) => {
    try 
    {
      const response = await api.patch("/games/save_review", { review: currentUserAndGame?.review }, { params: { gameId: game.id }})
      console.log(response)
      fetchUserAndGame(game)
    }
    catch(error)
    {
      console.error(error)
    }
    finally
    {
      setIsEditingReview(false)
    }
  }

  const favoriteGame = async (game: myGame) => {
    try 
    {
      const response = await api.patch("/games/favorite_game", {}, { params: { gameId: game.id }})
      console.log(response)
      fetchUserAndGame(game)
    }
    catch(error)
    {
      console.error(error)
    }
  }

  const defavoriteGame = async (game: myGame) => {
    try
    {
      const response = await api.patch("/games/defavorite_game", {}, { params: { gameId: game.id }})
      console.log(response)
      fetchUserAndGame(game)
    }
    catch(error)
    {
      console.error(error)
    }
  }

  const selectUserGame = async (game: myGame) => {
    fetchUserAndGame(game)
    setSelectedUserGame(game)
  }

  const navigateToUserGamePage = (pageNumber: number) => {
    setUserGamePageNumber(pageNumber)

    if(!userGameSearchValueRef.current)
    {
      fetchUserGames(pageNumber)
      return
    }

    userGamesSearch(userGameSearchValueRef.current, pageNumber)


  }

  const scrollUserGamePageRight = () => {
    if(userGamePageScrollDivRef.current)
    {
      userGamePageScrollDivRef.current.scrollBy({
        left: 30,
        behavior: "smooth"
      })
    }
  }

  const scrollUserGamePageLeft = () => {
    if(userGamePageScrollDivRef.current)
    {
      userGamePageScrollDivRef.current.scrollBy({
        left: -30,
        behavior: "smooth"
      })
    }
  }


  return (
    <>
      <Helmet>
        <title>FunTrack - Your game buddy!</title>
      </Helmet>

      <div className={"w-full flex flex-col justify-start px-[2%] py-[5%] items-center gap-10 " + (isGameDeleteDialogOpen ? "overflow-hidden" : "")}>
        <div className="w-full grid lg:grid-cols-12 grid-cols-6 grid-rows-auto place-content-center gap-3">
          <div className="w-full mt-20 col-start-1 p-[3%] min-h-[90vh] lg:col-end-6 col-end-7 rounded-xl bg-neutral-100/80 shadow-md/20 dark:bg-white/90 backdrop-blur-[2px]">
            <div className="w-full h-full flex flex-col justify-start items-center gap-4 p-3">
              <h1 className="text-2xl font-semibold">My Games</h1>
              <div className="w-full flex flex-col justify-start items-center rounded-xl p-3 gap-3">
                <div className="w-full flex justify-center items-center rounded-xl text-xl bg-zinc-50 gap-3 p-[0.08em]">
                  <div className="w-full flex justify-stretch rounded-xl p-2 border-[0.08em] border-transparent focus-within:border-sky-400 dark:focus-within:border-blue-600 transition-all duration-500 gap-3">
                    <Search className="w-6 h-6 flex-none text-gray-500"/>
                    <input className="bg-transparent outline-none flex-1 lg:text-lg text-[0.8em] max-w-[70%] sm:max-w-[85%]" 
                    type="text"
                    value={userGameSearchValue}
                    onChange={onUserGameSearchValueChange}
                    />
                  </div>
                </div>
                <div className="w-full flex rounded-xl bg-zinc-50 p-3 flex-col justify-betweem items-center gap-5">
                  <div className="w-full h-[20vh] flex flex-col justify-start items-center rounded-lg bg-zinc-100 overflow-y-auto p-2 gap-5">
                    {
                      userGames.length > 0 ?
                           
                            userGames.map((game) =>
                              <div className="w-full bg-white flex justify-between shadow-xs/20 items-center rounded-xl p-2 hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer"
                              onClick={ () => selectUserGame(game) }
                              >
                                <div className="text-center lg:p-1 w-15 h-15 xl:w-18 xl:h-18">
                                  <img className="object-contain rounded-sm w-full h-full" src={game.imageUrl ? game.imageUrl.replace("t_thumb", "t_cover_small") : gamePlaceholderImage } />
                                </div>
                                <div inert={true} className="max-w-[60%] p-2 flex flex-col justify-start items-start gap-2">
                                  <h1 className="lg:text-xl font-bold">{ game.name }</h1>
                                  <h1 className="text-sm lg:text-lg font-semibold">{ game.releaseDate ? game.releaseYear : "" }</h1>
                                </div>
                                
                                  <button className="flex rounded-full bg-gray-100 w-6 h-6 justify-center items-center shadow-sm/20 hover:cursor-pointer hover:bg-gray-200 transition-all duration-500"
                                  onClick={ () => deleteUserGame(game) }
                                  >
                                    <Trash width={15} height={15} />
                                  </button>
                                
                              </div>
                              )
                          
                      :

                      <h1 className="text-center text-gray-600 text-wrap">No games found.</h1>
                    }
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <h1 className="text-lg lg:text-xl font-semibold">Page: </h1>
                    <div className="w-[80%] p-2 flex justify-between items-center">
                      <button className="rounded-md bg-orange-500 dark:bg-blue-500 py-1 px-2 text-white text-lg font-semibold"
                      onClick={scrollUserGamePageLeft}
                      >&lt;</button>
                      <div className="w-[70%] px-2 scrollbar-none rounded-md min-h-12 bg-gray-100 overflow-x-auto flex justify-around items-center gap-3"
                      ref={userGamePageScrollDivRef}
                      >
                        { new Array(userGameTotalPages).fill(null)
                        .map((_, index) => 
                          <button className={`${index + 1 === userGamePageNumber ? "bg-orange-500 dark:bg-blue-500 text-white" : "bg-gray-200"} px-3 py-1 rounded-md flex justify-center items-center font-medium shadow-xs/30`}
                          onClick={ () => navigateToUserGamePage(index + 1) }>
                            { index + 1 }
                          </button>) 
                        }
                      </div>
                      <button className="rounded-md bg-orange-500 dark:bg-blue-500 py-1 px-2 text-white text-lg font-semibold"
                      onClick={scrollUserGamePageRight}
                      >&gt;</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-around items-center mt-20 lg:min-h-[90vh] col-start-1 lg:col-start-6 p-[1%] lg:col-end-13 col-end-7 rounded-xl bg-neutral-100/90 shadow-md/20 dark:bg-white/90 dark:border-blue-400 backdrop-blur-[2px] border border-white">
            <div className={"w-full h-full rounded-xl flex justify-center items-center p-[2%] " + (currentUserAndGame?.favorite ? "bg-gradient-to-b from-pink-500 via-blue-500 to-purple-500" : "")}>
              <div className="w-full h-full flex flex-col justify-center items-center bg-[#F5F5F5] dark:bg-sky-100 rounded-xl p-3 gap-3">
                {
                  selectedUserGame ?
                
                
                
                  <div className="w-full h-full flex flex-col justify-center items-center gap-5">
                    <h1 className="w-full text-center text-2xl xl:text-3xl font-bold">
                      { selectedUserGame?.name }
                    </h1>
                    <div className="w-full flex flex-col lg:flex-row justify-around items-center lg:items-start gap-3">
                      <div className="min-w-[25%] p-2 flex flex-col justify-start items-center gap-5">
                        <img className="h-[25vh] rounded-lg"
                        src={selectedUserGame?.imageUrl ? selectedUserGame?.imageUrl?.replace("t_thumb", "t_cover_big") : gamePlaceholderImage } />
                        <div className="w-full flex justify-center items-center text-xl lg:text-2xl font-semibold">
                          { selectedUserGame?.releaseYear }
                        </div>
                      </div>
                      <div className="p-3 flex flex-col lg:h-[37vh] scrollbar-thumb-orange-600 dark:scrollbar-thumb-blue-400 scrollbar-track-transparent scrollbar- justify-start overflow-y-auto items-center lg:items-start gap-4">
                        <h1 className="text-xl xl:text-2xl font-semibold">Summary</h1>
                        <p className="lg:text-lg text-gray-500">
                          { selectedUserGame?.summary }
                        </p>
                      </div>
                    </div>
                    <div className="w-full flex justify-around items-center p-3 gap-4">
                        <button className="rounded-full lg:text-xl flex justify-around items-center bg-red-600 text-white p-4 font-bold hover:cursor-pointer gap-3
                        hover:scale-110 transition-all duration-500"
                        onClick={ clearSelectedUserGame }
                        >
                          <X strokeWidth={3} />
                          Clear Selection
                        </button>
                        <button className="rounded-xl text-white bg-green-600 p-4 text-xl font-semibold flex justify-around items-center hover:cursor-pointer hover:bg-green-700 transition-colors duration-500 gap-3"
                        onClick={openEBayForUserGame}
                        >
                          <ExternalLink />
                          Check on eBay
                        </button>
                    </div>
                    <div className="w-full flex flex-col lg:flex-row justify-center items-center gap-3">
                      <h1 className="text-lg font-medium">Rate this game: </h1>
                      <div className="flex justify-center items-center gap-2" onMouseLeave={() => setCurrentStarIndex(0) }>
                      {
                        new Array(5).fill(1).map((_, index) =>
                        {
                          const isFilled = currentUserAndGame ? (index <= currentUserAndGame?.rating - 1) : null
                          const isHoveredOver = (index <= currentStarIndex - 1)
                          const isEmpty = currentUserAndGame ? ((index > currentStarIndex - 1) || (index > currentUserAndGame.rating - 1)) : null




                          return (
                          <button onMouseOver={ () => setCurrentStarIndex(index + 1) }
                          onClick={ () => rateGame(selectedUserGame, index + 1) }
                          >
                          
                          
                            <Star strokeWidth={1.2} className={ "w-8 h-8 " + (isFilled ? "fill-yellow-500" : (isHoveredOver ? "fill-yellow-400/20" : (isEmpty ? "" : "")))} 
                            />
                            
                          </button>)
                        }
                        )
                      }
                      </div>
                    </div>
                    <div className="w-full flex justify-center items-center">
                      {
                        currentUserAndGame?.favorite ?

                        <button className="rounded-lg bg-red-700 px-4 py-3 text-white shadow-lg/20 font-semibold text-xl hover:cursor-pointer"
                        onClick={ () => defavoriteGame(selectedUserGame) }
                        >
                          De-favorite
                        </button>
                        :
                        <button className="rounded-lg bg-gradient-to-r from-blue-500 from-20% via-purple-500 via-70% to-indigo-700 px-4 py-3 text-white hover:scale-110 shadow-lg/20 font-semibold text-xl transition-all duration-500 hover:cursor-pointer"
                        onClick={ () => favoriteGame(selectedUserGame) }>
                          Favorite this game!
                        </button>
                      }
                    </div>
                    <div className="w-full flex flex-col justify-center items-center gap-6">
                      {
                        isEditingReview ?
                        <>
                          <h1 className="text-xl font-medium">Edit Review</h1>
                          <textarea rows={5} cols={10} className="w-[80%] bg-yellow-50 dark:bg-blue-50 px-3 py-2 rounded-lg placeholder:text-gray-500 resize-none border-1 border-gray-300 outline-none" 
                          value={currentUserAndGame?.review || ""}
                          onChange={ (e) => setCurrentUserAndGame((prev) => (prev ? { ...prev, review: e.target.value } : null))  }
                          placeholder="Leave a review!"
                          />
                          <button aria-keyshortcuts="escape" className="bg-orange-500 dark:bg-blue-500 rounded-lg px-3 py-2 text-white hover:cursor-pointer font-medium text-lg"
                          onClick={ () => saveReview(selectedUserGame) }
                          >
                            Save
                          </button>
                        </>
                        :
                        <>
                        {
                          currentUserAndGame?.review ?
                          <>
                          <h1 className="text-xl font-medium">Review</h1>
                          <div className="w-[80%] px-4 py-3 text-wrap rounded-2xl bg-orange-100/60 dark:bg-blue-100/60 text-gray-500 border-1 border-gray-300">
                            { currentUserAndGame?.review || "" }
                          </div>
                          </>
                          :
                          <h1 className="w-full text-center text-lg font-medium">No review</h1>
                          }
                          <button className="rounded-lg bg-orange-500 dark:bg-blue-500 px-3 py-2 text-white font-medium text-lg"
                          onClick={ () => setIsEditingReview(true) }
                          >
                          {
                            currentUserAndGame?.review ?
                            "Edit review"
                            :
                            "Add review"
                          }
                          </button>
                        </>
                      }
                    </div>
                  </div>
                  :
                  <div className="w-full h-full flex text-gray-600 text-lg justify-center items-center bg-gray-100">
                    No game selected.
                  </div>
                }
              </div>
            </div>
          </div>
          
          <div className="w-full lg:h-[40vh] mt-20 col-start-1 p-[3%] lg:col-end-6 col-end-7 rounded-xl bg-neutral-100/90 shadow-md/20 dark:bg-white/90 dark:border-blue-400 backdrop-blur-[2px] border border-white">
            <div className="w-full h-full flex flex-col justify-start items-center gap-4 px-3 pt-3 pb-40">
              <h1 className="text-2xl font-semibold">Add Games</h1>
              <div className="w-full flex flex-col justify-start items-center bg-[#F5F5F5] dark:bg-blue-400 rounded-xl p-3 gap-3"
              ref={apiSearchDivRef}
              >
                <div className="w-full flex justify-center items-center rounded-xl text-xl bg-zinc-50 gap-3 p-[0.08em]">
                  <div className="w-full flex justify-stretch rounded-xl p-2 border-[0.08em] border-transparent focus-within:border-sky-400 transition-all duration-500 gap-3">
                    <Search className="w-6 h-6 flex-none text-gray-500"/>
                    <div className="flex-1 justify-center items-center max-w-[70%] sm:max-w-[85%]">
                      <input className="w-full bg-transparent outline-none flex-1 lg:text-lg text-[0.8em] " 
                      onChange={ onApiSearchValueChange }
                      value={ apiSearchValue }
                      />
                      <br />
                      {
                        apiSearchResultBoxVisible &&
                          <APISearchResultBox
                          apiSearchResults={apiSearchResults}
                          ref={apiSearchResultBoxRef}
                          setSelectedGameToAdd={setSelectedGameToAdd}
                          doesApiSearchHaveMore={doesApiSearchHaveMore}
                          apiSearchLoading={apiSearchLoading}
                          loadMoreApiSearchGames={loadMoreApiSearchGames}
                          areApiSearchGamesLoading={areApiSearchGamesLoading}

                          />
                      }
                    </div>
                  </div>
                </div>
                
                
              </div>
            </div>
          </div>

          <div className="w-full h-full mt-20 col-start-1 lg:col-start-6 p-[3%] lg:col-end-13 col-end-7 rounded-xl bg-neutral-100/90 shadow-md/20 dark:bg-white/90 dark:border-blue-400 backdrop-blur-[2px] border border-white">
            <div className="w-full h-full flex flex-col justify-start items-center bg-[#F5F5F5] dark:bg-sky-100 rounded-xl p-3 gap-3">
              {
                selectedGameToAdd ?
              
              
              
              <div className="w-full h-full flex flex-col justify-start items-center gap-3">
                <h1 className="w-full text-center text-2xl xl:text-3xl font-bold">
                  { selectedGameToAdd?.name }
                </h1>
                <div className="w-full flex flex-col lg:flex-row justify-around items-center lg:items-start gap-3">
                  <div className="min-w-[25%] p-2 flex flex-col justify-start items-center gap-5">
                    <img className="h-[25vh] rounded-lg"
                    src={selectedGameToAdd.imageUrl ? selectedGameToAdd?.imageUrl?.replace("t_thumb", "t_cover_big") : gamePlaceholderImage } />
                    <div className="w-full flex justify-center items-center text-xl lg:text-2xl font-semibold">
                      { selectedGameToAdd.releaseYear }
                    </div>
                  </div>
                  <div className="p-3 flex flex-col justify-start items-center lg:items-start gap-4">
                    <h1 className="text-xl xl:text-2xl font-semibold">Summary</h1>
                    <p className="lg:text-lg text-gray-500">
                      { selectedGameToAdd.summary ? selectedGameToAdd.summary : "Summary not available." }
                    </p>
                  </div>
                </div>
                <div className="w-full flex justify-around items-center p-3 gap-4">
                    <button className="rounded-full lg:text-xl flex justify-around items-center bg-blue-600 text-white p-4 font-bold hover:cursor-pointer gap-3
                    hover:scale-110 transition-all duration-500"
                    onClick={ addGame }
                    >
                      <Plus strokeWidth={3} />
                      Add Game
                    </button>
                    <button className="rounded-full lg:text-xl flex justify-around items-center bg-red-600 text-white p-4 font-bold hover:cursor-pointer gap-3
                    hover:scale-110 transition-all duration-500"
                    onClick={ clearSelectedGameToAdd }
                    >
                      <X strokeWidth={3} />
                      Clear Selection
                    </button>
                </div>
                <button className="rounded-xl text-white bg-green-600 p-4 text-xl font-semibold flex justify-around items-center hover:cursor-pointer hover:bg-green-700 transition-colors duration-500 gap-3"
                onClick={openEBayForGameToAdd}
                >
                  <ExternalLink />
                  Check on eBay
                </button>
              </div>
              :
              <div className="w-full h-full flex text-gray-600 text-lg justify-center items-center bg-gray-100">
                No game selected.
              </div>
              }
            </div>
          </div>
          
        </div>
        <a className="w-full text-center mt-32 col-start-1 col-end-7 lg:col-end-13" href="https://www.flaticon.com/free-icons/gaming" title="gaming icons">Gaming icons created by Hilmy Abiyyu A. - Flaticon</a>
      </div>
      
      { isGameDeleteDialogOpen &&
        <DeleteUserGameDialog 
        setIsGameDeleteDialogOpen={setIsGameDeleteDialogOpen}
        setSelectedUserGameToDelete={setSelectedUserGameToDelete}
        resetUserGameSearch={resetUserGameSearch}
        game={selectedUserGameToDelete}
        />
      }
    </>
  )
}

export default Games
