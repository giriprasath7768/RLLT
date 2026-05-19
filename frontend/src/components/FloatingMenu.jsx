import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../context/ThemeContext';

const screenPaths = {
    'Dashboard': '/dashboard/admin',
    'Manage Admin': '/admin/manage-admin',
    'Manage Leaders': '/admin/manage-leaders',
    'Manage Students': '/admin/manage-students',
    'Manage Assessment': '/admin/manage-assessment',
    'Assessment Results': '/admin/assessment-results',
    'Assessment Summary': '/admin/assessment-summary',
    'Assign Assignments': '/admin/classroom/assignments',
    'Evaluate Assignments': '/admin/classroom/evaluate',
    'Q&A': '/admin/classroom/qna',
    'Resources': '/admin/classroom/resources',
    '7TNT Word': '/admin/7tnt-word',
    'Book Master': '/admin/books',
    'Chapter Master': '/admin/chapters',
    'RLLT Table Data': '/admin/rllt-data',
    'Image': '/admin/image-gallery',
    'SMT Page': '/admin/book-index',
    'Recordings': '/admin/recordings',
    'Screen Recorder': '/admin/screen-recorder',
    'Manage Training Contents': '/admin/manage-training',
    '7 TNT Content management': '/admin/7tnt-content',
    'Locations': '/admin/locations',
    'SHANAZ 357': '/admin/shanaz-357',
    'Chart Creation - Main Chart': '/admin/charts',
    'Chart Creation - 3-5-7 Chart': '/admin/chart-creation/357-chart',
    'Chart Creation - 7TNT Main Chart': '/admin/chart-creation/7tnt-main-chart',
    'Chart Creation - 7TNT Day Cycle Chart': '/admin/chart-creation/7tnt-day-cycle',
    'Chart Creation - V-Card Chart': '/admin/chart-listing/vcard-chart',
    'Chart Creation - 24x7 Chart': '/admin/twenty-four-seven-chart',
    'Chart Listing - Main Chart': '/admin/chart-listing/main-chart',
    'Chart Listing - 3-5-7 Chart': '/admin/chart-listing/357-chart',
    'Chart Listing - 7TNT Main Chart': '/admin/chart-listing/7tnt-main-chart',
    'Chart Listing - 7TNT Day Cycle Chart': '/admin/chart-listing/7tnt-day-cycle',
    'Chart Listing - 7TNT Weekly Chart': '/admin/chart-listing/7tnt-weekly-chart',
    'Chart Listing - Morning & Evening': '/admin/chart-listing/morning-evening-chart',
    'Chart Listing - DL Size Chart': '/admin/chart-listing/dl-size-chart',
    'Chart Listing - C-Chart Index': '/admin/chart-listing/c-chart',
    'Chart Listing - Oil Chart': '/admin/chart-listing/oil-chart',
    'Chart Listing - Weekly Chart': '/admin/chart-listing/weekly-chart',
    'Chart Listing - 24x7 Chart': '/admin/chart-listing/twenty-four-seven-chart',
    'Chart Listing - 24x7 Morning/Evening': '/admin/chart-listing/twenty-four-seven-morning-evening-chart',
    'Chart Listing - 24x7 DL Size Chart': '/admin/chart-listing/twenty-four-seven-dl-size-chart',
    'Chart Listing - Light Chart': '/admin/chart-listing/light-chart',
    'Student Report': '/admin/reports/student-report',
    'Honeycomb Report': '/admin/reports/honeycomb-report',
    'Light Digital Chart': '/admin/light-chart-digital',
    'T-Tom-T Registered Users': '/admin/ttom-users',
    '7 TNT Players': '/admin/7tnt-players',
    'Players': '/admin/players',
    'System Settings': '/admin/settings'
};

const getIconForScreen = (screenName) => {
    const lower = screenName.toLowerCase();
    if (lower.includes('dashboard')) return 'pi-objects-column';
    if (lower.includes('admin') || lower.includes('leader')) return 'pi-users';
    if (lower.includes('student') || lower.includes('player')) return 'pi-user';
    if (lower.includes('chart')) return 'pi-chart-line';
    if (lower.includes('book') || lower.includes('chapter') || lower.includes('word')) return 'pi-book';
    if (lower.includes('record')) return 'pi-video';
    if (lower.includes('setting')) return 'pi-cog';
    if (lower.includes('assignment')) return 'pi-clipboard';
    if (lower.includes('result') || lower.includes('summary') || lower.includes('report')) return 'pi-list';
    if (lower.includes('image')) return 'pi-image';
    if (lower.includes('location')) return 'pi-map-marker';
    return 'pi-star'; // default generic icon
};

const FloatingMenu = () => {
    const { themeConfig } = useThemeContext();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    
    // Position state for drag, default to bottom-right corner
    const [position, setPosition] = useState({ 
        x: window.innerWidth ? window.innerWidth - 60 : 300, 
        y: window.innerHeight ? window.innerHeight - 60 : 600 
    });
    
    const isDragging = useRef(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const buttonStartPos = useRef({ x: 0, y: 0 });
    // Flag to detect actual drag vs click
    const hasDragged = useRef(false);

    useEffect(() => {
        // Handle window resize to keep FAB inside screen
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 30),
                y: Math.min(prev.y, window.innerHeight - 30)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePointerDown = (e) => {
        isDragging.current = true;
        hasDragged.current = false;
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        buttonStartPos.current = { x: position.x, y: position.y };
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            hasDragged.current = true;
        }

        setPosition({
            x: buttonStartPos.current.x + dx,
            y: buttonStartPos.current.y + dy
        });
    };

    const handlePointerUp = (e) => {
        isDragging.current = false;
        e.target.releasePointerCapture(e.pointerId);
        
        if (!hasDragged.current) {
            setIsOpen(!isOpen);
        }
    };

    const shortcuts = themeConfig.floatingMenuItems || [];
    if (shortcuts.length === 0) return null;

    // Determine positioning based on screen quadrant so the menu always opens inward
    const isLeft = position.x < window.innerWidth / 2;
    const isTop = position.y < window.innerHeight / 2;

    const horizontalPosClass = isLeft ? "left-[-28px]" : "right-[-28px]";
    const verticalPosClass = isTop ? "top-[40px]" : "bottom-[40px]";
    const transformOrigin = `${isLeft ? 'left' : 'right'} ${isTop ? 'top' : 'bottom'}`;

    return (
        <div 
            style={{ 
                position: 'fixed', 
                left: position.x, 
                top: position.y, 
                zIndex: 99999,
                touchAction: 'none',
                width: 0,
                height: 0
            }}
            className="flex items-center justify-center"
        >
            {/* The Vertical Menu Card */}
            <div 
                className={`absolute ${verticalPosClass} ${horizontalPosClass} bg-blue-600 rounded-2xl shadow-2xl transition-all duration-300 ease-out flex flex-col py-2 w-56`}
                style={{ 
                    opacity: isOpen ? 1 : 0,
                    transform: `scale(${isOpen ? 1 : 0.8}) translateY(${isOpen ? '0px' : (isTop ? '-20px' : '20px')})`,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transformOrigin: transformOrigin
                }}
            >
                <div className="max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {shortcuts.map((screen) => (
                        <div 
                            key={screen}
                            className="flex items-center gap-4 px-5 py-3 text-white cursor-pointer hover:bg-blue-700 transition-colors"
                            onClick={() => {
                                setIsOpen(false);
                                if(screenPaths[screen]) navigate(screenPaths[screen]);
                            }}
                        >
                            <i className={`pi ${getIconForScreen(screen)} text-lg w-6 text-center opacity-90`}></i>
                            <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{screen}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* The Draggable FAB */}
            <button
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`absolute w-14 h-14 rounded-full shadow-2xl active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 ${isOpen ? 'bg-white text-blue-600 border-white' : 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'}`}
                style={{ left: '0px', top: '0px', transform: 'translate(-50%, -50%)', userSelect: 'none' }}
                title="Drag to move, click to open favorites"
            >
                <i className={`pi ${isOpen ? 'pi-times' : 'pi-bars'} text-2xl pointer-events-none transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}></i>
            </button>
        </div>
    );
};

export default FloatingMenu;
