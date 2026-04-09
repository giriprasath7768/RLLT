import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Password must be at least 6 characters.', life: 3000 });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Passwords do not match.', life: 3000 });
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://localhost:8000/api/reset-password', {
                token,
                new_password: newPassword
            });

            toast.current.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Password has been reset successfully. You can now login.',
                life: 3000
            });
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.response?.data?.detail || 'Failed to reset password. Link might be expired.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center font-sans relative bg-white px-4 sm:px-0">
            <Toast ref={toast} position="top-right" />

            <div className="bg-[#051220] border border-[#ffffff]/20 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative mt-10 sm:mt-16 z-10">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#0f2136] border border-[#ffffff]/30 rounded-full w-24 h-24 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <i className="pi pi-key text-5xl text-[#ffffff]/80"></i>
                    </div>
                </div>

                <h2 className="text-center text-white text-xl sm:text-2xl font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-6 sm:mt-8 mb-6 sm:mb-8 text-shadow-sm">RESET PASSWORD</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <p className="text-[#b8c6d3] text-sm text-center">
                        Enter your new password below.
                    </p>

                    <div className="flex bg-[#051220]/70 border border-[#ffffff]/20 rounded-lg overflow-hidden h-12 transition-all hover:border-[#ffffff]/40 focus-within:border-[#cca673] focus-within:shadow-[0_0_10px_rgba(204,166,115,0.2)]">
                        <div className="bg-transparent w-14 flex items-center justify-center border-r border-[#ffffff]/10 z-20">
                            <i className="pi pi-lock text-[#b8c6d3] text-xl"></i>
                        </div>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New Password"
                            className="bg-transparent text-white border-none focus:outline-none focus:ring-0 w-full px-4 placeholder-[#6b829e] font-medium"
                        />
                    </div>

                    <div className="flex bg-[#051220]/70 border border-[#ffffff]/20 rounded-lg overflow-hidden h-12 transition-all hover:border-[#ffffff]/40 focus-within:border-[#cca673] focus-within:shadow-[0_0_10px_rgba(204,166,115,0.2)]">
                        <div className="bg-transparent w-14 flex items-center justify-center border-r border-[#ffffff]/10 z-20">
                            <i className="pi pi-lock text-[#b8c6d3] text-xl"></i>
                        </div>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="bg-transparent text-white border-none focus:outline-none focus:ring-0 w-full px-4 placeholder-[#6b829e] font-medium"
                        />
                    </div>

                    <div className="pt-6 pb-2">
                        <Button
                            type="submit"
                            label={loading ? 'RESETTING...' : 'RESET PASSWORD'}
                            disabled={loading}
                            className="w-full bg-[#cca673] hover:bg-[#b08c5c] text-[#121c27] font-bold tracking-[0.15em] py-3.5 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(204,166,115,0.4)] hover:shadow-[0_0_20px_rgba(204,166,115,0.6)] border-none"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
