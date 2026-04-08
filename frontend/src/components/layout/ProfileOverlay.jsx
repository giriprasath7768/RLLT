import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Password } from 'primereact/password';
import { InputTextarea } from 'primereact/inputtextarea';
import axios from 'axios';

export default function ProfileOverlay({ visible, viewMode = 'profile', onHide, initialData, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '',
        companyName: 'Real Life Leadership Training',
        avatarUrl: '',
        mobile_number: '',
        address: ''
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        if (visible && initialData) {
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                role: initialData.role || 'Administrator',
                companyName: initialData.companyName || 'Real Life Leadership Training',
                avatarUrl: initialData.avatarUrl || 'https://primefaces.org/cdn/primereact/images/avatar/amyelsner.png',
                mobile_number: initialData.mobile_number || '',
                address: initialData.address || ''
            });
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        }
    }, [visible, initialData]);

    const handleInputChange = (e, field) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handlePasswordChange = (e, field) => {
        setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleAvatarUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, avatarUrl: event.target.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await axios.put('http://localhost:8000/api/profile/me', {
                name: formData.name,
                mobile_number: formData.mobile_number,
                address: formData.address,
                profile_image_url: formData.avatarUrl
            }, { withCredentials: true });

            if (onSave) {
                onSave(formData);
            }
            if (toast.current) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 });
            }
            setTimeout(() => {
                onHide();
            }, 1000);
        } catch (err) {
            console.error(err);
            if (toast.current) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 3000 });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSave = async () => {
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'Please fill all password fields', life: 3000 });
            return;
        }
        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'New passwords do not match', life: 3000 });
            return;
        }

        setIsPasswordLoading(true);
        try {
            await axios.put('http://localhost:8000/api/profile/password', {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            }, { withCredentials: true });

            if (toast.current) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: 'Password updated successfully', life: 3000 });
            }
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err) {
            console.error(err);
            if (toast.current) {
                toast.current.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Failed to update password', life: 3000 });
            }
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog 
                visible={visible} 
                breakpoints={{ '960px': '75vw', '641px': '95vw' }}
                onHide={onHide}
                showHeader={false}
                className="p-fluid custom-admin-dialog max-w-2xl w-full"
                contentClassName="rounded-3xl overflow-hidden bg-[#060238] p-0"
                maskClassName="backdrop-blur-[2px] bg-black/40"
            >
                <div className="p-4 sm:p-6">
                    {viewMode === 'profile' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-4 sm:p-6">
                        {/* Profile Update Card */}
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                            <h2 className="text-xl font-bold text-gray-800 m-0">Profile Settings</h2>
                            <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={onHide} className="w-8 h-8 p-0 md:hidden" />
                        </div>

                        <div className="flex flex-col items-center mb-4">
                            <div className="relative group cursor-pointer w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-md transition-transform hover:scale-105">
                                <img 
                                    src={formData.avatarUrl} 
                                    alt="Profile Avatar" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.src = 'https://www.primefaces.org/wp-content/uploads/2020/05/placeholder.png'; }}
                                />
                                <div className="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col items-center justify-center text-white transition-opacity duration-200">
                                    <i className="pi pi-camera text-2xl mb-1"></i>
                                    <span className="text-xs font-semibold uppercase tracking-wider">Change</span>
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                                    onChange={handleAvatarUpload}
                                    title="Upload new avatar"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                            <InputText id="name" value={formData.name} onChange={(e) => handleInputChange(e, 'name')} className="w-full" disabled={isLoading} />
                        </div>

                        <div className="field mt-3">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                            <div className="p-input-icon-left w-full">
                                <i className="pi pi-envelope text-gray-400" />
                                <InputText id="email" value={formData.email} onChange={(e) => handleInputChange(e, 'email')} disabled={isLoading} className="w-full pl-10" />
                            </div>
                        </div>

                        <div className="field mt-3">
                            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                            <InputTextarea id="address" value={formData.address} onChange={(e) => handleInputChange(e, 'address')} rows={3} className="w-full resize-none" disabled={isLoading} />
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={onHide} disabled={isLoading} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Save Changes" severity="success" onClick={handleSave} loading={isLoading} className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                    )}

                    {viewMode === 'password' && (
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-200 p-4 sm:p-6 flex flex-col justify-between">
                        {/* Change Password Card */}
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                <h2 className="text-xl font-bold text-gray-800 m-0">Change Password</h2>
                                <Button icon="pi pi-times" rounded text severity="secondary" aria-label="Cancel" onClick={onHide} className="w-8 h-8 p-0 md:hidden" />
                            </div>

                            <p className="text-sm text-gray-500 mb-4">Ensure your account is using a long, random password to stay secure.</p>

                            <div className="field mb-3">
                                <label htmlFor="current_password" className="block text-sm font-semibold text-gray-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                                <Password id="current_password" value={passwordData.current_password} onChange={(e) => handlePasswordChange(e, 'current_password')} toggleMask feedback={false} className="w-full" inputClassName="w-full" disabled={isPasswordLoading} />
                            </div>

                            <div className="field mb-3">
                                <label htmlFor="new_password" className="block text-sm font-semibold text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
                                <Password id="new_password" value={passwordData.new_password} onChange={(e) => handlePasswordChange(e, 'new_password')} toggleMask className="w-full" inputClassName="w-full" disabled={isPasswordLoading} />
                            </div>

                            <div className="field mb-4">
                                <label htmlFor="confirm_password" className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                <Password id="confirm_password" value={passwordData.confirm_password} onChange={(e) => handlePasswordChange(e, 'confirm_password')} toggleMask feedback={false} className="w-full" inputClassName="w-full" disabled={isPasswordLoading} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-100">
                            <Button label="Cancel" onClick={onHide} disabled={isPasswordLoading} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 w-auto px-6 h-10 shadow-sm transition-colors" />
                            <Button label="Update Password" severity="warning" onClick={handlePasswordSave} loading={isPasswordLoading} className="bg-orange-500 text-white hover:bg-orange-600 border border-orange-500 w-auto px-6 h-10 shadow-sm transition-colors" />
                        </div>
                    </div>
                    )}
                </div>
            </Dialog>
        </>
    );
}
