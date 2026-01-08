// NotificationComponent.tsx
import React, { useEffect } from 'react';
import { echo } from '../echo'; // your existing Echo instance
import { toast } from 'react-toastify';

interface ToastContainerProps {
  userId: number;
  userRole: string;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ userId, userRole }) => {
  useEffect(() => {

    if (!userId || !userRole) {
        console.warn("ToastContainer not fully initialized: Missing userId or userRole.");
        return;
    }
    console.log(`[Component] Mounting. Subscribing to role.${userRole} and user.${userId}`);
    // --- Role-based channel ---
    const roleChannel = echo.private(`role.${userRole}`);
    const roleListener = (payload: any) => {
      const message =
        payload.message ||
        payload.data?.message ||
        payload.notification ||
        JSON.stringify(payload);
      toast.info(`[${userRole}] ${message}`, { position: 'top-right', autoClose: 5000 });
      console.log('[Role Notification RECEIVED]', payload);
    };
    roleChannel
            .listen('.RoleNotification', roleListener)
            .error((err: any) => {
                console.error(`[ECHO SUBSCRIPTION ERROR] Role Channel failed for ${userRole}.`, err);
            });

    // --- Private channel ---
    const privateChannel = echo.private(`user.${userId}`);
    const privateListener = (payload: any) => {
      const message =
        payload.message ||
        payload.data?.message ||
        payload.notification ||
        JSON.stringify(payload);
      toast.success(`[Private] ${message}`, { position: 'top-right', autoClose: 5000 });
      console.log('[Private Notification RECEIVED]', payload);
    };
    privateChannel
            .listen('.NewNotification', privateListener)
            .error((err: any) => {
                console.error(`[ECHO SUBSCRIPTION ERROR] Private Channel failed for ${userId}.`, err);
            });

    // --- Public channel ---
    const publicChannel = echo.channel('public');
    const publicListener = (payload: any) => {
      const message =
        payload.message ||
        payload.data?.message ||
        payload.notification ||
        JSON.stringify(payload);
      toast.info(`[Public] ${message}`, { position: 'top-right', autoClose: 5000 });
      console.log('[Public Notification RECEIVED]', payload);
    };
    publicChannel.listen('.NewNotification', publicListener);

    // --- Cleanup on unmount ---
    return () => {
        console.log('[Component] Cleanup complete.');
        echo.leaveChannel(`role.${userRole}`);
        echo.leaveChannel(`user.${userId}`);
        echo.leaveChannel('public');
    };
  }, [userId, userRole]);

  return null;
};

export default ToastContainer;
