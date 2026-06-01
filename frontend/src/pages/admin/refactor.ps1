$file = 'i:\RLLT\Webapp\frontend\src\pages\admin\TtoMT357Player.jsx'
$content = Get-Content $file -Raw

$newImports = "import React, { useState, useEffect } from 'react';`nimport { useNavigate } from 'react-router-dom';`nimport axios from 'axios';`n`nimport Header from '../../components/Header/Header';`nimport DayPlaylist from '../../components/Playlist/DayPlaylist';`nimport ImageViewer from '../../components/ImageViewer/ImageViewer';`nimport AudioPlayer from '../../components/AudioPlayer/AudioPlayer';`nimport Pagination from '../../components/Pagination/Pagination';`nimport TestamentPanel from '../../components/TestamentPanel/TestamentPanel';`nimport FooterActions from '../../components/Footer/FooterActions';"
$content = $content -replace "import React, { useState, useEffect } from 'react';\r?\nimport { useNavigate } from 'react-router-dom';\r?\nimport axios from 'axios';", $newImports

$newReturn = @"
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-start py-6 font-['Times_New_Roman',_Times,_serif] text-black">
            <style>{``
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            ``}</style>
            
            {/* Main Player Container */}
            <div className="w-full max-w-[600px] bg-[url('/357playerBG.png')] bg-[length:100%_100%] bg-no-repeat border-[3px] border-[#9a7638] rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.7),inset_0_-2px_10px_rgba(0,0,0,0.3)] flex flex-col relative overflow-hidden ring-4 ring-[#e5cf9f] ring-opacity-50">
                <Header facet={facet} setFacet={setFacet} phase={phase} setPhase={setPhase} />

                {/* Tracklist & Image Panel */}
                <div className="flex px-4 gap-3 mb-4 h-[220px]">
                    <DayPlaylist tracks={tracks} activeTrack={activeTrack} setActiveTrack={setActiveTrack} />
                    <ImageViewer artHours={artHours} artMins={artMins} />
                </div>

                <AudioPlayer activeTrack={activeTrack} />

                <Pagination />

                <TestamentPanel 
                    otPage={otPage} setOtPage={setOtPage} 
                    ntPage={ntPage} setNtPage={setNtPage} 
                    otTotalPages={otTotalPages} ntTotalPages={ntTotalPages} 
                    otDisplay={otDisplay} ntDisplay={ntDisplay} 
                    STANDARD_BOOKS={STANDARD_BOOKS} getBookColorConfig={getBookColorConfig} 
                    selectedBooks={selectedBooks} toggleBook={toggleBook} 
                />

                <FooterActions 
                    toggleSpecialBook={toggleSpecialBook} selectedBooks={selectedBooks} 
                    selectedDay={selectedDay} setSelectedDay={setSelectedDay} 
                    selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} 
                    handleSubmit={handleSubmit} 
                />
            </div>
        </div>
    );
};
"@

$content = $content -replace "(?s)    return \(.*?\n\};", $newReturn
Set-Content $file -Value $content -Encoding UTF8
