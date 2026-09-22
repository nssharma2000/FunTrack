import { type myGame } from "./games"

export type collection = {
    id?: number,
    name: string,
    gameIds: number[],
    userId?: number
    imageUrl?: string
}