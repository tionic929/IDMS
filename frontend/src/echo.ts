// echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

(window as any).Pusher = Pusher;

// 1. Setup Axios to handle Cookies & CSRF automatically
const axiosInstance = axios.create({
    baseURL: 'http://192.168.68.78:8000', // Ensure this matches your API URL
    withCredentials: true, // CRITICAL: Sends cookies/session to backend
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    }
});

export const echo = new Echo({
    broadcaster: 'pusher',
    key: '401ae79568ea4d18c74f',
    cluster: 'ap1',
    forceTLS: true,
    encrypted: true,

    // 2. Custom Authorizer
    // This overrides the default behavior to use our configured Axios instance
    authorizer: (channel: any, options: any) => {
        return {
            authorize: (socketId: string, callback: Function) => {
                axiosInstance.post('/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                .then(response => {
                    callback(false, response.data);
                })
                .catch(error => {
                    console.error('Broadcasting Auth Failed:', error);
                    callback(true, error);
                });
            }
        };
    },
});