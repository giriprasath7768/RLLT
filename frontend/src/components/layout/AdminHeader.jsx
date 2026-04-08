import React, { useRef, useState } from 'react';
import { Menu } from 'primereact/menu';
import { Avatar } from 'primereact/avatar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileOverlay from './ProfileOverlay';

const AdminHeader = ({ onMenuToggle }) => {
    const menu = useRef(null);
    const navigate = useNavigate();

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileViewMode, setProfileViewMode] = useState('profile');

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
                const res = await axios.get('http://localhost:8000/api/profile/me', { withCredentials: true });
                const data = res.data;
                setUserProfile({
                    name: data.name || '',
                    email: data.email || '',
                    role: data.role || '',
                    companyName: 'Real Life Leadership Training',
                    avatarUrl: data.profile_image_url || 'https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png',
                    mobile_number: data.mobile_number || '',
                    address: data.address || ''
                });
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        };
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:8000/api/logout', {}, { withCredentials: true });
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
        <header className="sticky top-0 z-50 w-full h-16 sm:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-3 sm:px-8 shadow-sm">
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
                <span className="text-xl font-bold font-sans text-[#051220] hidden sm:block whitespace-nowrap">RLLT Web App</span>
            </div>

            {/* Center: App Name */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
                <h1 className="text-[#051220] font-bold text-xl tracking-wide whitespace-nowrap">
                    Real Life Leadership Training
                </h1>
            </div>

            {/* Right: Profile & Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-[13px] font-bold text-[#051220]">{userProfile.role}</span>
                    <span className="text-[11px] text-gray-400">{userProfile.email}</span>
                </div>

                <Menu model={menuItems} popup ref={menu} id="popup_menu" className="w-56 shadow-xl border-none rounded-xl mt-2 overflow-hidden" />

                <button
                    onClick={(e) => menu.current.toggle(e)}
                    className="flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[#cca673]/50 rounded-full p-0.5 border-2 border-transparent hover:border-[#cca673] transition-all"
                >
                    <Avatar
                        image={userProfile.avatarUrl}
                        shape="circle"
                        size="large"
                        className="bg-gray-100 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                    />
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
