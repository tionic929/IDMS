// echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

(window as any).Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'pusher',
    key: '401ae79568ea4d18c74f',
    cluster: 'ap1',
    forceTLS: true,
    encrypted: true,

    authorizer: (channel: any, options: any) => {
        return {
            authorize: (socketId: string, callback: Function) => {
                axios.post('/broadcasting/auth', {
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