import { CalendarDays, CalendarRange, Clock, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import api from "../../../api/api";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyResponse = {
  date: string;
  seconds: number;
};

const TRACKING_ID_STORAGE_KEY = "funtrack_tracking_id";

const getTrackingId = () => {
  let id = localStorage.getItem(TRACKING_ID_STORAGE_KEY);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(TRACKING_ID_STORAGE_KEY, id);
  }

  return id;
};

const formatDate = (date: Date) =>
  date.toISOString().split("T")[0];

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

function Analytics() {
  const [dailyData, setDailyData] = useState<DailyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 12);

        const response = await api.get("/tracking/daily", {
          params: {
            trackingId: getTrackingId(),
            startDate: formatDate(start),
            endDate: formatDate(end),
          },
        });

        setDailyData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  /* ------------------------ LAST 30 DAYS ------------------------ */

  const dailyChart = useMemo(() => {
    return dailyData
      .slice(-30)
      .map((d) => ({
        day: new Date(d.date).getDate().toString(),
        hours: Number((d.seconds / 3600).toFixed(1)),
      }));
  }, [dailyData]);

  /* ------------------------ LAST 12 WEEKS ----------------------- */

  const weeklyChart = useMemo(() => {
    const map = new Map<string, number>();

    dailyData.forEach((d) => {
      const week = formatDate(getWeekStart(new Date(d.date)));
      map.set(week, (map.get(week) || 0) + d.seconds);
    });

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, seconds]) => ({
        week: week.substring(5),
        hours: Number((seconds / 3600).toFixed(1)),
      }));
  }, [dailyData]);

  /* ------------------------ LAST 12 MONTHS ---------------------- */

  const monthlyChart = useMemo(() => {
    const map = new Map<string, number>();

    dailyData.forEach((d) => {
      const month = d.date.substring(0, 7);
      map.set(month, (map.get(month) || 0) + d.seconds);
    });

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, seconds]) => ({
        month: new Date(month + "-01").toLocaleString("default", {
          month: "short",
        }),
        hours: Number((seconds / 3600).toFixed(1)),
      }));
  }, [dailyData]);

  const totalHours = useMemo(
    () =>
      Number(
        (
          dailyData.reduce((a, b) => a + b.seconds, 0) / 3600
        ).toFixed(1)
      ),
    [dailyData]
  );

  const averageDaily = useMemo(() => {
    if (dailyData.length === 0) return 0;

    return Number(
      (
        dailyData.reduce((a, b) => a + b.seconds, 0) /
        3600 /
        dailyData.length
      ).toFixed(1)
    );
  }, [dailyData]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center gap-3 text-xl">
        <Loader2 className="animate-spin" />
        Loading analytics...
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>FunTrack - Analytics</title>
      </Helmet>

      <div className="min-h-screen px-6 py-8 mt-30 rounded-lg bg-orange-50 text-gray-900 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mt-20 mb-8">
            <h1 className="text-4xl font-extrabold text-orange-600 dark:text-blue-400">
              Analytics
            </h1>

            <p className="mt-2 text-gray-600 dark:text-slate-400">
              Visualize your gameplay habits.
            </p>
          </div>

          {/* Stats */}

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-orange-500 dark:text-blue-400" />
                <p className="font-semibold">Total Hours Played</p>
              </div>

              <h2 className="text-4xl font-bold">
                {totalHours}h
              </h2>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 shadow">
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className="text-orange-500 dark:text-blue-400" />
                <p className="font-semibold">Average Per Day</p>
              </div>

              <h2 className="text-4xl font-bold">
                {averageDaily}h
              </h2>
            </div>
          </div>

          {/* Daily */}

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow mb-8">
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="text-orange-500 dark:text-blue-400" />
              <h2 className="text-2xl font-bold">
                Hours Played Per Day
              </h2>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="day" />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value) => [`${value} hours`, "Played"]} />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly */}

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow mb-8">
            <div className="flex items-center gap-2 mb-5">
              <CalendarRange className="text-orange-500 dark:text-blue-400" />
              <h2 className="text-2xl font-bold">
                Hours Played Per Week
              </h2>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="week" />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value) => [`${value} hours`, "Played"]} />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="#EA580C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly */}

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow">
            <div className="flex items-center gap-2 mb-5">
              <CalendarRange className="text-orange-500 dark:text-blue-400" />
              <h2 className="text-2xl font-bold">
                Hours Played Per Month
              </h2>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value) => [`${value} hours`, "Played"]} />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="#C2410C" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Analytics;