import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignChart = () => {
    const [students, setStudents] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [chartType, setChartType] = useState('30-Day');
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentsRes = await axios.get('http://' + window.location.hostname + ':8000/api/students/', { withCredentials: true });
                setStudents(studentsRes.data);
                
                const assignmentsRes = await axios.get('http://' + window.location.hostname + ':8000/api/assignments/', { withCredentials: true });
                setAssignments(assignmentsRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (!startDate) {
            setEndDate('');
            return;
        }
        
        try {
            const start = new Date(startDate);
            if (isNaN(start.getTime())) throw new Error("Invalid date");
            const daysToAdd = chartType === '30-Day' ? 29 : 39;
            const end = new Date(start);
            end.setDate(end.getDate() + daysToAdd);
            setEndDate(end.toISOString().split('T')[0]);
        } catch (e) {
            setEndDate('');
        }
    }, [startDate, chartType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        
        if (!selectedUser || !chartType || !startDate || !endDate) {
            setMessage('Please fill all fields');
            return;
        }

        try {
            const payload = {
                user_id: selectedUser,
                chart_type: chartType,
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString(),
            };
            
            const res = await axios.post('http://' + window.location.hostname + ':8000/api/assignments/', payload, { withCredentials: true });
            
            setAssignments([res.data, ...assignments]);
            setMessage('Chart successfully assigned!');
            // Reset User Selection to be ready for next assignment (optional)
            setSelectedUser('');
        } catch (error) {
            console.error(error);
            setMessage('Failed to assign chart');
        }
    };

    return (
        <div className="p-10 max-w-6xl mx-auto">
            <h1 className="text-3xl font-black text-[#051220] tracking-tight mb-2">Assign Chart to User</h1>
            <p className="text-gray-500 mb-8">Select a user, a training chart type, and its starting date.</p>
            
            {message && (
                <div className={`mb-4 p-4 rounded font-medium ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">User (Student)</label>
                        <select 
                            value={selectedUser} 
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a165]"
                            required
                        >
                            <option value="">Select a student...</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>{student.name || student.email}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Chart Type</label>
                        <select 
                            value={chartType} 
                            onChange={(e) => setChartType(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a165]"
                        >
                            <option value="30-Day">30-Day Chart</option>
                            <option value="40-Day">40-Day Chart</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c8a165]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">End Date (Calculated)</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            readOnly
                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-400 mt-1">Automatically generated based on chart duration.</p>
                    </div>

                    <div className="md:col-span-2 mt-4">
                        <button 
                            type="submit" 
                            className="bg-[#051220] hover:bg-gray-800 text-[#c8a165] font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center min-w-[200px]"
                        >
                            Assign Chart
                        </button>
                    </div>
                </form>
            </div>

            <h2 className="text-xl font-bold text-[#051220] mb-4">Assigned Charts</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-sm font-bold text-gray-600">User ID</th>
                            <th className="p-4 text-sm font-bold text-gray-600">Chart Type</th>
                            <th className="p-4 text-sm font-bold text-gray-600">Start Date</th>
                            <th className="p-4 text-sm font-bold text-gray-600">End Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.length > 0 ? assignments.map((assignment) => (
                            <tr key={assignment.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="p-4 text-sm text-gray-800 truncate" title={assignment.user_id}>{assignment.user_id.split('-')[0]}...</td>
                                <td className="p-4 text-sm font-medium text-[#c8a165]">{assignment.chart_type}</td>
                                <td className="p-4 text-sm text-gray-600">{new Date(assignment.start_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                                <td className="p-4 text-sm text-gray-600">{new Date(assignment.end_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-400">No assignments found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssignChart;
