import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    getTemplate,
    createNewTemplate as apiCreateTemplate,
    deleteTemplate as apiDeleteTemplate,
    duplicateTemplate as apiDuplicateTemplate,
    saveLayout,
    uploadTemplateLogo
} from '../api/templates';
import type { Template } from '../types/templates';
import { toast } from 'react-toastify';

interface TemplateContextType {
    templates: Template[];
    loading: boolean;
    refreshTemplates: () => Promise<void>;
    createTemplate: (name: string, bgColor: string, logo: string | File) => Promise<void>;
    deleteTemplate: (id: number) => Promise<void>;
    duplicateTemplate: (id: number) => Promise<void>;
    renameTemplate: (id: number, newName: string, bgColor: string, logo: string | File) => Promise<void>;
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

    const createTemplate = async (name: string, bgColor: string, logo: string | File) => {
        try {
            let logoUrl = typeof logo === 'string' ? logo : '';

            if (logo instanceof File) {
                const uploadRes = await uploadTemplateLogo(logo);
                logoUrl = uploadRes.url;
            }

            const data = await apiCreateTemplate(name, bgColor, logoUrl);
            setTemplates(prev => [...prev, data]);
            toast.success("Template created!");
        } catch (error) {
            toast.error("Error creating template");
            throw error;
        }
    };

    const deleteTemplate = async (id: number) => {
        try {
            await apiDeleteTemplate(id);
            setTemplates(prev => prev.filter(t => t.id !== id));
            toast.success("Template deleted!");
        } catch (error) {
            toast.error("Error deleting template");
            throw error;
        }
    };

    const duplicateTemplate = async (id: number) => {
        try {
            const newTemplate = await apiDuplicateTemplate(id);
            setTemplates(prev => [newTemplate, ...prev]);
            toast.success("Template duplicated!");
        } catch (error) {
            toast.error("Error duplicating template");
            throw error;
        }
    };

    const renameTemplate = async (id: number, newName: string, bgColor: string, logo: string | File) => {
        try {
            const template = templates.find(t => t.id === id);
            if (!template) return;

            let logoUrl = typeof logo === 'string' ? logo : (template.logo || '');

            if (logo instanceof File) {
                const uploadRes = await uploadTemplateLogo(logo);
                logoUrl = uploadRes.url;
            }

            const updatedFront = { ...template.front_config };
            const updatedBack = { ...template.back_config };

            // Overwrite any old top-level bg_color or template_logo we might have erroneously added
            if (updatedFront.bg_color) delete updatedFront.bg_color;
            if (updatedBack.bg_color) delete updatedBack.bg_color;
            if (updatedFront.template_logo) delete updatedFront.template_logo;

            updatedFront.template_meta = {
                ...updatedFront.template_meta,
                visible: false,
                bg_color: bgColor,
                logo: logoUrl
            };

            const updated = await saveLayout(id, newName, { front: updatedFront, back: updatedBack }, template.preview_images || undefined, logoUrl);
            setTemplates(prev => prev.map(t => t.id === id ? updated : t));
            toast.success("Template updated!");
        } catch (error) {
            toast.error("Error updating template");
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
            createTemplate,
            deleteTemplate,
            duplicateTemplate,
            renameTemplate
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
