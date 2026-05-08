import React, { useState } from 'react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('application');
    const [appTitle, setAppTitle] = useState('Anti-Gravity Application');
    const [theme, setTheme] = useState('Light');
    const [selectedRole, setSelectedRole] = useState('Super Admin');
    
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
        showNotification('Theme updated successfully.');
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Application Title</label>
                    <input 
                        type="text" 
                        value={appTitle}
                        onChange={(e) => setAppTitle(e.target.value)}
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

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <h4 className="text-md font-bold text-gray-800 mb-4">Global Permissions for {selectedRole}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Add', 'Edit', 'Delete', 'View'].map(perm => (
                            <label key={perm} className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" defaultChecked={selectedRole === 'Super Admin' || selectedRole === 'Admin'} />
                                <span className="text-sm font-medium text-gray-700">{perm}</span>
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
        <form onSubmit={handleSaveTheme} className="space-y-6 animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Theme Customization</h3>
                <p className="text-sm text-gray-500 mb-6">Modify the visual appearance of the application by selecting different themes.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {['Light', 'Dark', 'Blue', 'Green'].map(t => (
                        <div 
                            key={t}
                            onClick={() => setTheme(t)}
                            className={`cursor-pointer rounded-xl border-2 transition-all p-4 flex flex-col items-center gap-4 ${theme === t ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                        >
                            <div className={`w-full h-24 rounded-lg flex items-center justify-center ${t === 'Light' ? 'bg-gray-50 border border-gray-200' : t === 'Dark' ? 'bg-gray-800' : t === 'Blue' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                                <span className={t === 'Light' ? 'text-gray-400' : 'text-white'}>Preview</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="radio" checked={theme === t} onChange={() => setTheme(t)} className="text-blue-600 focus:ring-blue-500" />
                                <span className="font-medium text-gray-800">{t}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end border-t border-gray-100 pt-6">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Apply Theme
                </button>
            </div>
        </form>
    );

    const renderDetailedPermissions = () => {
        const screens = ['Dashboard', 'User Management', 'Assessment', 'Library', 'Reports'];
        
        return (
            <form onSubmit={handleSavePermissions} className="space-y-6 animate-fadeIn">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Detailed Permissions Configuration</h3>
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
                                {screens.map((screen, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-800">{screen}</td>
                                        {['View', 'Add', 'Edit', 'Delete'].map(action => (
                                            <td key={action} className="p-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                    defaultChecked={selectedRole === 'Admin' || (selectedRole === 'Leader' && action === 'View')}
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
        { id: 'theme', label: 'Theme Customization', icon: 'pi pi-palette' },
        { id: 'permissions', label: 'Detailed Permissions', icon: 'pi pi-lock' }
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
