import { Search, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet'
import { type myGame } from "../../types/games"
import { type collection } from '../../types/collections'
import api from "../../../api/api"
import "../../../css/Games.css"
import gamePlaceholderImage from "../../../images/gamePlaceholderImage.png"
import { toast, ToastContainer } from 'react-toastify'
import { useTheme } from '../../../theme-provider'



function Collections() {

  const [collections, setCollections] = useState<collection[]>([])

  const [userGameSearchValue, setUserGameSearchValue] = useState<string>("")
  const [userGames, setUserGames] = useState<myGame[]>([])
  const [userGameTotalPages, setUserGameTotalPages] = useState<number | null>(null)
  const [userGamePageNumber, setUserGamePageNumber] = useState<number | null>(null)

  const [selectedUserGame, setSelectedUserGame] = useState<myGame | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<collection | null>(null)
  const [selectedCollectionGames, setSelectedCollectionGames] = useState<myGame[]>([])
  const [isRenamingCollection, setIsRenamingCollection] = useState<boolean>(false)
  const [editingName, setEditingName] = useState<string>("")


  const { theme } = useTheme()


  const userGamePageScrollDivRef = useRef<HTMLDivElement | null>(null)
  const userGameSearchTimeoutRef = useRef<number | null>(null)
  const userGameSearchValueRef = useRef<string>("")


  useEffect(() => {
    fetchCollections(null)
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

  useEffect(() => {
    if(!selectedCollection)
    {
      return 
    }
    
    const gameIds = selectedCollection.gameIds
    
    fetchCollectionGames(gameIds)
  }, [selectedCollection])

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

  const fetchUserGamesTotalPages = async () => {
    const response = await api.get("/games/user_games_total_pages")
    console.log("total pages response: ", response)
    const totalPages = response.data 

    setUserGameTotalPages(totalPages)
    return totalPages
  }

  const fetchUserGames = async (pageNumber: number) => {
      const response = await api.get("/games/" + pageNumber)

      const games: myGame[] = response.data

      if(!games.length)
      {
        return 
      }

     
      setUserGames(games)
    }


  

  const fetchCollections = async (currentCollectionId: number | null) => {
      const response = await api.get("/collections/get_collections")
      console.log(response.data)

      const allCollections = await Promise.all(response.data.map(async (c: any) => {
        const { user, ...collection } = c
        collection.userId = user.id
        
        const imageUrl = await fetchFirstGameImageUrl(collection)

        collection.imageUrl = imageUrl

        return collection
      }))

      console.log("Collections after modification: ", allCollections)

      setCollections(allCollections)

      if(currentCollectionId)
      {
        const currentCollection = allCollections.find((c: collection) => (c.id === currentCollectionId))
        setSelectedCollection(currentCollection)
      }
    }

  const fetchFirstGameImageUrl = async (collection: collection) => {
    if(!collection.gameIds.length)
    {
      return gamePlaceholderImage
    }


    const response = await api.get("/games/fetch_game_info?id=" + collection.gameIds[0])
    const game: myGame = response.data

    let imageUrl

    if(game.imageUrl)
    {
      imageUrl = game.imageUrl
    }
    else
    {
      imageUrl = gamePlaceholderImage
    }

    return imageUrl
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


  const createCollection = async () => {

    try
    {
      const newCollection: collection = {
        name: "Untitled collection",
        gameIds: [],
      }

      const response = await api.post("/collections/create", newCollection)
      console.log(response)

      await fetchCollections(null)
    }
    catch(error: any)
    {
      console.error(error)
      toast.error(error.message,
        {
          style: {
            backgroundColor: theme === "dark" ? "rgba(255, 0, 0, 0.6)" : "rgba(255, 220, 220, 0.8)",
            color: theme === "light" ? "black" : "white",
            fontWeight: 600,
            backdropFilter: "blur(10px)"
          }
        }
      )
    }

  }

  const selectCollection = async (collection: collection) => {
    setSelectedCollection(collection)
  }

  const fetchCollectionGames = async (gameIds: number[]) => {
    if(!gameIds.length)
    {
      setSelectedCollectionGames([])
      return
    }

    const collectionGames = await Promise.all(
      gameIds.map(async (gameId) => {
        const response = await api.get("/games/fetch_game_info?id=" + gameId)

        const game: myGame = response.data
        return game 
    }))

    setSelectedCollectionGames(collectionGames)
  }

  const addGameToCollection = async (game: myGame) => {

    if(!selectedCollection)
    {
      return 
    }

    const currentCollectionId = selectedCollection.id

    if(currentCollectionId !== 0 && !currentCollectionId)
    {
      return
    }
    
    const selectedCollectionGameIds = selectedCollection?.gameIds

    if(selectedCollectionGameIds.length >= 10)
    {
      toast.error("You cannot have more than 10 games in a collection!",
          {
            style: {
              backgroundColor: theme === "dark" ? "rgba(255, 0, 0, 0.6)" : "rgba(255, 220, 220, 0.8)",
              color: theme === "light" ? "black" : "white",
              fontWeight: 600,
              backdropFilter: "blur(10px)"
            }
          }
        )
    }

    if(selectedCollectionGameIds.find((id) => (id === game.id)))
    {
      toast.warn("You have already added this game!")
      return
    }

    selectedCollectionGameIds?.push(game.id)

    const response = await api.patch("/collections/add_game", selectedCollectionGameIds, { params: { collectionId: selectedCollection.id }})
    console.log("Add game response: ", response.data)

    const gameIds = response.data.gameIds 

    await fetchCollections(currentCollectionId)
    fetchCollectionGames(gameIds)
  }

  const deleteCollection = async () => {
    try 
    {
      const response = await api.delete("/collections/delete_collection?id=" + selectedCollection?.id)
      console.log(response)
    }
    catch(error: any)
    {
      console.error(error)
      toast.error(error.message,
          {
            style: {
              backgroundColor: theme === "dark" ? "rgba(255, 0, 0, 0.6)" : "rgba(255, 220, 220, 0.8)",
              color: theme === "light" ? "black" : "white",
              fontWeight: 600,
              backdropFilter: "blur(10px)"
            }
          }
        )
    }
    finally
    {
      await fetchCollections(null)
      fetchCollectionGames([])
    }
    
  }

  const deleteGameFromCollection = async (gameId: number) => {
    if(!selectedCollection)
    {
      return 
    }

    const currentCollectionId = selectedCollection.id

    if(currentCollectionId !== 0 && !currentCollectionId)
    {
      return
    }

    console.log("Game id: ", gameId)
    
    let selectedCollectionGameIds = selectedCollection?.gameIds

    selectedCollectionGameIds = selectedCollectionGameIds?.filter((id) => (gameId !== id))

    console.log(selectedCollectionGameIds)

    const response = await api.patch("/collections/delete_game", selectedCollectionGameIds, { params: { collectionId: selectedCollection.id }})
    console.log("Delete game response: ", response.data)

    const gameIds = response.data.gameIds 

    await fetchCollections(currentCollectionId)
    fetchCollectionGames(gameIds)
  }

  const renameCollection = async (e: React.KeyboardEvent<HTMLInputElement>, collection: collection) => {
    if(e.key === "Enter" && (collection.id || collection.id === 0))
    {
      try
      {
        const newName = editingName
        const response = await api.patch("/collections/rename_collection", { name: newName }, { params: { collectionId: collection.id }})
        console.log(response)
      }
      catch(error: any)
      {
        console.error(error)
        toast.error(error.message,
          {
            style: {
              backgroundColor: theme === "dark" ? "rgba(255, 0, 0, 0.6)" : "rgba(255, 220, 220, 0.8)",
              color: theme === "light" ? "black" : "white",
              fontWeight: 600,
              backdropFilter: "blur(10px)"
            }
          }
        )
      }
      finally
      {
        setIsRenamingCollection(false)
        fetchCollections(collection.id)
      }
    }
  }

  const startRenamingCollection = () => {
    setIsRenamingCollection(true)

    if(!selectedCollection?.name)
    {
      return
    }

    toast.info("Press Enter after typing to rename collection.")
    
    setEditingName(selectedCollection?.name)
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

  const scrollUserGamePageLeft = () => {
    if(userGamePageScrollDivRef.current)
    {
      userGamePageScrollDivRef.current.scrollBy({
        left: -30,
        behavior: "smooth"
      })
    }
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



  return (
    <>
      <Helmet>
        <title>My Collections</title>
      </Helmet>

      <div className="w-full min-h-screen p-4 flex justify-center items-start">
        <div className="w-full h-full flex flex-col justify-start items-center mt-30 rounded-2xl bg-slate-100/60 border-1 backdrop-blur-lg border-slate-100 p-4 lg:p-8 gap-6">
          <h1 className="text-4xl text-gray-700 font-bold">My Collections</h1>
          <div className="w-full flex justify-start items-center bg-white overflow-x-auto h-[50vh] lg:h-[30vh] rounded-lg inset-shadow-xs/20 p-3 gap-3">
            {
              collections.length > 0 ?
                collections.map((c) => 
                <div className={"w-[30vw] lg:w-[20vw] h-[40vh] lg:h-[25vh] " + (c === selectedCollection ? "bg-orange-700 dark:bg-indigo-600" : "bg-orange-400 dark:bg-blue-500") + " rounded-lg flex flex-col justify-start items-center border-1 border-orange-50 p-3 gap-3"}
                onClick={ () => selectCollection(c) }>
                  {
                    isRenamingCollection && selectedCollection?.id === c.id ? 
                    <input className="bg-white text-xl p-2 font-medium rounded-lg w-[95%] outline-none border-1 border-gray-300" 
                    type="text"  
                    value={editingName}
                    onChange={ (e) => setEditingName(e.target.value) }
                    onKeyDown={ (e) => {
                        if(selectedCollection)
                        { 
                          renameCollection(e, selectedCollection)
                        } 
                      }
                    }
                    />
                    :
                    <h1 className="text-center text-xl lg:text-2xl text-white font-medium">{ c?.name }</h1>
                  }
                    <div className="w-[50%] flex justify-center items-center">
                      <img className="max-w-24 rounded-lg max-h-38 object-cover" src={ c.imageUrl } />
                    </div>
                </div>
              )
              :
              <h1 className="w-full h-full flex justify-center items-center text-center text-lg text-gray-400">You don't have any collections.</h1>
            }
          </div>

          <div className="w-full flex justify-center items-center gap-6">
            <button className="rounded-lg bg-violet-500 flex justify-center items-center hover:bg-violet-600 px-6 py-5 text-white text-xl lg:text-2xl font-medium hover:cursor-pointer transtion-all duration-500 shadow-sm/30"
            onClick={ createCollection }
            >
              Create new collection
            </button>
            <button className="rounded-lg bg-green-500 flex justify-center disabled:bg-gray-400 items-center hover:bg-green-600 px-6 py-5 text-white text-xl lg:text-2xl font-medium hover:cursor-pointer transtion-all duration-500"
            disabled={!selectedCollection}
            onClick={ startRenamingCollection }
            >
              Rename collection
            </button>
            <button className="rounded-lg bg-red-600 flex justify-center disabled:bg-gray-400 items-center hover:bg-red-700 px-6 py-5 text-white text-xl lg:text-2xl font-medium hover:cursor-pointer transtion-all duration-500"
            disabled={!selectedCollection}
            onClick={ deleteCollection }
            >
              Delete collection
            </button>
          </div>
          <div className="w-full flex flex-col lg:flex-row justify-around items-center lg:items-start gap-5">
            <div className="w-full lg:max-w-[40%] flex flex-col justify-start items-center rounded-xl p-3 gap-3">
                <h1 className="text-2xl font-semibold">My Games</h1>
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
                              <div className={"w-full " + (game === selectedUserGame ? "bg-gray-300" : "bg-white hover:bg-gray-50") + " flex justify-between shadow-xs/20 items-center rounded-xl p-2  transition-colors duration-300 hover:cursor-pointer"}
                              onClick={ () => setSelectedUserGame(game) }
                              >
                                <div className="text-center lg:p-1 w-15 h-15 xl:w-18 xl:h-18">
                                  <img className="object-contain rounded-sm w-full h-full" src={game.imageUrl ? game.imageUrl.replace("t_thumb", "t_cover_small") : gamePlaceholderImage } />
                                </div>
                                <div inert={true} className="max-w-[60%] p-2 flex flex-col justify-start items-start gap-2">
                                  <h1 className="lg:text-xl font-bold">{ game.name }</h1>
                                  <h1 className="text-sm lg:text-lg font-semibold">{ game.releaseDate ? game.releaseYear : "" }</h1>
                                </div>
                                
                              </div>
                              )
                          
                      :

                      <h1 className="text-center text-gray-600 text-wrap">No games found.</h1>
                    }
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <h1 className="text-lg lg:text-xl font-semibold">Page: </h1>
                    <div className="w-[80%] p-2 flex justify-between items-center">
                      <button className="rounded-md bg-orange-500 dark:bg-blue-500 py-1 px-2 text-white text-lg font-semibold disabled:bg-gray-"
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
              
              <div className="lg:min-h-[30vh] flex justify-center items-center">
                <button className="flex justify-center items-center text-white disabled:bg-gray-400 gap-3 bg-blue-500 rounded-lg px-4 py-3 text-xl font-medium hover:cursor-pointer hover:bg-blue-700 transition-all duration-500"
                disabled={!selectedUserGame || !selectedCollection}
                onClick={ () => { 
                    if(selectedUserGame)
                    { 
                      addGameToCollection(selectedUserGame)
                    }
                  }
                }
                >
                  <h1>Add to collection</h1>
                </button>
              </div>

              <div className="w-full h-[50vh] lg:min-w-[30%] lg:max-w-[40%] p-2 rounded-lg flex flex-col justify-start items-center overflow-y-auto bg-slate-100 border-1 border-slate-200 gap-3">
              {
                selectedCollectionGames.length > 0 ?

                selectedCollectionGames.map((game) => 
                <div className="w-[95%] rounded-lg flex justify-between items-center p-3 bg-gray-200">
                  <div className="text-center lg:p-1 w-15 h-15 xl:w-18 xl:h-18">
                    <img className="object-contain rounded-sm w-full h-full" src={game?.imageUrl ? game?.imageUrl.replace("t_thumb", "t_cover_small") : gamePlaceholderImage } />
                  </div>
                  <div inert={true} className="max-w-[60%] p-2 flex flex-col justify-start items-start gap-2">
                    <h1 className="lg:text-xl font-bold">{ game?.name }</h1>
                    <h1 className="text-sm lg:text-lg font-semibold">{ game?.releaseDate ? game?.releaseYear : "" }</h1>
                  </div>
                  <button className="flex rounded-full bg-gray-100 w-6 h-6 justify-center items-center shadow-sm/20 hover:cursor-pointer hover:bg-gray-200 transition-all duration-500"
                  onClick={ () => deleteGameFromCollection(game.id) }
                  >
                    <Trash width={15} height={15} />
                  </button>
                </div>
              )
              :
              <h1 className="text-lg text-gray-500">No games in collection.</h1>
              }
              </div>

          </div>
        </div>

        <ToastContainer />
      </div>
    </>
  )
 
}

export default Collections
