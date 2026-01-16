import api from "./axios";

export const getTemplate = async () => {
    const request = await api.get('/card-layouts');
    return request.data;
}

export const createNewTemplate = async (name: string) => {
    const request = await api.post('/card-layouts', {
        name: name,
        front_config: { 
            photo: { x: 60, y: 80, width: 200, height: 180 },
            fullName: { x: 20, y: 300, fontSize: 22, fill: '#1e293b', fontStyle: 'bold' },
            course: { x: 20, y: 180, fontSize: 14 },
            idNumber: { x: 20, y: 330, fontSize: 16, fill: '#64748b' }
        },
        back_config: { 
            signature: { x: 60, y: 50, width: 200, height: 100 },
            address: { x: 20, y: 210, fontSize: 12 },
            guardian_name: { x: 20, y: 240, fontSize: 12 },
            guardian_contact: { x: 20, y: 260, fontSize: 12 }
        }
    });
    return request.data;
}

export const handleActiveLayouts = async (id: number) => {
    const request = await api.patch(`/api/card-layouts/${id}/activate`);
    return request.data;
}

export const saveLayout = async (templateId: number, name: string, config: any) => {
    const request = await api.put(`/card-layouts/${templateId}`, {
        name: name,
        front_config: config.front,
        back_config: config.back
    });
    return request.data;
}