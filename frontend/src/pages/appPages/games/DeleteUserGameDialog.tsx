import { X } from "lucide-react"
import type { myGame } from "../../types/games"
import api from "../../../api/api"
import { useEffect, useState } from "react"

function DeleteUserGameDialog(
    { setIsGameDeleteDialogOpen,
      setSelectedUserGameToDelete,
      resetUserGameSearch,
      game
    } 
    :
    {
      setIsGameDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
      setSelectedUserGameToDelete: React.Dispatch<React.SetStateAction<myGame | null>>
      resetUserGameSearch: () => Promise<void>
      game: myGame | null
    } 
  )
{

  const [hasLoaded, setHasLoaded] = useState<boolean>(false)

  const closeDialog = () => {
    setSelectedUserGameToDelete(null)
    setIsGameDeleteDialogOpen(false)
  }

  const deleteGame = async () => {
    const response = await api.delete("/games/delete_game/" + game?.id)
    console.log("Delete response: ", response)

    resetUserGameSearch()

    closeDialog()
  }

  useEffect(() => {
    setHasLoaded(true)
  }, [])


  return (
    <>
      <div className="w-full h-full fixed flex justify-center items-center inset-0 bg-black/60 z-998">
        <div className={`max-w-[80%] p-6 bg-slate-100 rounded-lg flex flex-col justify-between transition-all transform ${hasLoaded ? "opacity-100 scale-100" : "opacity-0 scale-50"} items-center gap-10 duration-300`}>
          <div className="w-full flex justify-end items-center">
            <button className="rounded-full flex justify-center items-center w-10 h-10 bg-red-500 p-1 hover:bg-red-600 transition-all duration-500 hover:cursor-pointer"
            onClick={closeDialog}
            >
              <X color="white" width={30} height={30} />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-xl"><span className="font-medium">Are you sure you want to delete</span><span className="font-bold"> {game?.name}</span><span className="font-medium">?</span></h1>
          </div>
          <div className="w-full flex justify-center items-center gap-10">
            <button className="rounded-lg py-3 px-4 text-xl bg-black text-white font-semibold hover:bg-gray-800 transition-all duration-500"
            onClick={deleteGame}
            >
              Yes
            </button>
            <button className="rounded-lg py-3 px-4 text-xl bg-slate-200 text-black font-semibold hover:bg-slate-300 transition-all duration-500"
            onClick={closeDialog}
            >
              No
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default DeleteUserGameDialog
 
 