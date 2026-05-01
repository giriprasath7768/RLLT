import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentClassroom = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`http://${window.location.hostname}:8000/api/classroom/courses`, { withCredentials: true });
            setCourses(res.data);
        } catch (error) {
            console.error("Failed to fetch courses", error);
            // Fallback for demo purposes if backend migration isn't run yet
            setCourses([
                { id: 1, title: 'Leadership 101', modules: 3, lessons: 12 },
                { id: 2, title: 'Advanced Analytics', modules: 5, lessons: 20 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-10 flex justify-center items-center h-full"><i className="pi pi-spin pi-spinner text-4xl text-[#cca673]"></i></div>;
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#051220] tracking-tight">My Classroom</h1>
                <p className="text-gray-500 mt-1">View your enrolled courses and upcoming assignments.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Enrolled Courses</div>
                        <div className="text-4xl font-black text-[#051220]">{courses.length}</div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                        <i className="pi pi-book text-3xl"></i>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                    <div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">My Progress</div>
                        <div className="text-4xl font-black text-[#051220]">0%</div>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-inner">
                        <i className="pi pi-chart-line text-3xl"></i>
                    </div>
                </div>
            </div>

            {/* Courses List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-[#051220]">Course Content</h2>
                </div>
                
                {courses.length > 0 ? (
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
                                            <span className="flex items-center gap-1.5"><i className="pi pi-folder"></i> {course.modules || 0} Modules</span>
                                            <span className="flex items-center gap-1.5"><i className="pi pi-file"></i> {course.lessons || 0} Lessons</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="h-10 px-4 rounded-lg bg-[#cca673] text-white hover:bg-[#b59263] flex items-center justify-center transition-colors font-bold text-sm shadow-sm">
                                        View Content
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
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Courses Available</h3>
                        <p className="text-gray-500 max-w-md">There are currently no courses assigned to your location. Check back later.</p>
                    </div>
                )}
            </div>
            
        </div>
    );
};

export default StudentClassroom;
