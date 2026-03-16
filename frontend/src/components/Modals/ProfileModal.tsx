import React from 'react';
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { User, Shield, Mail, BadgeCheck, Camera, Loader2, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/api/axios";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, updateUser } = useAuth();
    const [isUploading, setIsUploading] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    
    // Form state
    const [formData, setFormData] = React.useState({
        name: '',
        email: ''
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Sync form data with user data when opening modal or user data changes
    React.useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || ''
            });
        }
    }, [user, isOpen]);

    const handlePhotoClick = () => {
        if (isUploading) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setIsUploading(true);
        // Inline loading state in avatar circle, removed toast as requested

        try {
            const response = await api.post("/user/avatar", uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.url) {
                updateUser({ avatar_url: response.data.url, avatar: response.data.avatar });
            }
        } catch (error) {
            console.error("Avatar upload failed:", error);
            toast.error("Failed to upload photo");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        setIsSaving(true);
        try {
            const response = await api.put("/user/profile", formData);
            if (response.data.user) {
                updateUser(response.data.user);
                setIsEditing(false);
                toast.success("Profile updated successfully!");
            }
        } catch (error: any) {
            console.error("Profile update failed:", error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || ''
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-background border-border shadow-2xl rounded-2xl p-0 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5 relative">
                    <div className="absolute -bottom-10 left-8">
                        <div 
                            onClick={handlePhotoClick}
                            className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-2xl font-black text-primary-foreground border-4 border-background shadow-xl cursor-pointer group/avatar relative overflow-hidden"
                        >
                            {isUploading ? (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                                </div>
                            ) : null}
                            
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                (user?.name || 'AD').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                            )}
                            
                            {!isUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                    <Camera className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                    </div>
                </div>

                <div className="p-8 pt-14 space-y-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            User Profile
                            <BadgeCheck className="w-5 h-5 text-primary" />
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                            {isEditing ? "Update your personal information below." : "Manage your account information and preferences."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input 
                                    disabled={!isEditing || isSaving}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="pl-10 h-11 bg-muted/30 border-border rounded-xl font-bold text-sm focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input 
                                    disabled={!isEditing || isSaving}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter your email"
                                    className="pl-10 h-11 bg-muted/30 border-border rounded-xl font-bold text-sm focus:ring-primary/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Access Level</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <div className="h-11 pl-10 flex items-center bg-primary/10 border border-primary/30 rounded-xl font-black text-[10px] text-primary uppercase tracking-[0.15em] shadow-sm">
                                    {user?.role || 'Administrator'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        {isEditing ? (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest border-border hover:bg-muted"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button 
                                    variant="outline" 
                                    onClick={onClose}
                                    className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest border-border hover:bg-muted"
                                >
                                    Close
                                </Button>
                                <Button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 h-11 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                >
                                    Edit Profile
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileModal;
