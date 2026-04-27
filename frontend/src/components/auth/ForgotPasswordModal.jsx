import React, { useState, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import axios from 'axios';

const ForgotPasswordModal = ({ visible, onHide }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please enter your email.', life: 3000 });
            return;
        }

        setLoading(true);
        try {
            await axios.post('http://' + window.location.hostname + ':8000/api/forgot-password', { email });
            
            toast.current.show({ 
                severity: 'success', 
                summary: 'Sent', 
                detail: 'If this email is registered, a reset link has been sent.', 
                life: 5000 
            });
            setTimeout(() => {
                onHide();
                setEmail('');
            }, 5000); // Wait for toast to fade out before completely closing if desired, or act immediately
        } catch (error) {
            toast.current.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: error.response?.data?.detail || 'An error occurred. Please try again later.', 
                life: 3000 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Toast ref={toast} position="top-right" />
            <Dialog 
                header={<div className="text-white text-xl font-bold tracking-[0.1em] text-shadow-sm">RESET PASSWORD</div>} 
                visible={visible} 
                className="w-[90vw] sm:w-[50vw] md:w-[40vw] max-w-md"
                onHide={onHide}
                dismissableMask={true}
                pt={{
                    mask: { className: 'bg-black/60 backdrop-blur-sm' },
                    root: { className: 'bg-[#051220]/80 backdrop-blur-xl border border-[#ffffff]/20 rounded-2xl shadow-2xl p-0' },
                    header: { className: 'bg-transparent border-b border-[#ffffff]/10 pb-5 pt-6 px-8' },
                    content: { className: 'bg-transparent px-8 py-6' },
                    closeButton: { className: 'text-[#b8c6d3] hover:text-white transition-colors outline-none' },
                    closeButtonIcon: { className: 'w-4 h-4' }
                }}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <p className="text-[#b8c6d3] text-sm leading-relaxed mb-6">
                        Enter the email address you used when you joined and we'll send you instructions to reset your password.
                    </p>
                    
                    <div className="flex bg-[#051220]/70 border border-[#ffffff]/20 rounded-lg overflow-hidden h-12 transition-all hover:border-[#ffffff]/40 focus-within:border-[#cca673] focus-within:shadow-[0_0_10px_rgba(204,166,115,0.2)]">
                        <div className="bg-transparent w-14 flex items-center justify-center border-r border-[#ffffff]/10 z-20">
                            <i className="pi pi-envelope text-[#b8c6d3] text-xl"></i>
                        </div>
                        <input
                            type="email"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="Email address" 
                            className="bg-transparent text-white border-none focus:outline-none focus:ring-0 w-full px-4 placeholder-[#6b829e] font-medium"
                        />
                    </div>

                    <div className="pt-4 pb-2">
                        <Button 
                            type="submit" 
                            label={loading ? 'SENDING...' : 'SEND RESET LINK'} 
                            disabled={loading}
                            className="w-full bg-[#cca673] hover:bg-[#b08c5c] disabled:opacity-50 disabled:cursor-not-allowed text-[#121c27] font-bold tracking-[0.1em] py-3.5 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(204,166,115,0.4)] hover:shadow-[0_0_20px_rgba(204,166,115,0.6)] border-none"
                        />
                    </div>
                </form>
            </Dialog>
        </>
    );
};

export default ForgotPasswordModal;
