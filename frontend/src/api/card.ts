import api from "./axios";

export const getLayout = async () => {
    const request = await api.get('/layouts/active');
    return request;
}