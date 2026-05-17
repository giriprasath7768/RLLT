import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar as PrimeSidebar } from 'primereact/sidebar';
import { AutoComplete } from 'primereact/autocomplete';
import axios from 'axios';
import { useThemeContext } from '../../context/ThemeContext';

const SidebarItem = ({ item, onClick, level = 0 }) => {
    const location = useLocation();

    const isItemActive = (currentItem) => {
        if (currentItem.to && (location.pathname === currentItem.to || location.pathname.startsWith(currentItem.to + '/'))) {
            return true;
        }
        if (currentItem.items) {
            return currentItem.items.some(isItemActive);
        }
        return false;
    };

    const [isOpen, setIsOpen] = useState(() => isItemActive(item));

    useEffect(() => {
        if (isItemActive(item)) {
            setIsOpen(true);
        }
    }, [location.pathname]);

    if (item.isHeader) {
        return (
            <div className="px-6 py-3 mt-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {item.label}
            </div>
        );
    }

    const paddingLeft = level === 0 ? 'pl-6' : level === 1 ? 'pl-10' : level === 2 ? 'pl-14' : 'pl-16';
    const paddingRight = 'pr-6';
    const paddingY = level === 0 ? 'py-4' : 'py-3';
    const iconSize = level === 0 ? 'text-xl' : 'text-lg';
    const textSize = level === 0 ? 'text-base' : 'text-sm';

    if (item.items) {
        return (
            <div className="flex flex-col">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between ${paddingLeft} ${paddingRight} ${paddingY} cursor-pointer transition-all duration-200 border-l-4 border-transparent hover:bg-black/20 opacity-80 hover:opacity-100`}
                    style={{ color: 'inherit' }}
                >
                    <div className="flex items-center gap-4">
                        <i className={`${item.icon} ${iconSize}`}></i>
                        <span className={`${textSize} tracking-wide`}>{item.label}</span>
                    </div>
                    <i className={`pi ${isOpen ? 'pi-chevron-down' : 'pi-chevron-right'} text-sm`}></i>
                </div>
                {isOpen && (
                    <div className="flex flex-col bg-black/10">
                        {item.items.map((subItem, idx) => (
                            <SidebarItem key={idx} item={subItem} onClick={onClick} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={item.to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-4 ${paddingLeft} ${paddingRight} ${paddingY} transition-all duration-200 border-l-4 ${isActive
                    ? 'bg-black/20 font-bold opacity-100'
                    : 'border-transparent hover:bg-black/10 opacity-80 hover:opacity-100'
                }`
            }
            style={({ isActive }) => ({ color: 'inherit', borderColor: isActive ? 'currentColor' : 'transparent' })}
        >
            <i className={`${item.icon} ${iconSize}`}></i>
            <span className={`${textSize} tracking-wide`}>{item.label}</span>
        </NavLink>
    );
};

const AdminSidebar = ({ visible, onHide }) => {
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const isSelecting = React.useRef(false);

    useEffect(() => {
        axios.get('http://' + window.location.hostname + ':8000/api/me', { withCredentials: true })
            .then(res => setUserRole(res.data.role))
            .catch(err => console.error("Failed to fetch role", err));
    }, []);

    const menuItems = [
        {
            label: 'DIGITAL',
            icon: 'pi pi-desktop',
            items: [
                { label: 'Dashboard', icon: 'pi pi-home', to: userRole === 'leader' ? '/dashboard/leader' : userRole === 'admin' ? '/dashboard/admin' : '/dashboard/super-admin' },
                ...(userRole === 'super_admin' ? [{ label: 'Manage Admin', icon: 'pi pi-shield', to: '/admin/manage-admin' }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'Manage Leaders', icon: 'pi pi-users', to: '/admin/manage-leaders' }] : []),
                { label: 'Manage Students', icon: 'pi pi-id-card', to: '/admin/manage-students' },
                {
                    label: 'Assessment',
                    icon: 'pi pi-file-edit',
                    items: [
                        { label: 'Manage Assessment', icon: 'pi pi-file-edit', to: '/admin/manage-assessment' },
                        { label: 'Assessment Results', icon: 'pi pi-chart-line', to: '/admin/assessment-results' },
                        { label: 'Assessment Summary', icon: 'pi pi-list', to: '/admin/assessment-summary' }
                    ]
                },
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{ label: 'SMT Page', icon: 'pi pi-book', to: '/admin/book-index' }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{ label: '7TNT Word', icon: 'pi pi-file-word', to: '/admin/7tnt-word' }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{
                    label: 'Classroom',
                    icon: 'pi pi-book',
                    items: [
                        { label: 'Assign Assignments', icon: 'pi pi-file-edit', to: '/admin/classroom/assignments' },
                        { label: 'Evaluate Assignments', icon: 'pi pi-check-square', to: '/admin/classroom/evaluate' },
                        { label: 'Q&A', icon: 'pi pi-question-circle', to: '/admin/classroom/qna' },
                        { label: 'Resources', icon: 'pi pi-folder-open', to: '/admin/classroom/resources' }
                    ]
                }] : []),
                {
                    label: 'Reports',
                    icon: 'pi pi-chart-bar',
                    items: [
                        { label: 'Student Report', icon: 'pi pi-file', to: '/admin/reports/student-report' },
                        { label: 'Honeycomb Report', icon: 'pi pi-th-large', to: '/admin/reports/honeycomb-report' }
                    ]
                }
            ]
        },
        {
            label: 'NON DIGITAL',
            icon: 'pi pi-file',
            items: [
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{
                    label: 'SHANAZ 357',
                    icon: 'pi pi-table',
                    to: '/admin/shanaz-357'
                }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{
                    label: 'Chart Creation',
                    icon: 'pi pi-chart-bar',
                    items: [
                        { label: 'Main Chart', icon: 'pi pi-chart-line', to: '/admin/charts' },
                        { label: '3-5-7 Chart', icon: 'pi pi-calendar-plus', to: '/admin/chart-creation/357-chart' },
                        { label: '7TNT Main Chart', icon: 'pi pi-table', to: '/admin/chart-creation/7tnt-main-chart' },
                        { label: '7TNT Day Cycle Chart', icon: 'pi pi-calendar-plus', to: '/admin/chart-creation/7tnt-day-cycle' },
                        { label: 'V-Card Chart', icon: 'pi pi-id-card', to: '/admin/chart-listing/vcard-chart' },
                        { label: '24x7 Chart', icon: 'pi pi-chart-pie', to: '/admin/twenty-four-seven-chart' }
                    ]
                }] : []),
                {
                    label: 'Chart Listing',
                    icon: 'pi pi-list',
                    items: [
                        { label: 'Main Chart', icon: 'pi pi-eye', to: '/admin/chart-listing/main-chart' },
                        { label: '3-5-7 Chart', icon: 'pi pi-calendar-plus', to: '/admin/chart-listing/357-chart' },
                        { label: '7TNT Main Chart', icon: 'pi pi-table', to: '/admin/chart-listing/7tnt-main-chart' },
                        { label: '7TNT Day Cycle Chart', icon: 'pi pi-table', to: '/admin/chart-listing/7tnt-day-cycle' },
                        { label: '7TNT Weekly Chart', icon: 'pi pi-calendar', to: '/admin/chart-listing/7tnt-weekly-chart' },
                        { label: 'Morning & Evening', icon: 'pi pi-calendar-plus', to: '/admin/chart-listing/morning-evening-chart' },
                        { label: 'DL Size Chart', icon: 'pi pi-table', to: '/admin/chart-listing/dl-size-chart' },
                        { label: 'C-Chart Index', icon: 'pi pi-chart-pie', to: '/admin/chart-listing/c-chart' },
                        { label: 'Oil Chart', icon: 'pi pi-calendar', to: '/admin/chart-listing/oil-chart' },
                        { label: 'Weekly Chart', icon: 'pi pi-calendar', to: '/admin/chart-listing/weekly-chart' },
                        { label: '24x7 Chart', icon: 'pi pi-chart-pie', to: '/admin/chart-listing/twenty-four-seven-chart' },
                        { label: '24x7 Morning/Evening', icon: 'pi pi-calendar-plus', to: '/admin/chart-listing/twenty-four-seven-morning-evening-chart' },
                        { label: '24x7 DL Size Chart', icon: 'pi pi-table', to: '/admin/chart-listing/twenty-four-seven-dl-size-chart' },
                        { label: 'Light Chart', icon: 'pi pi-sun', to: '/admin/chart-listing/light-chart' }
                    ]
                }
            ]
        },
        {
            label: 'AUDIO',
            icon: 'pi pi-volume-up',
            items: [
                ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'T-Tom-T Registered Users', icon: 'pi pi-user-plus', to: '/admin/ttom-users' }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{ label: '7 TNT Players', icon: 'pi pi-play', to: '/admin/7tnt-players' }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [{ label: 'Players', icon: 'pi pi-play', to: '/admin/players' }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'Recordings', icon: 'pi pi-microphone', to: '/admin/recordings' }] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' ? [{ label: 'Screen Recorder', icon: 'pi pi-desktop', to: '/admin/screen-recorder' }] : [])
            ]
        },
        {
            label: 'LIBRARY',
            icon: 'pi pi-folder-open',
            items: [
                ...(userRole === 'super_admin' || userRole === 'admin' || userRole === 'leader' ? [
                    { label: 'Book Master', icon: 'pi pi-book', to: '/admin/books' },
                    { label: 'Chapter Master', icon: 'pi pi-bookmark', to: '/admin/chapters' },
                    { label: 'RLLT Table Data', icon: 'pi pi-table', to: '/admin/rllt-data' },
                    { label: 'Image', icon: 'pi pi-image', to: '/admin/image-gallery' }
                ] : []),
                ...(userRole === 'super_admin' || userRole === 'admin' ? [
                    { label: 'Manage Training Contents', icon: 'pi pi-video', to: '/admin/manage-training' },
                    { label: '7 TNT Content management', icon: 'pi pi-server', to: '/admin/7tnt-content' }
                ] : []),
                ...(userRole === 'super_admin' ? [
                    { label: 'Locations', icon: 'pi pi-map-marker', to: '/admin/locations' }
                ] : [])
            ]
        },
        ...(userRole === 'super_admin' || userRole === 'admin' ? [{
            label: 'SYSTEM SETTINGS',
            icon: 'pi pi-cog',
            to: '/admin/settings'
        }] : [])
    ];

    const { themeConfig } = useThemeContext();

    const flattenMenu = (items, parentLabel = '') => {
        let flat = [];
        items.forEach(item => {
            if (item.to) {
                flat.push({ 
                    label: parentLabel ? `${item.label} (${parentLabel})` : item.label, 
                    to: item.to 
                });
            }
            if (item.items) {
                flat = flat.concat(flattenMenu(item.items, item.label));
            }
        });
        return flat;
    };

    const flatMenu = flattenMenu(menuItems);

    const searchMenu = (event) => {
        const query = event.query.toLowerCase();
        const results = flatMenu.filter(item => item.label.toLowerCase().includes(query));
        setFilteredItems(results);
    };

    const renderSidebarContent = (onItemClick) => {
        const handleSearchSelect = (e) => {
            isSelecting.current = true;
            if (e.value && e.value.to) {
                navigate(e.value.to);
                setSearchQuery('');
                if (onItemClick) onItemClick();
            }
            setTimeout(() => {
                isSelecting.current = false;
            }, 100);
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                setTimeout(() => {
                    if (isSelecting.current) return;
                    
                    const queryStr = typeof searchQuery === 'string' ? searchQuery : (searchQuery?.label || '');
                    if (queryStr) {
                        const exactMatch = flatMenu.find(item => item.label.toLowerCase() === queryStr.toLowerCase());
                        if (exactMatch) {
                            navigate(exactMatch.to);
                            setSearchQuery('');
                            if (onItemClick) onItemClick();
                        } else if (filteredItems.length > 0) {
                            navigate(filteredItems[0].to);
                            setSearchQuery('');
                            if (onItemClick) onItemClick();
                        }
                    }
                }, 50);
            }
        };

        return (
            <div className="flex flex-col py-4 min-h-full" style={{ backgroundColor: themeConfig?.sidebarBg || '#1F2937', color: themeConfig?.sidebarText || '#D1D5DB' }}>
                <div className="px-6 mb-4">
                    <AutoComplete 
                        value={searchQuery} 
                        suggestions={filteredItems} 
                        completeMethod={searchMenu} 
                        field="label" 
                        onChange={(e) => setSearchQuery(e.value)} 
                        onSelect={handleSearchSelect}
                        onKeyDown={handleKeyDown}
                        placeholder="Search menu..." 
                        className="w-full"
                        inputClassName="w-full bg-black/20 border-gray-600 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                        panelClassName="bg-gray-800 text-white border border-gray-600 shadow-lg"
                    />
                </div>
                {menuItems.map((item, index) => (
                    <SidebarItem key={index} item={item} onClick={onItemClick} />
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Desktop Sidebar Wrapper */}
            <div className="hidden lg:block w-72 flex-grow border-r transition-colors duration-300"
                 style={{ backgroundColor: themeConfig?.sidebarBg || '#1F2937', borderColor: themeConfig?.sidebarBg || '#1F2937' }}>
                {/* Sticky Content inside wrapper */}
                <aside className="w-full sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
                    {renderSidebarContent()}
                </aside>
            </div>

            {/* Mobile Sidebar (Drawer) */}
            <PrimeSidebar
                visible={visible}
                onHide={onHide}
                className="w-full sm:w-80 p-0 transition-colors duration-300"
                style={{ backgroundColor: themeConfig?.sidebarBg || '#1F2937' }}
                icons={(
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-700 w-full mb-4">
                        <img src="/custom-logo.png" alt="Logo" className="h-8 w-8 rounded-full border border-gray-300 object-cover shadow-sm" />
                        <span className="text-white font-bold text-sm tracking-widest uppercase">Menu</span>
                    </div>
                )}
            >
                <div className="h-full">
                    {renderSidebarContent(onHide)}
                </div>
            </PrimeSidebar>
        </>
    );
};

export default AdminSidebar;
