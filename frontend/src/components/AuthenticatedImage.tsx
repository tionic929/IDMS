import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Loader2, ImageOff } from 'lucide-react';

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    fallback?: React.ReactNode;
}

// Global cache for Object URLs to avoid re-fetching
const imageCache = new Map<string, string>();
// Global tracker for in-progress fetches to avoid simultaneous requests
const fetchPromises = new Map<string, Promise<string>>();

export const preloadImage = (src: string | null | undefined): Promise<string | null> => {
    if (!src) return Promise.resolve(null);

    // Return cached URL immediately
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src)!);
    }

    // If a fetch is already in progress, return its promise
    if (fetchPromises.has(src)) {
        return fetchPromises.get(src)!;
    }

    let fetchSrc = src;
    if (src.includes('/storage/')) {
        const storagePath = src.split('/storage/')[1];
        fetchSrc = `/proxy-image?path=${encodeURIComponent(storagePath)}`;
    }

    const fetchPromise = api.get(fetchSrc, {
        responseType: 'blob',
    }).then(response => {
        const objectUrl = URL.createObjectURL(response.data);
        imageCache.set(src, objectUrl);
        fetchPromises.delete(src);
        return objectUrl;
    }).catch(err => {
        console.error('Error preloading authenticated image:', err);
        fetchPromises.delete(src);
        throw err;
    });

    fetchPromises.set(src, fetchPromise);
    return fetchPromise;
};

const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ src, fallback, alt, className, ...props }) => {
    // Initialize immediately if cached
    const cachedUrl = src ? imageCache.get(src) : null;
    const [imgUrl, setImgUrl] = useState<string | null>(cachedUrl || null);
    const [loading, setLoading] = useState(!cachedUrl && !!src);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!src) {
            setLoading(false);
            return;
        }

        // If it's already cached from initial render or previous load
        if (imageCache.has(src)) {
            setImgUrl(imageCache.get(src)!);
            setLoading(false);
            setError(false);
            return;
        }

        let isMounted = true;

        const loadImg = async () => {
            try {
                if (isMounted) setLoading(true);
                if (isMounted) setError(false);

                const url = await preloadImage(src);
                if (isMounted && url) {
                    setImgUrl(url);
                }
            } catch (err) {
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadImg();

        return () => {
            isMounted = false;
        };
    }, [src]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center bg-slate-50 ${className}`}>
                <Loader2 className="w-8 h-8 text-primary/20 animate-spin" />
            </div>
        );
    }

    if (error || !imgUrl) {
        return fallback || (
            <div className={`flex flex-col items-center justify-center text-slate-300 bg-slate-50 ${className}`}>
                <ImageOff size={48} className="mb-2 opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-widest">Load Failed</p>
            </div>
        );
    }

    return (
        <img
            src={imgUrl}
            alt={alt}
            className={className}
            {...props}
        />
    );
};

export default AuthenticatedImage;
