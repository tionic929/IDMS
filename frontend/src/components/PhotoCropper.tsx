import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface PhotoCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

const PhotoCropper: React.FC<PhotoCropperProps> = ({ image, onCropComplete, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: any) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    const img = await createImage(image);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Fixed 2x2 output (e.g., 600x600px for high quality)
    canvas.width = 600;
    canvas.height = 800;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      800,
      600
    );

    onCropComplete(canvas.toDataURL('image/jpeg'));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-xl h-[500px] bg-slate-900 rounded-2xl overflow-hidden">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={3 / 4} // Forced 2x2 Ratio
          onCropChange={onCropChange}
          onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          onZoomChange={onZoomChange}
        />
      </div>
      <div className="mt-6 flex gap-4 w-full max-w-xl">
        <input 
          type="range" value={zoom} min={1} max={3} step={0.1}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-teal-500"
        />
        <button onClick={onClose} className="px-6 py-2 text-white font-bold uppercase text-xs">Cancel</button>
        <button onClick={getCroppedImg} className="px-8 py-2 bg-teal-500 text-white rounded-xl font-bold uppercase text-xs">Apply Crop</button>
      </div>
    </div>
  );
};

export default PhotoCropper;