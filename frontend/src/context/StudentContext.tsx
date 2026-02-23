import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStudents } from '../api/students';
import type { Students } from '../types/students';
import { toast } from 'react-toastify';

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
        } catch (error) {
            console.error("Failed to fetch students:", error);
            toast.error("Error loading student records");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
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
