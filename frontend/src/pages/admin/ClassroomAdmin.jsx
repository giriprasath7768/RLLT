import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ClassroomAdmin = () => {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        if (selectedLocation) {
            fetchCourses(selectedLocation.id);
        } else {
            setCourses([]);
        }
    }, [selectedLocation]);

    const fetchLocations = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:8000/api/locations`, { withCredentials: true });
            if (res.data && res.data.length > 0) {
                setLocations(res.data);
                setSelectedLocation(res.data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch locations", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async (locationId) => {
        try {
            setLoading(true);
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/courses?location_id=${locationId}`, { withCredentials: true });
            setCourses(res.data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
            // Fallback for demo purposes if backend isn't ready
            setCourses([
                { id: 1, title: 'Leadership 101', modules: 3, lessons: 12 },
                { id: 2, title: 'Advanced Analytics', modules: 5, lessons: 20 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !locations.length) {
        return <div className="p-10 flex justify-center items-center h-full"><i className="pi pi-spin pi-spinner text-4xl text-[#cca673]"></i></div>;
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#051220] tracking-tight">Classroom Management</h1>
                    <p className="text-gray-500 mt-1">Manage courses, modules, and assignments for your centers.</p>
                </div>

                {/* Location Switcher */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-50 text-indigo-500">
                        <i className="pi pi-map-marker text-xl"></i>
                    </div>
                    <div className="pr-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Active Location</label>
                        <select 
                            className="bg-transparent border-none text-sm font-bold text-[#051220] focus:ring-0 p-0 cursor-pointer outline-none"
                            value={selectedLocation?.id || ''}
                            onChange={(e) => {
                                const loc = locations.find(l => l.id === e.target.value);
                                setSelectedLocation(loc);
                            }}
                        >
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>
                                    {loc.city}, {loc.country}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Total Courses</div>
                        <div className="text-4xl font-black text-[#051220]">{courses.length}</div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                        <i className="pi pi-book text-3xl"></i>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Active Students</div>
                        <div className="text-4xl font-black text-[#051220]">24</div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center shadow-inner">
                        <i className="pi pi-users text-3xl"></i>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Progress</div>
                        <div className="text-4xl font-black text-[#051220]">68%</div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner">
                        <i className="pi pi-chart-line text-3xl"></i>
                    </div>
                </div>
            </div>

            {/* Courses List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-[#051220]">Courses for {selectedLocation?.city}</h2>
                    <button className="bg-[#cca673] hover:bg-[#b59263] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2">
                        <i className="pi pi-plus"></i>
                        Create Course
                    </button>
                </div>
                
                {loading ? (
                    <div className="p-12 flex justify-center items-center">
                        <i className="pi pi-spin pi-spinner text-3xl text-gray-400"></i>
                    </div>
                ) : courses.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {courses.map(course => (
                            <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-5">
                                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                                        <i className="pi pi-book text-2xl"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#051220]">{course.title}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 font-medium">
                                            <span className="flex items-center gap-1.5"><i className="pi pi-folder"></i> {course.modules} Modules</span>
                                            <span className="flex items-center gap-1.5"><i className="pi pi-file"></i> {course.lessons} Lessons</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="h-10 w-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                        <i className="pi pi-pencil"></i>
                                    </button>
                                    <button className="h-10 w-10 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                        <i className="pi pi-cog"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <i className="pi pi-book text-4xl text-gray-300"></i>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Courses Found</h3>
                        <p className="text-gray-500 max-w-md">There are no courses created for this location yet. Create your first course to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassroomAdmin;
