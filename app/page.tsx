"use client";

import { useEffect, useState } from "react";

// Types
type ItemType = "tick" | "number";

interface ChecklistItem {
    id: number;
    label: string;
    type: ItemType;
    group: string;
}

interface DailyValues {
    [dateKey: string]: {
        [itemId: number]: boolean | number;
    };
}

// Constants
const STORAGE_KEY = "ramadanChecklist.v1";
const THEME_KEY = "ramadanChecklist.theme";

const CHECKLIST_ITEMS: ChecklistItem[] = [
    { id: 1, label: "Prayed __ Salah from the 5 daily Salah", type: "number", group: "Salah" },
    { id: 2, label: "Prayed __ rak'ats of Taraweeh/Qiyam", type: "number", group: "Salah" },
    { id: 3, label: "Kept a fast", type: "tick", group: "Fasting" },
    { id: 4, label: "Prayed __ of pages/juz of Qur'an", type: "number", group: "Qur'an & Learning" },
    { id: 5, label: "Read an Islamic book", type: "tick", group: "Qur'an & Learning" },
    { id: 6, label: "Made du'a for myself, parents, teachers and the whole ummah", type: "tick", group: "Du'a & Protection" },
    { id: 7, label: "Prayed Ayatul Kursi & 3 Quls in the morning, evening & before sleeping", type: "tick", group: "Du'a & Protection" },
    { id: 8, label: "Prayed La ilaha illa-llah __ times", type: "number", group: "Dhikr" },
    { id: 9, label: "Prayed SubhanAllah, Alhamdulillah, Allahu Akbar __ times", type: "number", group: "Dhikr" },
    { id: 10, label: "Prayed Durood/Salawat upon the Prophet ﷺ __ times", type: "number", group: "Dhikr" },
    { id: 11, label: "Prayed Astaghfirullah __ times", type: "number", group: "Dhikr" },
    { id: 12, label: "Did not fight with anyone", type: "tick", group: "Character" },
    { id: 13, label: "Did not speak a lie", type: "tick", group: "Character" },
    { id: 14, label: "Watched less videos and played less games", type: "tick", group: "Character" },
    { id: 15, label: "Gave Sadaqah (money or even just a smile!)", type: "tick", group: "Charity & Family" },
    { id: 16, label: "Helped my parents", type: "tick", group: "Charity & Family" },
];

const GROUPS = [
    "Salah",
    "Fasting",
    "Qur'an & Learning",
    "Du'a & Protection",
    "Dhikr",
    "Character",
    "Charity & Family",
];

// Utility functions
function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(dateKey: string): string {
    const date = new Date(dateKey);
    return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// Toast Component
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 2000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-4 right-4 bg-green-500 dark:bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50">
            {message}
        </div>
    );
}

// Number Stepper Component
function NumberStepper({
    value,
    onChange,
}: {
    value: number;
    onChange: (val: number) => void;
}) {
    const handleDecrement = () => {
        if (value > 0) onChange(value - 1);
    };

    const handleIncrement = () => {
        onChange(value + 1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value) || 0;
        if (val >= 0) onChange(val);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Decrease"
            >
                −
            </button>
            <input
                type="number"
                value={value}
                onChange={handleInputChange}
                className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                min="0"
            />
            <button
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Increase"
            >
                +
            </button>
        </div>
    );
}

// Progress Bar Component
function ProgressBar({ completed, total }: { completed: number; total: number }) {
    const percentage = Math.round((completed / total) * 100);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Completed Today: {completed} / {total}
                </span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {percentage}%
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const [values, setValues] = useState<DailyValues>({});
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [toast, setToast] = useState<string | null>(null);
    const [todayKey, setTodayKey] = useState("");

    // Handle hydration
    useEffect(() => {
        setMounted(true);
        const key = getTodayKey();
        setTodayKey(key);

        // Load theme
        try {
            const savedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
            if (savedTheme) {
                setTheme(savedTheme);
                document.documentElement.classList.toggle("dark", savedTheme === "dark");
            }
        } catch (e) {
            console.error("Error loading theme:", e);
        }

        // Load data
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setValues(JSON.parse(saved));
            }
        } catch (e) {
            console.error("Error loading data:", e);
            showToast("Error loading data");
        }
    }, []);

    const showToast = (message: string) => {
        setToast(message);
    };

    const saveData = (newValues: DailyValues) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newValues));
            setValues(newValues);
            showToast("Saved!");
        } catch (e) {
            console.error("Error saving data:", e);
            showToast("Error saving!");
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        try {
            localStorage.setItem(THEME_KEY, newTheme);
        } catch (e) {
            console.error("Error saving theme:", e);
        }
    };

    const getValue = (itemId: number): boolean | number => {
        const item = CHECKLIST_ITEMS.find((i) => i.id === itemId);
        if (!item) return false;

        const val = values[todayKey]?.[itemId];
        if (val === undefined) {
            return item.type === "tick" ? false : 0;
        }
        return val;
    };

    const setValue = (itemId: number, value: boolean | number) => {
        const newValues = { ...values };
        if (!newValues[todayKey]) {
            newValues[todayKey] = {};
        }
        newValues[todayKey][itemId] = value;
        saveData(newValues);
    };

    const resetToday = () => {
        if (confirm("Reset all items for today?")) {
            const newValues = { ...values };
            delete newValues[todayKey];
            saveData(newValues);
            showToast("Today reset!");
        }
    };

    const resetAll = () => {
        if (confirm("Reset ALL data for all days? This cannot be undone!")) {
            saveData({});
            showToast("All data reset!");
        }
    };

    const getCompletedCount = (): number => {
        return CHECKLIST_ITEMS.filter((item) => {
            const val = getValue(item.id);
            if (item.type === "tick") {
                return val === true;
            } else {
                return typeof val === "number" && val > 0;
            }
        }).length;
    };

    const groupedItems = GROUPS.map((group) => ({
        group,
        items: CHECKLIST_ITEMS.filter((item) => item.group === group),
    }));

    // Loading skeleton
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto p-4">
                    <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const completed = getCompletedCount();

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                            Ramadan Checklist
                        </h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                aria-label="Toggle theme"
                            >
                                {theme === "light" ? "🌙" : "☀️"}
                            </button>
                            <button
                                onClick={resetToday}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium"
                            >
                                Reset Today
                            </button>
                            <button
                                onClick={resetAll}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium"
                            >
                                Reset All
                            </button>
                        </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {formatDate(todayKey)}
                    </p>

                    <ProgressBar completed={completed} total={CHECKLIST_ITEMS.length} />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    {groupedItems.map(({ group, items }) => (
                        <div
                            key={group}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg"
                        >
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3">
                                <h2 className="text-xl font-semibold text-white">{group}</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {items.map((item) => {
                                    const value = getValue(item.id);
                                    const isCompleted =
                                        item.type === "tick"
                                            ? value === true
                                            : typeof value === "number" && value > 0;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${isCompleted
                                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                                }`}
                                        >
                                            <label className="flex-1 text-gray-800 dark:text-gray-200 cursor-pointer">
                                                {item.label}
                                            </label>
                                            <div className="flex items-center">
                                                {item.type === "tick" ? (
                                                    <input
                                                        type="checkbox"
                                                        checked={value === true}
                                                        onChange={(e) => setValue(item.id, e.target.checked)}
                                                        className="w-6 h-6 rounded border-gray-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                ) : (
                                                    <NumberStepper
                                                        value={typeof value === "number" ? value : 0}
                                                        onChange={(val) => setValue(item.id, val)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Toast */}
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
