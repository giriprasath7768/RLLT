import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { calculateStudentLevel } from '../utils/studentUtils';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [dob, setDob] = useState(null);
    const [gender, setGender] = useState(null);
    const [location, setLocation] = useState(null);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);

    const toast = useRef(null);
    const navigate = useNavigate();

    const genderOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' }
    ];

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const response = await axios.get('http://' + window.location.hostname + ':8000/api/locations');
                const locOptions = response.data.map(loc => ({
                    label: `${loc.city}, ${loc.country} (${loc.continent})`,
                    value: loc.id
                }));
                setLocations(locOptions);
            } catch (err) {
                console.error("Failed to fetch locations", err);
            }
        };
        fetchLocations();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !address || !mobile || !dob || !gender || !location) {
            toast.current.show({ severity: 'warn', summary: 'Missing Fields', detail: 'Please fill in all fields to register', life: 3000 });
            return;
        }

        setLoading(true);
        try {
            // Formatting Date to YYYY-MM-DD
            const formattedDob = new Date(dob.getTime() - (dob.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const cal = calculateStudentLevel(dob);

            const payload = {
                name: name,
                email: email,
                address: address,
                mobile_number: mobile,
                dob: formattedDob,
                gender: gender,
                location_id: location,
                category: cal.category,
                stage: cal.stage
            };

            await axios.post('http://' + window.location.hostname + ':8000/api/register', payload);

            toast.current.show({ severity: 'success', summary: 'Registration successful!', detail: 'Check your email for your enrollment number and temporary password.', life: 5000 });

            // Redirect to login after a delay
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            let errorDetail = 'Registration failed. Please try again.';
            let errorSummary = 'Error';

            if (err.response?.status === 422) {
                errorSummary = 'Validation Error';
            } else if (err.response?.status === 400) {
                errorSummary = 'Registration Failed';
            }

            if (err.response?.data?.detail) {
                if (Array.isArray(err.response.data.detail)) {
                    errorDetail = err.response.data.detail.map(d => `${d.loc?.[1] || 'Field'}: ${d.msg}`).join(', ');
                } else if (typeof err.response.data.detail === 'string') {
                    errorDetail = err.response.data.detail;
                }
            }
            toast.current.show({ severity: 'error', summary: errorSummary, detail: errorDetail, life: 5000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center font-sans relative bg-white px-4 sm:px-0 py-8"
        >
            <Toast ref={toast} />
            <div className="bg-[#051220] border border-[#ffffff]/20 rounded-2xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative z-10">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#0f2136] border border-[#ffffff]/30 rounded-full w-24 h-24 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        <i className="pi pi-user-plus text-5xl text-[#ffffff]/80"></i>
                    </div>
                </div>

                <h2 className="text-center text-white text-xl sm:text-2xl font-bold tracking-[0.1em] sm:tracking-[0.2em] mt-8 mb-6 text-shadow-sm">STUDENT ENROLLMENT</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[#c2d1df] text-sm font-semibold">Full Name *</label>
                            <InputText
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-[#051220]/70 border-2 border-[#ffffff]/40 text-white placeholder-[#6b829e] h-12"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[#c2d1df] text-sm font-semibold">Email ID *</label>
                            <InputText
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                keyfilter="email"
                                className="bg-[#051220]/70 border-2 border-[#ffffff]/40 text-white placeholder-[#6b829e] h-12"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[#c2d1df] text-sm font-semibold">Residential Address *</label>
                        <InputTextarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="bg-[#051220]/70 border-2 border-[#ffffff]/40 text-white placeholder-[#6b829e]"
                            placeholder="Enter your full address"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[#c2d1df] text-sm font-semibold">Mobile Number *</label>
                            <InputText
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                keyfilter="num"
                                className="bg-[#051220]/70 border-2 border-[#ffffff]/40 text-white placeholder-[#6b829e] h-12"
                                placeholder="1234567890"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[#c2d1df] text-sm font-semibold">Date of Birth *</label>
                            <Calendar
                                value={dob}
                                onChange={(e) => setDob(e.value)}
                                dateFormat="dd/mm/yy"
                                showIcon
                                maxDate={new Date()}
                                className="bg-[#051220]/70 border-2 border-[#ffffff]/40 text-white"
                                inputClassName="!bg-transparent text-[#b8c6d3] placeholder-[#6b829e]"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[#c2d1df] text-sm font-semibold">Gender *</label>
                            <Dropdown
                                value={gender}
                                onChange={(e) => setGender(e.value)}
                                options={genderOptions}
                                placeholder="Select Gender"
                                className="bg-[#051220]/70 border-2 border-[#ffffff]/40 text-[#b8c6d3] h-12 flex items-center"
                                panelClassName="bg-[#0f2136] text-white border border-[#ffffff]/20"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[#c2d1df] text-sm font-semibold">Location *</label>
                            <Dropdown
                                value={location}
                                onChange={(e) => setLocation(e.value)}
                                options={locations}
                                placeholder="Select Location"
                                className="bg-[#051220]/70 border-2 border-[#ffffff]/40 text-[#b8c6d3] h-12 flex items-center"
                                panelClassName="bg-[#0f2136] text-white border border-[#ffffff]/20"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                        <Button
                            type="button"
                            label="BACK TO LOGIN"
                            icon="pi pi-arrow-left"
                            outlined
                            onClick={() => navigate('/login')}
                            className="w-full sm:w-1/3 border-[#ffffff]/30 text-[#b8c6d3] hover:bg-[#ffffff]/10 hover:text-white transition-colors"
                        />
                        <Button
                            type="submit"
                            label="SUBMIT ENROLLMENT"
                            icon="pi pi-check"
                            loading={loading}
                            className="w-full sm:w-2/3 bg-[#cca673] hover:bg-[#b08c5c] text-[#121c27] font-bold tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(204,166,115,0.4)] hover:shadow-[0_0_20px_rgba(204,166,115,0.6)] border-none"
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
