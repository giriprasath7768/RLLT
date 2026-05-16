import React, { useRef, useState } from 'react';
import { Menu } from 'primereact/menu';
import { Avatar } from 'primereact/avatar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileOverlay from './ProfileOverlay';
import { useThemeContext } from '../../context/ThemeContext';

const AdminHeader = ({ onMenuToggle }) => {
    const { themeConfig } = useThemeContext();
    const menu = useRef(null);
    const navigate = useNavigate();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileViewMode, setProfileViewMode] = useState('profile');
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatDay = (date) => date.toLocaleDateString('en-US', { weekday: 'long' });

    const [userProfile, setUserProfile] = useState({
        name: 'Loading...',
        email: '',
        role: '',
        companyName: 'Real Life Leadership Training',
        avatarUrl: 'https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png',
        mobile_number: '',
        address: ''
    });

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get('http://' + window.location.hostname + ':8000/api/profile/me', { withCredentials: true });
                const data = res.data;
                setUserProfile({
                    name: data.name || '',
                    email: data.email || '',
                    role: data.role || '',
                    companyName: 'Real Life Leadership Training',
                    avatarUrl: data.profile_image_url || 'https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png',
                    mobile_number: data.mobile_number || '',
                    address: data.address || '',
                    stage: data.stage || ''
                });
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://' + window.location.hostname + ':8000/api/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            // Even if calling the backend fails, redirect for user experience
            navigate('/login');
        }
    };

    const menuItems = [
        {
            label: 'Profile Settings',
            icon: 'pi pi-cog',
            command: () => {
                setProfileViewMode('profile');
                setIsProfileOpen(true);
            }
        },
        {
            label: 'Change Password',
            icon: 'pi pi-key',
            command: () => {
                setProfileViewMode('password');
                setIsProfileOpen(true);
            }
        },
        {
            separator: true
        },
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: handleLogout,
            template: (item, options) => {
                return (
                    <button
                        onClick={(e) => options.onClick(e)}
                        className="w-full flex items-center p-3 text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <span className={`${options.iconClassName} mr-2`}></span>
                        <span className={options.labelClassName}>{item.label}</span>
                    </button>
                );
            }
        }
    ];

    return (
        <header 
            className="sticky top-0 z-50 w-full h-16 sm:h-20 border-b border-gray-100 flex items-center justify-between px-3 sm:px-8 shadow-sm transition-colors duration-300"
            style={{ backgroundColor: themeConfig?.topbarBg || '#ffffff' }}
        >
            {/* Left: Logo & Brand */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuToggle}
                    className="lg:hidden p-2 hover:bg-gray-100 focus:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    aria-label="Toggle Menu"
                >
                    <i className="pi pi-bars text-xl text-[#051220]"></i>
                </button>

                <img
                    src="/custom-logo.png"
                    alt="Logo"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover shadow-sm border border-gray-100"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png";
                    }}
                />
                <span className="text-xl font-bold font-sans hidden sm:block whitespace-nowrap" style={{ color: themeConfig?.topbarText || '#051220' }}>
                    {themeConfig?.logoText || 'RLLT Web App'}
                </span>
            </div>

            {/* Center: App Name */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
                <h1 className="font-bold text-xl tracking-wide whitespace-nowrap" style={{ color: themeConfig?.topbarText || '#051220' }}>
                    {themeConfig?.appTitle || 'Real Life Leadership Training'}
                </h1>
            </div>

            {/* Right: Profile & Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
                
                {/* Clock and Calendar (Student Only) */}
                {userProfile.role === 'student' && (
                    <div className="hidden lg:flex items-center gap-6 mr-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="text-indigo-500 p-1.5 rounded-full border border-indigo-100 bg-white shadow-sm flex items-center justify-center w-8 h-8">
                                <i className="pi pi-clock text-sm"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-gray-800 leading-none mb-1">{formatTime(currentTime)}</span>
                                <span className="text-[11px] text-gray-500 leading-none">{formatDay(currentTime)}</span>
                            </div>
                        </div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-indigo-500 p-1.5 rounded-full border border-indigo-100 bg-white shadow-sm flex items-center justify-center w-8 h-8">
                                <i className="pi pi-calendar text-sm"></i>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-gray-800 leading-none mb-1">{formatDate(currentTime)}</span>
                                <span className="text-[11px] text-gray-500 leading-none">{formatDay(currentTime)}</span>
                            </div>
                        </div>
                    </div>
                )}

                <Menu model={menuItems} popup ref={menu} id="popup_menu" className="w-56 shadow-xl border-none rounded-xl mt-2 overflow-hidden" />

                <button
                    onClick={(e) => menu.current.toggle(e)}
                    className="flex items-center gap-3 focus:outline-none focus:ring-4 focus:ring-[#cca673]/50 rounded-xl p-1.5 border-2 border-transparent hover:border-[#cca673] hover:bg-gray-50 transition-all text-left"
                >
                    <Avatar
                        image={userProfile.avatarUrl}
                        shape="circle"
                        size="large"
                        className="bg-indigo-100 text-indigo-600 font-bold shadow-md"
                    />
                    
                    <div className="flex flex-col items-start hidden sm:flex">
                        {userProfile.role === 'student' ? (
                            <>
                                <span className="text-[14px] font-bold text-gray-800 leading-none mb-1">Hello, {userProfile.name?.split(' ')[0] || 'Student'} 👋</span>
                                <span className="text-[12px] font-medium text-indigo-500 leading-none">{userProfile.stage || 'Explorer'} Stage</span>
                            </>
                        ) : (
                            <>
                                <span className="text-[13px] font-bold text-[#051220] leading-none mb-1">{userProfile.name || userProfile.role}</span>
                                <span className="text-[11px] text-gray-400 leading-none">{userProfile.email}</span>
                            </>
                        )}
                    </div>
                </button>
            </div>

            <ProfileOverlay
                visible={isProfileOpen}
                viewMode={profileViewMode}
                onHide={() => setIsProfileOpen(false)}
                initialData={userProfile}
                onSave={(newData) => setUserProfile(newData)}
            />
        </header>
    );
};

export default AdminHeader;
