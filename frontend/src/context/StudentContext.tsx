import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStudents } from '../api/students';
import type { Students } from '../types/students';
import { toast } from 'react-toastify';
import { echo } from '../echo';

interface StudentContextType {
    allStudents: Students[];
    loading: boolean;
    refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [allStudents, setAllStudents] = useState<Students[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStudents = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getStudents();
            const combined = [
                ...(res.queueList || []),
                ...(res.history || [])
            ];
            setAllStudents(combined);
            console.log(`[StudentContext] Fetched ${combined.length} students`);
        } catch (error) {
            console.error("[StudentContext] Failed to fetch students:", error);
            toast.error("Error updating student records");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    useEffect(() => {
        console.log('[Echo] Initializing listener on "dashboard" channel');

        const handleNewSubmission = (data: any) => {
            console.log('[Echo] SUCCESS: Received event!', data);
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
            console.log('[Echo] Pusher Connected successfully');
        });

        echo.connector.pusher.connection.bind('error', (err: any) => {
            console.error('[Echo] Pusher Connection Error:', err);
        });

        return () => {
            console.log('[Echo] Cleaning up listeners');
            channel.stopListening('.new-submission');
            channel.stopListening('new-submission');
        };
    }, [fetchStudents]);

    return (
        <StudentContext.Provider value={{ allStudents, loading, refreshStudents: fetchStudents }}>
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
