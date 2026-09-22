
import {
  Play,
  Square,
  Info,
  CheckCircle2,
  Search,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Helmet } from "react-helmet";

import { type myGame } from "../../types/games";

import api from "../../../api/api";

import "../../../css/Games.css";

import gamePlaceholderImage from "../../../images/gamePlaceholderImage.png";

import {
  toast,
  ToastContainer,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";


/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type TrackingState = {
  game: myGame;
  startedAt: string;
  progress: number;
};


type TrackingResponse = {
  id: number;
  trackingId: string;
  gameId: number;
  startedAt: string;
  stoppedAt: string | null;
  progress: number;
  active: boolean;
  elapsedSeconds: number;
};


type TrackingStopResponse = {
  id: number;
  trackingId: string;
  gameId: number;
  durationSeconds: number;
  progress: number;
  streak: number;
  streakOccurred: boolean;
};


/* -------------------------------------------------------------------------- */
/*                              TRACKING ID                                   */
/* -------------------------------------------------------------------------- */

/*
 * This is the ONLY tracking information stored locally.
 *
 * It identifies this browser/device.
 *
 * The actual tracking start time, duration, progress and streak data
 * are stored by Spring Boot/PostgreSQL.
 */

const TRACKING_ID_STORAGE_KEY =
  "funtrack_tracking_id";


const getTrackingId = (): string => {

  let trackingId =
    localStorage.getItem(
      TRACKING_ID_STORAGE_KEY
    );


  if (!trackingId) {

    trackingId =
      crypto.randomUUID();

    localStorage.setItem(
      TRACKING_ID_STORAGE_KEY,
      trackingId
    );
  }


  return trackingId;
};


/* -------------------------------------------------------------------------- */
/*                              TRACKING API                                  */
/* -------------------------------------------------------------------------- */

const startTrackingApi = async (
  gameId: number,
  progress: number
): Promise<TrackingResponse> => {

  const trackingId =
    getTrackingId();


  const response =
    await api.post<TrackingResponse>(
      "/tracking/start",
      {
        trackingId,
        gameId,
        progress,
      }
    );


  return response.data;
};


const getActiveTrackingApi =
  async (): Promise<TrackingResponse | null> => {

    const trackingId =
      getTrackingId();


    try {

      const response =
        await api.get<TrackingResponse>(
          "/tracking/active",
          {
            params: {
              trackingId,
            },
          }
        );


      return response.data;

    } catch (error: any) {

      /*
       * 404 simply means there is no active
       * tracking session.
       */

      if (
        error?.response?.status === 404
      ) {

        return null;
      }


      throw error;
    }
  };


const stopTrackingApi =
  async (): Promise<TrackingStopResponse> => {

    const trackingId =
      getTrackingId();


    const response =
      await api.post<TrackingStopResponse>(
        "/tracking/stop",
        null,
        {
          params: {
            trackingId,
          },
        }
      );


    return response.data;
  };


const updateTrackingProgressApi =
  async (
    progress: number
  ): Promise<TrackingResponse> => {

    const trackingId =
      getTrackingId();


    const response =
      await api.patch<TrackingResponse>(
        "/tracking/progress",
        {
          progress,
        },
        {
          params: {
            trackingId,
          },
        }
      );


    return response.data;
  };


/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const formatDuration = (
  totalSeconds: number
): string => {

  const safeSeconds =
    Math.max(
      0,
      Math.floor(totalSeconds)
    );


  const hours =
    Math.floor(
      safeSeconds / 3600
    );


  const minutes =
    Math.floor(
      (safeSeconds % 3600) / 60
    );


  const seconds =
    safeSeconds % 60;


  return [
    hours
      .toString()
      .padStart(2, "0"),

    minutes
      .toString()
      .padStart(2, "0"),

    seconds
      .toString()
      .padStart(2, "0"),

  ].join(":");
};


/* -------------------------------------------------------------------------- */
/*                               CONFETTI                                     */
/* -------------------------------------------------------------------------- */

function Confetti() {

  const pieces =
    Array.from({
      length: 80,
    });


  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-0
        z-[9999]
        overflow-hidden
      "
    >

      {pieces.map(
        (_, index) => (

          <span
            key={index}
            className="
              absolute
              h-2
              w-2
              animate-[confetti_2.5s_ease-out_forwards]
            "
            style={{
              left:
                `${Math.random() * 100}%`,

              top:
                "-10px",

              backgroundColor: [
                "#f97316",
                "#fb923c",
                "#facc15",
                "#22c55e",
                "#3b82f6",
                "#a855f7",
                "#ec4899",
              ][index % 7],

              transform:
                `rotate(${Math.random() * 360}deg)`,

              animationDelay:
                `${Math.random() * 0.7}s`,
            }}
          />

        )
      )}

    </div>
  );
}


/* -------------------------------------------------------------------------- */
/*                                COMPONENT                                   */
/* -------------------------------------------------------------------------- */

function Tracking() {

  /* ------------------------------------------------------------------------ */
  /*                         USER GAME SEARCH                                 */
  /* ------------------------------------------------------------------------ */

  const [
    userGameSearchValue,
    setUserGameSearchValue,
  ] =
    useState<string>("");


  const [
    userGames,
    setUserGames,
  ] =
    useState<myGame[]>([]);


  const [
    userGameTotalPages,
    setUserGameTotalPages,
  ] =
    useState<number | null>(null);


  const [
    userGamePageNumber,
    setUserGamePageNumber,
  ] =
    useState<number | null>(null);


  const [
    selectedUserGame,
    setSelectedUserGame,
  ] =
    useState<myGame | null>(null);


  const userGamePageScrollDivRef =
    useRef<HTMLDivElement | null>(null);


  const userGameSearchTimeoutRef =
    useRef<number | null>(null);


  const userGameSearchValueRef =
    useRef<string>("");


  /* ------------------------------------------------------------------------ */
  /*                         TRACKING STATE                                   */
  /* ------------------------------------------------------------------------ */

  const [
    tracking,
    setTracking,
  ] =
    useState<TrackingState | null>(null);


  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] =
    useState<number>(0);


  const [
    progress,
    setProgress,
  ] =
    useState<number>(0);


  const [
    showProgressInput,
    setShowProgressInput,
  ] =
    useState<boolean>(false);


  const [
    progressInput,
    setProgressInput,
  ] =
    useState<string>("");


  const [
    showConfetti,
    setShowConfetti,
  ] =
    useState<boolean>(false);


  const [
    isLoadingTracking,
    setIsLoadingTracking,
  ] =
    useState<boolean>(true);


  const [
    isStartingTracking,
    setIsStartingTracking,
  ] =
    useState<boolean>(false);


  const [
    isStoppingTracking,
    setIsStoppingTracking,
  ] =
    useState<boolean>(false);


  const [
    isSavingProgress,
    setIsSavingProgress,
  ] =
    useState<boolean>(false);


  /* ------------------------------------------------------------------------ */
  /*                    FETCH USER GAMES ON PAGE LOAD                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {

    const handleFetchUserGames =
      async () => {

        try {

          const totalUserGamePages =
            await fetchUserGamesTotalPages();


          if (!totalUserGamePages) {
            return;
          }


          await fetchUserGames(1);

          setUserGamePageNumber(1);

        } catch (error) {

          console.error(
            "Failed to fetch user games:",
            error
          );

        }
      };


    handleFetchUserGames();

  }, []);


  /* ------------------------------------------------------------------------ */
  /*                         LOAD ACTIVE TRACKING                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {

    let cancelled = false;


    const loadActiveTracking =
      async () => {

        try {

          setIsLoadingTracking(true);


          const activeTracking =
            await getActiveTrackingApi();


          if (
            cancelled ||
            !activeTracking
          ) {

            return;
          }


          /*
           * The tracking API only stores the game ID.
           *
           * Fetch the corresponding game information so
           * the page can display its name and image.
           */

          const response =
            await api.get<myGame>(
              "/games/fetch_game_info?id=" +
              activeTracking.gameId
            );


          if (cancelled) {
            return;
          }


          const game =
            response.data;


          const newTracking:
            TrackingState = {

            game,

            startedAt:
              activeTracking.startedAt,

            progress:
              activeTracking.progress,
          };


          setTracking(
            newTracking
          );


          setSelectedUserGame(
            game
          );


          setProgress(
            activeTracking.progress
          );


          /*
           * The backend gives us the authoritative
           * elapsed time.
           */

          setElapsedSeconds(
            Math.max(
              0,
              activeTracking.elapsedSeconds
            )
          );


        } catch (error) {

          console.error(
            "Failed to load active tracking:",
            error
          );

        } finally {

          if (!cancelled) {

            setIsLoadingTracking(
              false
            );
          }
        }
      };


    loadActiveTracking();


    return () => {

      cancelled = true;
    };

  }, []);


  /* ------------------------------------------------------------------------ */
  /*                         REAL-TIME TIMER                                  */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {

    if (!tracking) {
      return;
    }


    /*
     * IMPORTANT:
     *
     * This interval does NOT record gameplay.
     *
     * It only refreshes what is displayed on screen.
     *
     * Spring Boot remains the source of truth.
     */

    const updateTimer =
      () => {

        const startedAt =
          new Date(
            tracking.startedAt
          ).getTime();


        const seconds =
          Math.floor(
            (
              Date.now() -
              startedAt
            ) / 1000
          );


        setElapsedSeconds(
          Math.max(
            0,
            seconds
          )
        );
      };


    updateTimer();


    const interval =
      window.setInterval(
        updateTimer,
        1000
      );


    return () => {

      window.clearInterval(
        interval
      );
    };

  }, [tracking]);


  /* ------------------------------------------------------------------------ */
  /*                         USER GAME SEARCH                                 */
  /* ------------------------------------------------------------------------ */

  const userGamesSearch =
    async (
      query: string,
      pageNumber: number
    ) => {

      try {

        await fetchUserGamesSearchTotalPages(
          query
        );


        const response =
          await api.post<myGame[]>(
            "/games/user_games_search",
            {
              query,
              pageNumber,
            }
          );


        if (
          !response.data ||
          !response.data.length
        ) {

          setUserGames([]);

          setUserGamePageNumber(
            null
          );

          setUserGameTotalPages(
            null
          );

          return;
        }


        setUserGames(
          response.data
        );


        setUserGamePageNumber(
          pageNumber
        );

      } catch (error) {

        console.error(
          "Failed to search user games:",
          error
        );

        setUserGames([]);
      }
    };


  const fetchUserGamesSearchTotalPages =
    async (
      query: string
    ) => {

      const response =
        await api.get<number>(
          "/games/user_games_search_total_pages?q=" +
          encodeURIComponent(query)
        );


      const totalPages =
        response.data;


      setUserGameTotalPages(
        totalPages
      );


      return totalPages;
    };


  const fetchUserGamesTotalPages =
    async () => {

      const response =
        await api.get<number>(
          "/games/user_games_total_pages"
        );


      const totalPages =
        response.data;


      setUserGameTotalPages(
        totalPages
      );


      return totalPages;
    };


  const fetchUserGames =
    async (
      pageNumber: number
    ) => {

      const response =
        await api.get<myGame[]>(
          "/games/" +
          pageNumber
        );


      const games =
        response.data;


      if (!games.length) {
        return;
      }


      setUserGames(
        games
      );
    };


  /* ------------------------------------------------------------------------ */
  /*                       SEARCH INPUT CHANGE                                */
  /* ------------------------------------------------------------------------ */

  const onUserGameSearchValueChange =
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {

      const searchQuery =
        e.target.value;


      setUserGameSearchValue(
        searchQuery
      );


      if (
        userGameSearchTimeoutRef.current
      ) {

        clearTimeout(
          userGameSearchTimeoutRef.current
        );
      }


      userGameSearchValueRef.current =
        searchQuery;


      userGameSearchTimeoutRef.current =
        window.setTimeout(
          () => {

            userGamesSearch(
              userGameSearchValueRef.current,
              1
            );

          },
          300
        );
    };


  /* ------------------------------------------------------------------------ */
  /*                         GAME SELECTION                                   */
  /* ------------------------------------------------------------------------ */

  const selectUserGame =
    (
      game: myGame
    ) => {

      /*
       * Never allow changing games while
       * an active session exists.
       */

      if (tracking) {

        toast.info(
          "Stop the current game before selecting another game."
        );

        return;
      }


      setSelectedUserGame(
        game
      );


      /*
       * Progress is associated with the game.
       *
       * Since this page is starting a new tracking session,
       * display 0 until the session begins.
       */

      setProgress(0);

      setElapsedSeconds(0);
    };


  /* ------------------------------------------------------------------------ */
  /*                         PAGINATION                                       */
  /* ------------------------------------------------------------------------ */

  const navigateToUserGamePage =
    (
      pageNumber: number
    ) => {

      setUserGamePageNumber(
        pageNumber
      );


      if (
        !userGameSearchValueRef.current
      ) {

        fetchUserGames(
          pageNumber
        );

        return;
      }


      userGamesSearch(
        userGameSearchValueRef.current,
        pageNumber
      );
    };


  const scrollUserGamePageLeft =
    () => {

      if (
        userGamePageScrollDivRef.current
      ) {

        userGamePageScrollDivRef.current.scrollBy({
          left: -120,
          behavior: "smooth",
        });
      }
    };


  const scrollUserGamePageRight =
    () => {

      if (
        userGamePageScrollDivRef.current
      ) {

        userGamePageScrollDivRef.current.scrollBy({
          left: 120,
          behavior: "smooth",
        });
      }
    };


  /* ------------------------------------------------------------------------ */
  /*                              START GAME                                  */
  /* ------------------------------------------------------------------------ */

  const startTracking =
    async () => {

      if (
        !selectedUserGame ||
        tracking ||
        isStartingTracking
      ) {

        return;
      }


      try {

        setIsStartingTracking(
          true
        );


        const response =
          await startTrackingApi(
            selectedUserGame.id,
            progress
          );


        const newTracking:
          TrackingState = {

          game:
            selectedUserGame,

          startedAt:
            response.startedAt,

          progress:
            response.progress,
        };


        setTracking(
          newTracking
        );


        setElapsedSeconds(
          Math.max(
            0,
            response.elapsedSeconds
          )
        );


        setProgress(
          response.progress
        );


      } catch (error: any) {

        console.error(
          "Failed to start tracking:",
          error
        );


        toast.error(
          error?.response?.data?.message ||
          "Failed to start tracking."
        );

      } finally {

        setIsStartingTracking(
          false
        );
      }
    };


  /* ------------------------------------------------------------------------ */
  /*                               STOP GAME                                  */
  /* ------------------------------------------------------------------------ */

  const stopTracking =
    async () => {

      if (
        !tracking ||
        isStoppingTracking
      ) {

        return;
      }


      try {

        setIsStoppingTracking(
          true
        );


        /*
         * Spring Boot calculates the authoritative
         * duration from startedAt.
         */

        const response =
          await stopTrackingApi();


        /*
         * Display the authoritative duration
         * returned by the server.
         */

        setElapsedSeconds(
          Math.max(
            0,
            response.durationSeconds
          )
        );


        setTracking(
          null
        );


        /*
         * The selected game remains selected.
         */

        setProgress(
          response.progress
        );


        /*
         * Streak notification comes from the backend.
         */

        if (
          response.streakOccurred &&
          response.streak >= 2
        ) {

          toast.success(
            `🔥 You're on a ${response.streak}-day gameplay streak! Keep it going!`,
            {
              autoClose: 5000,
            }
          );
        }


      } catch (error: any) {

        console.error(
          "Failed to stop tracking:",
          error
        );


        toast.error(
          error?.response?.data?.message ||
          "Failed to stop tracking."
        );

      } finally {

        setIsStoppingTracking(
          false
        );
      }
    };


  /* ------------------------------------------------------------------------ */
  /*                         PROGRESS INPUT                                  */
  /* ------------------------------------------------------------------------ */

  const openProgressInput =
    () => {

      setShowProgressInput(
        true
      );


      toast.info(
        "press enter after entering progress to save it",
        {
          autoClose: 3000,
        }
      );
    };


  const saveProgress =
    async () => {

      /*
       * Progress is only saved against an active
       * tracking session.
       */

      if (!tracking) {

        toast.info(
          "Start tracking a game before updating progress."
        );

        return;
      }


      const parsedProgress =
        Number(
          progressInput
        );


      if (
        progressInput.trim() === "" ||
        Number.isNaN(parsedProgress) ||
        parsedProgress < 0 ||
        parsedProgress > 100
      ) {

        toast.error(
          "Progress must be between 0.0 and 100.0"
        );

        return;
      }


      const newProgress =
        Math.round(
          parsedProgress * 10
        ) / 10;


      try {

        setIsSavingProgress(
          true
        );


        const response =
          await updateTrackingProgressApi(
            newProgress
          );


        /*
         * Use the value returned by the backend.
         */

        const savedProgress =
          response.progress;


        setProgress(
          savedProgress
        );


        setTracking(
          currentTracking => {

            if (!currentTracking) {
              return currentTracking;
            }


            return {
              ...currentTracking,
              progress:
                savedProgress,
            };
          }
        );


        setProgressInput(
          ""
        );


        setShowProgressInput(
          false
        );


        /*
         * Completion.
         */

        if (
          savedProgress === 100
        ) {

          toast.success(
            "🎉 Congratulations! You completed the game!",
            {
              autoClose: 5000,
            }
          );


          setShowConfetti(
            true
          );


          window.setTimeout(
            () => {

              setShowConfetti(
                false
              );

            },
            3000
          );
        }


      } catch (error: any) {

        console.error(
          "Failed to update progress:",
          error
        );


        toast.error(
          error?.response?.data?.message ||
          "Failed to update progress."
        );

      } finally {

        setIsSavingProgress(
          false
        );
      }
    };


  /* ------------------------------------------------------------------------ */
  /*                           PROGRESS KEY HANDLER                           */
  /* ------------------------------------------------------------------------ */

  const handleProgressKeyDown =
    (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();


        if (
          !isSavingProgress
        ) {

          saveProgress();
        }
      }
    };


  /* ------------------------------------------------------------------------ */
  /*                              CLEANUP                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {

    return () => {

      if (
        userGameSearchTimeoutRef.current
      ) {

        clearTimeout(
          userGameSearchTimeoutRef.current
        );
      }
    };

  }, []);


  /* ------------------------------------------------------------------------ */
  /*                                  UI                                      */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <Helmet>

        <title>
          FunTrack - Tracking
        </title>

      </Helmet>


      {showConfetti && (
        <Confetti />
      )}


      <div
        className="
          min-h-screen
          px-6
          py-8
          text-gray-900
          transition-colors
          dark:text-white
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
          "
        >

          {/* ---------------------------------------------------------------- */}
          {/*                              HEADER                              */}
          {/* ---------------------------------------------------------------- */}

          <div
            className="
              mt-20
              mb-8
            "
          >

            <h1
              className="
                text-4xl
                font-extrabold
                tracking-tight
              "
            >
              Tracking
            </h1>


            <p
              className="
                mt-2
                text-gray-600
                dark:text-slate-400
              "
            >
              Track your gameplay time and progress.
            </p>

          </div>


          {/* ---------------------------------------------------------------- */}
          {/*                              MAIN                                */}
          {/* ---------------------------------------------------------------- */}

          <div
            className="
              flex
              flex-col
              gap-8
              lg:flex-row
              lg:items-start
            "
          >

            {/* ============================================================ */}
            {/*                       GAME SEARCH BOX                        */}
            {/* ============================================================ */}

            <div
              className="
                w-full
                shrink-0
                lg:w-[300px]
              "
            >

              <div
                className="
                  flex
                  h-[500px]
                  w-full
                  flex-col
                  gap-5
                  rounded-xl
                  bg-zinc-50
                  p-3
                  dark:bg-slate-900
                "
              >

                {/* Search input */}

                <div
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-3
                    rounded-xl
                    bg-zinc-50
                    p-[0.08em]
                    text-xl
                    dark:bg-slate-900
                  "
                >

                  <div
                    className="
                      flex
                      w-full
                      gap-3
                      rounded-xl
                      border-[0.08em]
                      border-transparent
                      p-2
                      transition-all
                      duration-500
                      focus-within:border-sky-400
                      dark:focus-within:border-blue-600
                    "
                  >

                    <Search
                      className="
                        h-6
                        w-6
                        flex-none
                        text-gray-500
                      "
                    />


                    <input
                      className="
                        flex-1
                        bg-transparent
                        text-[0.8em]
                        text-black
                        outline-none
                        dark:text-white
                        lg:text-lg
                      "
                      type="text"
                      value={
                        userGameSearchValue
                      }
                      onChange={
                        onUserGameSearchValueChange
                      }
                      placeholder="Search your games..."
                    />

                  </div>

                </div>


                {/* Game results + pagination */}

                <div
                  className="
                    flex
                    w-full
                    flex-1
                    flex-col
                    items-center
                    justify-between
                    gap-5
                    rounded-xl
                    bg-zinc-50
                    p-3
                    dark:bg-slate-900
                  "
                >

                  {/* Game results */}

                  <div
                    className="
                      flex
                      h-[300px]
                      w-full
                      flex-col
                      items-center
                      justify-start
                      gap-5
                      overflow-y-auto
                      rounded-lg
                      bg-zinc-100
                      p-2
                      dark:bg-slate-800
                    "
                  >

                    {userGames.length > 0 ?

                      userGames.map(
                        (game) => (

                          <div
                            key={game.id}
                            className={`
                              flex
                              w-full
                              items-center
                              justify-between
                              rounded-xl
                              p-2
                              shadow-xs/20
                              transition-colors
                              duration-300
                              hover:cursor-pointer
                              ${
                                selectedUserGame?.id ===
                                game.id
                                  ? `
                                    bg-orange-200
                                    dark:bg-blue-900
                                  `
                                  : `
                                    bg-white
                                    hover:bg-gray-50
                                    dark:bg-slate-700
                                    dark:hover:bg-slate-600
                                  `
                              }
                            `}
                            onClick={() =>
                              selectUserGame(
                                game
                              )
                            }
                          >

                            <div
                              className="
                                h-15
                                w-15
                                text-center
                                lg:p-1
                                xl:h-18
                                xl:w-18
                              "
                            >

                              <img
                                className="
                                  h-full
                                  w-full
                                  rounded-sm
                                  object-contain
                                "
                                src={
                                  game.imageUrl
                                    ? game.imageUrl.replace(
                                        "t_thumb",
                                        "t_cover_small"
                                      )
                                    : gamePlaceholderImage
                                }
                                alt=""
                              />

                            </div>


                            <div
                              className="
                                flex
                                max-w-[60%]
                                flex-col
                                items-start
                                justify-start
                                gap-2
                                p-2
                              "
                            >

                              <h1
                                className="
                                  font-bold
                                  text-black
                                  dark:text-white
                                  lg:text-xl
                                "
                              >
                                {game.name}
                              </h1>


                              <h1
                                className="
                                  text-sm
                                  font-semibold
                                  text-gray-700
                                  dark:text-slate-300
                                  lg:text-lg
                                "
                              >
                                {
                                  game.releaseDate
                                    ? game.releaseYear
                                    : ""
                                }
                              </h1>

                            </div>

                          </div>

                        )
                      )

                      :

                      <h1
                        className="
                          flex
                          h-full
                          items-center
                          justify-center
                          text-center
                          text-gray-600
                          dark:text-slate-400
                        "
                      >
                        No games found.
                      </h1>
                    }

                  </div>


                  {/* Pagination */}

                  <div
                    className="
                      flex
                      w-full
                      items-center
                      justify-between
                    "
                  >

                    <h1
                      className="
                        text-lg
                        font-semibold
                        lg:text-xl
                      "
                    >
                      Page:
                    </h1>


                    <div
                      className="
                        flex
                        w-[80%]
                        items-center
                        justify-between
                        p-2
                      "
                    >

                      <button
                        type="button"
                        className="
                          rounded-md
                          bg-orange-500
                          px-2
                          py-1
                          text-lg
                          font-semibold
                          text-white
                          dark:bg-blue-500
                        "
                        onClick={
                          scrollUserGamePageLeft
                        }
                      >
                        &lt;
                      </button>


                      <div
                        className="
                          flex
                          min-h-12
                          w-[70%]
                          items-center
                          justify-around
                          gap-3
                          overflow-x-auto
                          rounded-md
                          bg-gray-100
                          px-2
                          scrollbar-none
                          dark:bg-slate-800
                        "
                        ref={
                          userGamePageScrollDivRef
                        }
                      >

                        {
                          userGameTotalPages
                            ? new Array(
                                userGameTotalPages
                              )
                                .fill(null)
                                .map(
                                  (_, index) => (

                                    <button
                                      type="button"
                                      key={
                                        index + 1
                                      }
                                      className={`
                                        flex
                                        items-center
                                        justify-center
                                        rounded-md
                                        px-3
                                        py-1
                                        font-medium
                                        shadow-xs/30
                                        ${
                                          index + 1 ===
                                          userGamePageNumber
                                            ? `
                                              bg-orange-500
                                              text-white
                                              dark:bg-blue-500
                                            `
                                            : `
                                              bg-gray-200
                                              text-black
                                              dark:bg-slate-600
                                              dark:text-white
                                            `
                                        }
                                      `}
                                      onClick={() =>
                                        navigateToUserGamePage(
                                          index + 1
                                        )
                                      }
                                    >
                                      {index + 1}
                                    </button>

                                  )
                                )

                            : null
                        }

                      </div>


                      <button
                        type="button"
                        className="
                          rounded-md
                          bg-orange-500
                          px-2
                          py-1
                          text-lg
                          font-semibold
                          text-white
                          dark:bg-blue-500
                        "
                        onClick={
                          scrollUserGamePageRight
                        }
                      >
                        &gt;
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* ============================================================ */}
            {/*                         TRACKING CARD                        */}
            {/* ============================================================ */}

            <div
              className="
                flex-1
                rounded-2xl
                border
                border-orange-200
                bg-white
                p-6
                shadow-lg
                dark:border-blue-900
                dark:bg-slate-900
              "
            >

              {/* Current game */}

              <div
                className="
                  mb-6
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <div>

                  <p
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      text-gray-500
                      dark:text-slate-500
                    "
                  >
                    Currently tracking
                  </p>


                  <h2
                    className="
                      mt-1
                      text-2xl
                      font-bold
                    "
                  >
                    {
                      selectedUserGame
                        ? selectedUserGame.name
                        : "No game selected"
                    }
                  </h2>

                </div>


                <div
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-bold
                    ${
                      tracking
                        ? `
                          bg-green-100
                          text-green-700
                          dark:bg-green-950
                          dark:text-green-400
                        `
                        : `
                          bg-gray-100
                          text-gray-600
                          dark:bg-slate-800
                          dark:text-slate-400
                        `
                    }
                  `}
                >
                  {
                    tracking
                      ? "PLAYING"
                      : "NOT PLAYING"
                  }
                </div>

              </div>


              {/* ========================================================== */}
              {/*                         TIME DISPLAY                       */}
              {/* ========================================================== */}

              <div
                className="
                  rounded-2xl
                  border
                  border-orange-100
                  bg-orange-50
                  p-8
                  text-center
                  dark:border-blue-900
                  dark:bg-slate-950
                "
              >

                <p
                  className="
                    mb-3
                    text-sm
                    font-semibold
                    text-gray-500
                    dark:text-slate-400
                  "
                >
                  Gameplay time
                </p>


                <div
                  className="
                    font-mono
                    text-5xl
                    font-bold
                    tracking-wider
                    text-orange-600
                    dark:text-blue-400
                  "
                >
                  {
                    formatDuration(
                      elapsedSeconds
                    )
                  }
                </div>


                {tracking && (

                  <p
                    className="
                      mt-3
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-xs
                      font-medium
                      text-green-600
                      dark:text-green-400
                    "
                  >

                    <span
                      className="
                        h-2
                        w-2
                        animate-pulse
                        rounded-full
                        bg-green-500
                      "
                    />

                    Tracking in real time

                  </p>

                )}

              </div>


              {/* ========================================================== */}
              {/*                        PROGRESS                             */}
              {/* ========================================================== */}

              <div
                className="
                  mt-8
                "
              >

                <div
                  className="
                    mb-3
                    flex
                    items-center
                    justify-between
                  "
                >

                  <div>

                    <p
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      Game progress
                    </p>


                    <p
                      className="
                        text-xs
                        text-gray-500
                        dark:text-slate-400
                      "
                    >
                      How much of the game you've completed
                    </p>

                  </div>


                  <span
                    className="
                      text-lg
                      font-bold
                      text-orange-600
                      dark:text-blue-400
                    "
                  >
                    {
                      progress.toFixed(1)
                    }%
                  </span>

                </div>


                {/* Animated progress bar */}

                <div
                  className="
                    h-5
                    w-full
                    overflow-hidden
                    rounded-full
                    bg-gray-200
                    dark:bg-slate-800
                  "
                >

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-orange-400
                      to-orange-600
                      transition-all
                      duration-700
                      ease-out
                      dark:from-blue-400
                      dark:to-blue-600
                    "
                    style={{
                      width:
                        `${progress}%`,
                    }}
                  />

                </div>


                {/* Progress controls */}

                <div
                  className="
                    mt-4
                    flex
                    flex-wrap
                    items-center
                    gap-3
                  "
                >

                  <button
                    type="button"
                    disabled={
                      !tracking ||
                      isSavingProgress
                    }
                    onClick={
                      openProgressInput
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-xl
                      bg-orange-500
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:bg-orange-600
                      active:scale-95
                      disabled:cursor-not-allowed
                      disabled:bg-gray-300
                      dark:bg-blue-600
                      dark:hover:bg-blue-500
                      dark:disabled:bg-slate-700
                    "
                  >

                    <Info
                      size={16}
                    />

                    Enter progress

                  </button>


                  {showProgressInput && (

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      <input
                        autoFocus
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={
                          progressInput
                        }
                        onChange={
                          (event) =>
                            setProgressInput(
                              event.target.value
                            )
                        }
                        onKeyDown={
                          handleProgressKeyDown
                        }
                        placeholder="0.0 - 100.0"
                        disabled={
                          isSavingProgress
                        }
                        className="
                          w-36
                          rounded-xl
                          border
                          border-orange-300
                          bg-white
                          px-3
                          py-2
                          text-sm
                          font-medium
                          outline-none
                          focus:ring-2
                          focus:ring-orange-500
                          dark:border-blue-700
                          dark:bg-slate-800
                          dark:text-white
                        "
                      />


                      <span
                        className="
                          text-sm
                          font-bold
                          text-gray-500
                          dark:text-slate-400
                        "
                      >
                        %
                      </span>

                    </div>

                  )}

                </div>

              </div>


              {/* ========================================================== */}
              {/*                            ACTION                          */}
              {/* ========================================================== */}

              <div
                className="
                  mt-8
                  border-t
                  border-gray-100
                  pt-6
                  dark:border-slate-800
                "
              >

                {!tracking ? (

                  <button
                    type="button"
                    disabled={
                      !selectedUserGame ||
                      isLoadingTracking ||
                      isStartingTracking
                    }
                    onClick={
                      startTracking
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-orange-600
                      px-5
                      py-3
                      font-bold
                      text-white
                      shadow-md
                      transition-all
                      hover:bg-orange-700
                      active:scale-[0.99]
                      disabled:cursor-not-allowed
                      disabled:bg-gray-300
                      disabled:text-gray-500
                      disabled:shadow-none
                      dark:bg-blue-600
                      dark:hover:bg-blue-500
                      dark:disabled:bg-slate-700
                      dark:disabled:text-slate-500
                    "
                  >

                    <Play
                      size={19}
                      fill="currentColor"
                    />

                    {
                      isStartingTracking
                        ? "Starting..."
                        : "Start"
                    }

                  </button>

                ) : (

                  <button
                    type="button"
                    disabled={
                      isStoppingTracking
                    }
                    onClick={
                      stopTracking
                    }
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-red-500
                      px-5
                      py-3
                      font-bold
                      text-white
                      shadow-md
                      transition-all
                      hover:bg-red-600
                      active:scale-[0.99]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >

                    <Square
                      size={17}
                      fill="currentColor"
                    />

                    {
                      isStoppingTracking
                        ? "Stopping..."
                        : "Stop"
                    }

                  </button>

                )}

              </div>


              {/* ========================================================== */}
              {/*                         HELPER TEXT                         */}
              {/* ========================================================== */}

              <div
                className="
                  mt-5
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  bg-gray-50
                  p-4
                  dark:bg-slate-800
                "
              >

                <CheckCircle2
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                    text-orange-500
                    dark:text-blue-400
                  "
                />


                <p
                  className="
                    text-xs
                    leading-relaxed
                    text-gray-600
                    dark:text-slate-400
                  "
                >
                  Your gameplay timer is based on the
                  saved start time on the server, so
                  closing the app, refreshing the page,
                  or closing your browser won't reset
                  the elapsed time.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ------------------------------------------------------------------ */}
      {/*                           TOASTS                                   */}
      {/* ------------------------------------------------------------------ */}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
      />


      {/* ------------------------------------------------------------------ */}
      {/*                           CONFETTI CSS                              */}
      {/* ------------------------------------------------------------------ */}

      <style>
        {`
          @keyframes confetti {

            0% {
              transform:
                translateY(-10px)
                rotate(0deg);

              opacity: 1;
            }

            100% {
              transform:
                translateY(110vh)
                rotate(720deg);

              opacity: 0;
            }

          }
        `}
      </style>

    </>
  );
}


export default Tracking;

