import type { myGame } from "../../types/games"
import gamePlaceholderImage from "../../../images/gamePlaceholderImage.png"
 
 
 
 
 
 function APISearchResultBox({ 
    apiSearchResults,
    ref,
    setSelectedGameToAdd,
    doesApiSearchHaveMore,
    apiSearchLoading,
    loadMoreApiSearchGames,
    areApiSearchGamesLoading
    } 
    : 
    { 
      apiSearchResults: myGame[],
      ref: React.RefObject<HTMLDivElement | null>,
      setSelectedGameToAdd: React.Dispatch<React.SetStateAction<myGame | null>>,
      doesApiSearchHaveMore: boolean,
      apiSearchLoading: boolean,
      loadMoreApiSearchGames: () => Promise<void>,
      areApiSearchGamesLoading: boolean
     })
  {

        if(areApiSearchGamesLoading)
        {
          return (
            <div className={`w-[80%] h-[30vh] overflow-y-auto flex flex-col justify-start items-center rounded-lg shadow-sm/10 mt-3 fixed p-3 z-999 bg-slate-100/90 dark:bg-gray-700/80 backdrop-blur-md gap-3`}
            id="api_search_results_container"
            >
              <div className="w-full flex flex-col justify-start p-3 items-center gap-3">
              {
                new Array(10).fill(1).map(() =>
                
                <div className="w-full h-[15vh] bg-white dark:bg-indigo-800 flex justify-stretch shadow-md/20 items-center rounded-3xl p-2 hover:bg-gray-200 hover:dark:bg-indigo-900 gap-3 transition-colors duration-300 hover:cursor-pointer"
                >
                  <div className="text-center dark:bg-gray-800 bg-gray-400 rounded-md lg:p-1 w-15 h-15 xl:w-18 xl:h-18 animate-pulse">
                  </div>
                  <div inert={true} className="w-full p-2 flex flex-col justify-between items-stretch gap-2">
                    <div className="w-full rounded-md py-2 bg-gray-300 dark:bg-gray-700 lg:text-xl font-bold"></div>
                    <h1 className="w-[30%] text-sm rounded-md bg-gray-300 dark:bg-gray-700 lg:text-lg py-2 font-semibold"></h1>
                  </div>
                </div>
                )
              }
              </div>
            </div>
          )
        }
      
        
        if(apiSearchResults.length > 0)
        {
          
          return (
          <div id="api_search_results_container" className={`w-[80%] h-[30vh] overflow-y-auto flex flex-col justify-start items-center rounded-lg shadow-sm/10 mt-3 fixed p-3 z-999 bg-slate-100/90 dark:bg-gray-700/80 backdrop-blur-md gap-3`}
          ref={ref}
          >
            <div className="w-full flex flex-col justify-start p-3 items-center gap-3">
              { 
                apiSearchResults.map((game) =>

                  
                    
                    
                    
                    <div className="w-full bg-white dark:bg-indigo-800 flex justify-stretch shadow-md/20 items-center rounded-3xl p-2 hover:bg-gray-200 gap-3 transition-colors hover:dark:bg-indigo-900 duration-300 hover:cursor-pointer"
                    onClick={ () => setSelectedGameToAdd(game) }
                    >
                      <div className="text-center lg:p-1 w-15 h-15 xl:w-18 xl:h-18">
                        <img className="object-contain rounded-sm w-full h-full" src={game.imageUrl ? game.imageUrl.replace("t_thumb", "t_cover_small") : gamePlaceholderImage } />
                      </div>
                      <div inert={true} className="p-2 flex flex-col justify-start items-start gap-2">
                        <h1 className="lg:text-xl dark:text-white font-bold">{ game.name }</h1>
                        <h1 className="text-sm lg:text-lg dark:text-white font-semibold">{ game.releaseDate ? game.releaseYear : "" }</h1>
                      </div>
                    </div>
                  
                  )
              }
            </div>
            {
              (doesApiSearchHaveMore && !apiSearchLoading) ? 
              
              <button className="lg:text-lg font-semibold hover:text-gray-600 dark:text-white hover:dark:text-gray-200 hover:cursor-pointer"
              onClick={ loadMoreApiSearchGames }
              >
                Load more
              </button>
              
              :
              apiSearchLoading ? 
                
              <div className="border border-4 border-transparent border-t-gray-500 dark:border-t-gray-100 p-4 rounded-full animate-spin"></div>
              :
              <>
              </>
            }
          </div>
          ) 
        }
        else
        {
          return (
            <div className="w-[80%] flex flex-col justify-center items-center rounded-lg shadow-sm/10 mt-3 fixed px-3 py-9 z-999 bg-slate-50 gap-3">
              <div className="text-gray-500 lg:text-lg">No search results.</div>
            </div>
          )
        }
    
    
  }

export default APISearchResultBox