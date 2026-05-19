import React from "react";
import {
    BookOpen,
    FileText,
    Crown,
    Clock3,
    CalendarDays,
    RotateCcw,
    Check,
    Printer,
    Eye,
    Send,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const books = [
    ["GEN", "EXO", "LEV", "NUM", "DEU"],
    ["JOS", "JDG", "RUT", "1SA", "2SA"],
    ["1KI", "2KI", "1CH", "2CH", "EZR"],
];

export default function ShanazDashboard() {
    return (
        <div className="min-h-screen bg-[#f6efe2] flex justify-center items-center p-6">
            <div className="w-full max-w-[430px] bg-[#f7f1e6] border-[4px] border-[#c7a96b] rounded-[32px] shadow-2xl overflow-hidden relative">

                {/* HEADER */}
                <div className="px-5 pt-5 pb-4">
                    <div className="text-center">
                        <p className="text-[12px] tracking-wide text-[#8a6d4f] italic">
                            Unlocking Transformation Through
                        </p>

                        <div className="flex items-center justify-center gap-3 mt-2">
                            <div className="h-[1px] bg-[#c8aa72] flex-1" />
                            <p className="text-[#7d5f3b] text-[14px] tracking-[4px] font-semibold">
                                THE WORD
                            </p>
                            <div className="h-[1px] bg-[#c8aa72] flex-1" />
                        </div>

                        <h1 className="mt-4 text-[56px] leading-none font-black tracking-wide text-[#082d64] drop-shadow-md">
                            SHANAZ 357
                        </h1>

                        <div className="flex items-center justify-center gap-3 mt-4">
                            <div className="w-24 h-[2px] bg-[#d1b072]" />
                            <div className="text-[#caa256] text-xl">✦</div>
                            <div className="w-24 h-[2px] bg-[#d1b072]" />
                        </div>
                    </div>
                </div>

                {/* STATS */}
                <div className="mx-4 bg-[#f9f5ec] border-2 border-[#c9aa73] rounded-[24px] shadow-md px-2 py-4">
                    <div className="grid grid-cols-5 divide-x divide-[#d9c8a8]">
                        <StatCard
                            icon={<BookOpen className="w-7 h-7 text-[#1d5ca8]" />}
                            title="BKS"
                            value="0"
                            color="text-[#1d5ca8]"
                        />

                        <StatCard
                            icon={<FileText className="w-7 h-7 text-[#5f7e2b]" />}
                            title="CHP"
                            value="0"
                            color="text-[#5f7e2b]"
                        />

                        <StatCard
                            icon={<Crown className="w-7 h-7 text-[#c4972f]" />}
                            title="VRS"
                            value="0"
                            color="text-[#c4972f]"
                        />

                        <StatCard
                            icon={<Clock3 className="w-7 h-7 text-[#6d2d8f]" />}
                            title="ART"
                            value="0:00H"
                            color="text-[#6d2d8f]"
                        />

                        <StatCard
                            icon={<CalendarDays className="w-7 h-7 text-[#b13d34]" />}
                            title="DAYS"
                            value="75"
                            color="text-[#b13d34]"
                        />
                    </div>
                </div>

                {/* OLD TESTAMENT */}
                <div className="mx-4 mt-5 border-2 border-[#c7a96b] rounded-[24px] overflow-hidden bg-[#f7f1e6] shadow-md">
                    {/* TITLE */}
                    <div className="bg-gradient-to-b from-[#0b3c78] to-[#062854] text-white py-4 px-4 text-center relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d8b56f]">
                            ✦
                        </div>

                        <h2 className="text-[34px] font-bold tracking-wide text-[#e8ca83]">
                            OLD TESTAMENT
                        </h2>

                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d8b56f]">
                            ✦
                        </div>
                    </div>

                    {/* BOOK BUTTONS */}
                    <div className="p-4 space-y-3">
                        {books.map((row, rowIndex) => (
                            <div key={rowIndex} className="grid grid-cols-5 gap-3">
                                {row.map((book) => (
                                    <button
                                        key={book}
                                        className="h-[52px] rounded-xl border border-[#dbc8a2] bg-[#faf6ee] text-[#9d2e2f] text-[22px] font-semibold shadow-sm hover:scale-[1.02] transition"
                                    >
                                        {book}
                                    </button>
                                ))}
                            </div>
                        ))}

                        {/* FOOTER CONTROLS */}
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="border-2 border-[#7f9665] rounded-xl p-3 text-center text-[#2f5f2d] bg-[#f8f6ed]">
                                <p className="text-[14px] font-semibold">PSALMS</p>
                                <p className="text-[14px] font-semibold">CHP 119</p>
                            </div>

                            <div className="border border-[#d9c7a4] rounded-xl flex items-center justify-center divide-x divide-[#d9c7a4] overflow-hidden bg-white">
                                <div className="flex-1 py-5 text-center text-[#2d4260] font-semibold">
                                    3 DAYS
                                </div>
                                <div className="flex-1 py-5 text-center text-[#7a6d58] font-semibold">
                                    5 DAYS
                                </div>
                                <div className="flex-1 py-5 text-center text-[#7a6d58] font-semibold">
                                    7 DAYS
                                </div>
                            </div>

                            <div className="border-2 border-[#7f9665] rounded-xl p-3 text-center text-[#2f5f2d] bg-[#f8f6ed]">
                                <p className="text-[14px] font-semibold">PSA OF DAVID</p>
                                <p className="text-[14px] font-semibold">75 CHP</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DATE SECTION */}
                <div className="mx-4 mt-5 border-2 border-[#c7a96b] rounded-[24px] p-4 bg-[#f7f1e6] shadow-md">
                    <div className="flex items-center justify-center gap-10">
                        <CircleButton
                            icon={<RotateCcw className="w-5 h-5" />}
                            color="text-[#b53f36]"
                        />

                        <div className="w-[70px] h-[70px] rounded-full border border-[#dbcaa6] bg-[#f8f5ee] flex items-center justify-center text-[#8f7c61] text-sm font-semibold shadow-inner">
                            DATE
                        </div>

                        <CircleButton
                            icon={<Check className="w-5 h-5" />}
                            color="text-[#4d7c37]"
                        />
                    </div>

                    <div className="mt-5 grid grid-cols-10 border border-[#dbc8a3] rounded-xl overflow-hidden bg-[#faf6ef]">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                            <div
                                key={n}
                                className="py-3 text-center text-[#0b3b75] text-[24px] font-bold border-r border-[#e1d2b5] last:border-r-0"
                            >
                                {n}
                            </div>
                        ))}
                    </div>
                </div>

                {/* BOTTOM CONTROLS */}
                <div className="mx-4 mt-5 border-2 border-[#c7a96b] rounded-[24px] p-4 bg-[#f7f1e6] shadow-md">
                    {/* INPUT ROW */}
                    <div className="grid grid-cols-3 gap-3 items-center">
                        <div className="h-[56px] rounded-xl border border-[#d7c6a3] bg-white" />

                        <div className="flex items-center justify-center gap-4">
                            <span className="text-3xl text-[#9a7c4d]">−</span>

                            <div className="w-[90px] h-[70px] rounded-2xl border-2 border-[#d4b06d] bg-[#f9f4e6] flex flex-col items-center justify-center shadow">
                                <p className="text-[#9d7b42] font-bold">MDL.</p>
                                <p className="text-[#b6801d] text-4xl font-black leading-none">
                                    5
                                </p>
                            </div>

                            <span className="text-3xl text-[#9a7c4d]">+</span>
                        </div>

                        <div className="h-[56px] rounded-xl border border-[#d7c6a3] bg-white" />
                    </div>

                    {/* PAGE DETAILS */}
                    <div className="mt-4 grid grid-cols-3 border-2 border-[#7d9564] rounded-2xl overflow-hidden">
                        <InfoBox title="PAGES" value="1" />
                        <InfoBox title="PHS." value="1" />
                        <InfoBox title="EACH PHS." value="75 DAYS" />
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <ActionButton
                            icon={<Printer className="w-5 h-5" />}
                            label="PRINT"
                            color="text-[#233f75]"
                        />

                        <ActionButton
                            icon={<Eye className="w-5 h-5" />}
                            label="VIEW"
                            color="text-[#426b32]"
                        />

                        <ActionButton
                            icon={<Send className="w-5 h-5" />}
                            label="SEND"
                            color="text-[#6d2d8f]"
                        />
                    </div>
                </div>

                {/* FOOTER IMAGE */}
                <div className="relative mx-4 mt-5 mb-4 rounded-[22px] overflow-hidden border-2 border-[#c7a96b]">
                    <img
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop"
                        alt="mountain"
                        className="h-[130px] w-full object-cover"
                    />

                    {/* GOLDEN RATIO OVERLAY */}
                    <div className="absolute right-0 top-0 h-full w-[45%] border border-[#d5b36d] rounded-full opacity-60" />

                    {/* PILLARS */}
                    <div className="absolute left-3 bottom-0 w-[28px] h-[100px] bg-gradient-to-b from-[#f6d588] to-[#9d6a1f] rounded-t-lg shadow-xl" />
                    <div className="absolute right-3 bottom-0 w-[28px] h-[100px] bg-gradient-to-b from-[#f6d588] to-[#9d6a1f] rounded-t-lg shadow-xl" />
                </div>
            </div>
        </div>
    );
}

/* ---------------- COMPONENTS ---------------- */

function StatCard({ icon, title, value, color }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <p className="text-[18px] font-bold text-[#333]">{title}</p>

            <div>{icon}</div>

            <p className={`text-[22px] font-black ${color}`}>{value}</p>
        </div>
    );
}

function CircleButton({ icon, color }) {
    return (
        <button
            className={`w-[70px] h-[70px] rounded-full border-2 border-[#dbc8a5] bg-[#faf7ef] shadow-md flex items-center justify-center ${color}`}
        >
            {icon}
        </button>
    );
}

function InfoBox({ title, value }) {
    return (
        <div className="py-3 text-center bg-[#f8f6ee] border-r border-[#adc08f] last:border-r-0">
            <p className="text-[#2f5f2d] font-bold text-[14px]">{title}</p>

            <div className="flex items-center justify-center gap-2 mt-1">
                <ChevronLeft className="w-4 h-4 text-[#7d7d7d]" />

                <p className="text-[#2f5f2d] text-[32px] font-black leading-none">
                    {value}
                </p>

                <ChevronRight className="w-4 h-4 text-[#7d7d7d]" />
            </div>
        </div>
    );
}

function ActionButton({ icon, label, color }) {
    return (
        <button className="h-[62px] rounded-2xl border-2 border-[#3d3d3d] bg-[#fbf8f1] shadow hover:scale-[1.02] transition flex items-center justify-center gap-3">
            <span className={color}>{icon}</span>

            <span className={`font-bold text-[22px] ${color}`}>{label}</span>
        </button>
    );
}