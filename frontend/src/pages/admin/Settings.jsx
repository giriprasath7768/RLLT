import React, { useState } from 'react';
import { useThemeContext } from '../../context/ThemeContext';

const Settings = () => {
    const allScreens = [
        'Dashboard', 'Manage Admin', 'Manage Leaders', 'Manage Students', 
        'Manage Assessment', 'Assessment Results', 'Assessment Summary',
        'Assign Assignments', 'Evaluate Assignments', 'Q&A', 'Resources',
        '7TNT Word', 'Book Master', 'Chapter Master', 'RLLT Table Data', 'Image',
        'SMT Page', 'Recordings', 'Screen Recorder', 'Manage Training Contents',
        '7 TNT Content management', 'Locations', 'SHANAZ 357', 
        'Chart Creation - Main Chart', 'Chart Creation - 3-5-7 Chart', 
        'Chart Creation - 7TNT Main Chart', 'Chart Creation - 7TNT Day Cycle Chart', 
        'Chart Creation - V-Card Chart', 'Chart Creation - 24x7 Chart',
        'Chart Listing - Main Chart', 'Chart Listing - 7TNT Main Chart', 
        'Chart Listing - 7TNT Day Cycle Chart', 'Chart Listing - 7TNT Weekly Chart', 
        'Chart Listing - Morning & Evening', 'Chart Listing - DL Size Chart', 
        'Chart Listing - C-Chart Index', 'Chart Listing - Oil Chart', 
        'Chart Listing - Weekly Chart', 'Chart Listing - 24x7 Chart', 
        'Chart Listing - 24x7 Morning/Evening', 'Chart Listing - 24x7 DL Size Chart', 
        'Chart Listing - Light Chart', 'Student Report', 'T-Tom-T Registered Users', 
        '7 TNT Players', 'Players', 'System Settings'
    ];

    const [activeTab, setActiveTab] = useState('application');
    const { themeConfig, updateTheme, applyPreset, themePresets, resetTheme } = useThemeContext();
    const [selectedRole, setSelectedRole] = useState('Super Admin');
    const [selectedScreens, setSelectedScreens] = useState(allScreens);
    
    // Notifications state
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveApplication = (e) => {
        e.preventDefault();
        showNotification('Application settings saved successfully.');
    };

    const handleSaveTheme = (e) => {
        e.preventDefault();
        showNotification('Theme changes are applied immediately globally.');
    };

    const handleSavePermissions = (e) => {
        e.preventDefault();
        showNotification('Role permissions saved successfully.');
    };

    const renderApplicationCustomization = () => (
        <form onSubmit={handleSaveApplication} className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Application Customization</h3>
                <p className="text-sm text-gray-500 mb-6">Update the application title and logo to personalize your experience.</p>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Title (Top Bar)</label>
                    <input 
                        type="text" 
                        value={themeConfig.appTitle || ''}
                        onChange={(e) => updateTheme({ appTitle: e.target.value })}
                        className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo Text</label>
                    <input 
                        type="text" 
                        value={themeConfig.logoText || ''}
                        onChange={(e) => updateTheme({ logoText: e.target.value })}
                        className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                        required
                    />
                </div>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Logo</label>
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                            <i className="pi pi-image text-gray-400 text-3xl"></i>
                        </div>
                        <div>
                            <input type="file" accept=".png, .jpg, .jpeg" className="hidden" id="logo-upload" />
                            <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                Choose File
                            </label>
                            <p className="text-xs text-gray-500 mt-2">Accepts .png, .jpg, .jpeg (Max 2MB)</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end border-t border-gray-100 pt-6">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Save Changes
                </button>
            </div>
        </form>
    );

    const renderRoleManagement = () => (
        <form onSubmit={handleSavePermissions} className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Role and Permission Management</h3>
                <p className="text-sm text-gray-500 mb-6">Define and manage roles and their associated permissions within the application.</p>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                    <select 
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="Super Admin">Super Admin</option>
                        <option value="Admin">Admin</option>
                        <option value="Leader">Leader</option>
                        <option value="Student">Student</option>
                    </select>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 max-h-96 overflow-y-auto">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Select Visible Menus for {selectedRole}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allScreens.map(screen => (
                            <label key={screen} className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                                    checked={selectedScreens.includes(screen)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedScreens([...selectedScreens, screen]);
                                        } else {
                                            setSelectedScreens(selectedScreens.filter(s => s !== screen));
                                        }
                                    }}
                                />
                                <span className="text-sm font-medium text-gray-700">{screen}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end border-t border-gray-100 pt-6">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Save Permissions
                </button>
            </div>
        </form>
    );

    const renderThemeCustomization = () => (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Theme Customization</h3>
                    <p className="text-sm text-gray-500 mt-1">Configure global appearance using the dynamic theme engine.</p>
                </div>
                <button type="button" onClick={resetTheme} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                    Reset to Default
                </button>
            </div>

            {/* Presets */}
            <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Presets</h4>
                <div className="flex flex-wrap gap-4">
                    {Object.keys(themePresets).map(preset => (
                        <button
                            key={preset}
                            onClick={() => applyPreset(preset)}
                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${themeConfig.preset === preset ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400 text-gray-700 bg-white'}`}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Global Colors */}
            <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Global Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={themeConfig.primaryColor} onChange={e => updateTheme({ primaryColor: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                            <span className="text-sm text-gray-600 uppercase">{themeConfig.primaryColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={themeConfig.secondaryColor} onChange={e => updateTheme({ secondaryColor: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                            <span className="text-sm text-gray-600 uppercase">{themeConfig.secondaryColor}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Color Mode</label>
                        <select value={themeConfig.mode} onChange={e => updateTheme({ mode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Typography & Layout */}
            <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Typography & Layout</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                        <select value={themeConfig.fontFamily} onChange={e => updateTheme({ fontFamily: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="Roboto, sans-serif">Roboto</option>
                            <option value="Poppins, sans-serif">Poppins</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Font Size (px)</label>
                        <input type="number" value={themeConfig.fontSize} onChange={e => updateTheme({ fontSize: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius (px)</label>
                        <input type="number" value={themeConfig.borderRadius} onChange={e => updateTheme({ borderRadius: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div className="col-span-full">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={themeConfig.compactMode} onChange={e => updateTheme({ compactMode: e.target.checked })} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                            <span className="text-sm font-medium text-gray-700">Compact Mode (Reduces padding and text size)</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Sidebar & Topbar */}
            <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Navigation Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar BG</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={themeConfig.sidebarBg} onChange={e => updateTheme({ sidebarBg: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Text</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={themeConfig.sidebarText} onChange={e => updateTheme({ sidebarText: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Topbar BG</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={themeConfig.topbarBg} onChange={e => updateTheme({ topbarBg: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Topbar Text</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={themeConfig.topbarText} onChange={e => updateTheme({ topbarText: e.target.value })} className="w-10 h-10 rounded border border-gray-300 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDetailedPermissions = () => {
        return (
            <form onSubmit={handleSavePermissions} className="space-y-6 animate-fadeIn">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Access and Permissions</h3>
                        <button type="button" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">Reset to Defaults</button>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Allow detailed control over what actions each role can perform on individual screens.</p>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Configuring for Role:</label>
                        <select 
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="Super Admin">Super Admin</option>
                            <option value="Admin">Admin</option>
                            <option value="Leader">Leader</option>
                            <option value="Student">Student</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 font-semibold text-gray-700 text-sm">Screen / Module</th>
                                    <th className="p-4 font-semibold text-gray-700 text-sm text-center">View</th>
                                    <th className="p-4 font-semibold text-gray-700 text-sm text-center">Add</th>
                                    <th className="p-4 font-semibold text-gray-700 text-sm text-center">Edit</th>
                                    <th className="p-4 font-semibold text-gray-700 text-sm text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedScreens.map((screen, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-800">{screen}</td>
                                        {['View', 'Add', 'Edit', 'Delete'].map(action => (
                                            <td key={action} className="p-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    defaultChecked={true}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end border-t border-gray-100 pt-6">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Save Configurations
                    </button>
                </div>
            </form>
        );
    };

    const tabs = [
        { id: 'application', label: 'Application Customization', icon: 'pi pi-desktop' },
        { id: 'role', label: 'Role Management', icon: 'pi pi-users' },
        { id: 'permissions', label: 'Access and Permissions', icon: 'pi pi-lock' },
        { id: 'theme', label: 'Theme Customization', icon: 'pi pi-palette' }
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto bg-gray-50/50 min-h-screen">
            {notification && (
                <div className={`fixed top-24 right-10 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slideIn ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    <i className={`pi ${notification.type === 'success' ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'} text-xl`}></i>
                    <span className="font-medium text-sm">{notification.message}</span>
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#051220] tracking-tight mb-2">Settings</h1>
                <p className="text-gray-500">Manage application preferences, roles, permissions, and visual appearance.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:w-1/4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 overflow-hidden sticky top-24">
                        <nav className="flex flex-col space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                        activeTab === tab.id 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <i className={`${tab.icon} ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} text-lg`}></i>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:w-3/4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
                        {activeTab === 'application' && renderApplicationCustomization()}
                        {activeTab === 'role' && renderRoleManagement()}
                        {activeTab === 'theme' && renderThemeCustomization()}
                        {activeTab === 'permissions' && renderDetailedPermissions()}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-in-out;
                }
                .animate-slideIn {
                    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default Settings;
