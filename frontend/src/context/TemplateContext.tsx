import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTemplate, handleActiveLayouts, createNewTemplate as apiCreateTemplate } from '../api/templates';
import type { Template } from '../types/templates';
import { toast } from 'react-toastify';

interface TemplateContextType {
    templates: Template[];
    loading: boolean;
    refreshTemplates: () => Promise<void>;
    setActiveTemplate: (id: number) => Promise<void>;
    createTemplate: (name: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getTemplate();
            setTemplates(data);
        } catch (error) {
            console.error("Failed to fetch templates:", error);
            toast.error("Error loading templates");
        } finally {
            setLoading(false);
        }
    }, []);

    const setActiveTemplate = async (id: number) => {
        try {
            await handleActiveLayouts(id);
            await fetchTemplates(); // Refresh to get updated active status
            toast.success("Template set as active");
        } catch (error) {
            toast.error("Error updating status");
        }
    };

    const createTemplate = async (name: string) => {
        try {
            const data = await apiCreateTemplate(name);
            setTemplates(prev => [...prev, data]);
            toast.success("Template created!");
        } catch (error) {
            toast.error("Error creating template");
            throw error;
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    return (
        <TemplateContext.Provider value={{
            templates,
            loading,
            refreshTemplates: fetchTemplates,
            setActiveTemplate,
            createTemplate
        }}>
            {children}
        </TemplateContext.Provider>
    );
};

export const useTemplates = () => {
    const context = useContext(TemplateContext);
    if (!context) {
        throw new Error('useTemplates must be used within a TemplateProvider');
    }
    return context;
};
