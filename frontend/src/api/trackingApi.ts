import api from "./api";

export interface TrackingResponse {
  id: number;
  trackingId: string;
  gameId: number;
  startedAt: string;
  stoppedAt: string | null;
  progress: number;
  active: boolean;
  elapsedSeconds: number;
}

export interface TrackingStopResponse {
  id: number;
  trackingId: string;
  gameId: number;
  durationSeconds: number;
  progress: number;
  streak: number;
  streakOccurred: boolean;
}

export interface DailyTrackingResponse {
  date: string;
  seconds: number;
}

export interface TrackingHistoryResponse {
  id: number;
  gameId: number;
  startedAt: string;
  stoppedAt: string | null;
  durationSeconds: number;
  progress: number;
}


const TRACKING_ID_STORAGE_KEY =
  "funtrack_tracking_id";


export const getTrackingId = (): string => {

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


export const startTrackingApi = async (
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
        progress
      }
    );

  return response.data;
};


export const getActiveTrackingApi =
  async (): Promise<TrackingResponse | null> => {

    const trackingId =
      getTrackingId();

    try {

      const response =
        await api.get<TrackingResponse>(
          "/tracking/active",
          {
            params: {
              trackingId
            }
          }
        );

      return response.data;

    } catch (error: any) {

      if (
        error?.response?.status === 404
      ) {
        return null;
      }

      throw error;
    }
  };


export const stopTrackingApi =
  async (): Promise<TrackingStopResponse> => {

    const trackingId =
      getTrackingId();

    const response =
      await api.post<TrackingStopResponse>(
        "/tracking/stop",
        null,
        {
          params: {
            trackingId
          }
        }
      );

    return response.data;
  };


export const updateTrackingProgressApi =
  async (
    progress: number
  ): Promise<TrackingResponse> => {

    const trackingId =
      getTrackingId();

    const response =
      await api.patch<TrackingResponse>(
        "/tracking/progress",
        {
          progress
        },
        {
          params: {
            trackingId
          }
        }
      );

    return response.data;
  };


export const getTrackingStreakApi =
  async (): Promise<number> => {

    const trackingId =
      getTrackingId();

    const response =
      await api.get<number>(
        "/tracking/streak",
        {
          params: {
            trackingId
          }
        }
      );

    return response.data;
  };


export const getDailyTrackingApi =
  async (
    startDate: string,
    endDate: string
  ): Promise<DailyTrackingResponse[]> => {

    const trackingId =
      getTrackingId();

    const response =
      await api.get<DailyTrackingResponse[]>(
        "/tracking/daily",
        {
          params: {
            trackingId,
            startDate,
            endDate
          }
        }
      );

    return response.data;
  };


export const getTrackingHistoryApi =
  async (): Promise<TrackingHistoryResponse[]> => {

    const trackingId =
      getTrackingId();

    const response =
      await api.get<TrackingHistoryResponse[]>(
        "/tracking/history",
        {
          params: {
            trackingId
          }
        }
      );

    return response.data;
  };