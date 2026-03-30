import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStudents } from '../api/students';
import type { Students } from '../types/students';
import { toast } from 'react-toastify';
import { echo } from '../echo';

interface StudentContextType {
    allStudents: Students[];
    loading: boolean;
    refreshStudents: () => Promise<void>;
    updateStudentLocal: (id: number, updates: Partial<Students>) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [allStudents, setAllStudents] = useState<Students[]>([]);
    const [loading, setLoading] = useState(true);

    const updateStudentLocal = useCallback((id: number, updates: Partial<Students>) => {
        setAllStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }, []);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getStudents();
            const combined = [
                ...(res.queueList || []),
                ...(res.history || [])
            ];
            setAllStudents(combined);
        } catch (error) {
            toast.error("Error updating student records");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {

        const handleNewSubmission = (data: any) => {
            const student = data.student;

            toast.success(`New application received: ${student?.first_name} ${student?.last_name}`, {
                position: "top-right",
                autoClose: 5000,
            });

            fetchStudents();
        };

        const channel = echo.channel('dashboard');

        // Listen both with and without dot for robustness
        channel.listen('.new-submission', handleNewSubmission)
            .listen('new-submission', handleNewSubmission);

        // Debug connection
        echo.connector.pusher.connection.bind('connected', () => {
        });

        echo.connector.pusher.connection.bind('error', (err: any) => {
        });

        return () => {
            channel.stopListening('.new-submission');
            channel.stopListening('new-submission');
        };
    }, [fetchStudents]);

    return (
        <StudentContext.Provider value={{ allStudents, loading, refreshStudents: fetchStudents, updateStudentLocal }}>
            {children}
        </StudentContext.Provider>
    );
};

export const useStudents = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudents must be used within a StudentProvider');
    }
    return context;
};
