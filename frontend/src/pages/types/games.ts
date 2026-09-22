
export type myGame = {
    id: number
    name: string
    imageUrl?: string
    releaseDate?: string
    releaseYear?: number
    summary?: string
}

export type fetchedGame = {
    cover?: {
        id: number,
        url: string 
    },

    first_release_date?: number,
    genres: {
        id: number,
        name: string
    }[],

    summary?: string,

    id: number,
    name: string
}

export type userAndGame = {
    user: {
        id: number,
        email: string
    },
    userGameId: number,
    favorite: boolean,
    id: number,
    rating: 1 | 2 | 3 | 4 | 5,
    review: string | null
}