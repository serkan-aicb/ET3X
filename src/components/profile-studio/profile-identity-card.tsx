"use client";

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  GraduationCap,
  Plus,
  X,
  Check,
  Mail
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileIdentityCardProps {
  userId: string;
  userName: string;
  email?: string;
  realName?: string;
  avatarUrl?: string;
  headline?: string;
  institution?: string;
  location?: string;
  classYear?: string;
  topSkills?: string[];
  isVerified?: boolean;
  onProfileUpdate?: (updates: Partial<ProfileData>) => void;
}

interface ProfileData {
  fullName: string;
  headline: string;
  institution: string;
  location: string;
  classYear: string;
  avatarUrl?: string;
  realName?: string;
}

export function ProfileIdentityCard({
  userId,
  userName,
  email,
  realName,
  avatarUrl,
  headline: initialHeadline = '',
  institution: initialInstitution = '',
  location: initialLocation = '',
  classYear: initialClassYear = '',
  topSkills = [],
  isVerified = false,
  onProfileUpdate
}: ProfileIdentityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: realName || userName,
    headline: initialHeadline,
    institution: initialInstitution,
    location: initialLocation,
    classYear: initialClassYear,
    realName: realName || '',
  });

  const [editData, setEditData] = useState<ProfileData>(profileData);

  const handleEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profileData);
  };

  const handleSave = () => {
    setProfileData(editData);
    setIsEditing(false);
    onProfileUpdate?.(editData);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onProfileUpdate?.({ avatarUrl: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  if (isEditing) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar with upload */}
          <div className="relative shrink-0">
            <Avatar className="h-28 w-28 border-4 border-border">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback className="bg-blue-500/20 text-blue-400 text-2xl font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleImageClick}
              disabled={isUploading}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
            >
              <Camera className="h-5 w-5 text-primary-foreground" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Edit Form */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
              <Input
                value={editData.fullName}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Headline</label>
              <Input
                value={editData.headline}
                onChange={(e) => setEditData({ ...editData, headline: e.target.value })}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                placeholder="e.g., Data Analyst | Turning Data into Decisions"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Institution</label>
                <Input
                  value={editData.institution}
                  onChange={(e) => setEditData({ ...editData, institution: e.target.value })}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="University or Company"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Class/Cohort</label>
                <Input
                  value={editData.classYear}
                  onChange={(e) => setEditData({ ...editData, classYear: e.target.value })}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  placeholder="e.g., Class of 2026"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Location</label>
              <Input
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                placeholder="City, State/Country"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="border-border text-muted-foreground hover:bg-accent"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-start space-x-6">
        {/* Avatar */}
        <div className="relative shrink-0 group">
          <Avatar className="h-28 w-28 border-4 border-border">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-2xl font-bold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={handleImageClick}
            className="absolute inset-0 bg-muted/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="h-6 w-6 text-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Identity Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-foreground">{profileData.fullName || userName}</h1>
            {isVerified && (
              <CheckCircle2 className="h-5 w-5 text-blue-400 fill-blue-400/20" />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleEdit}
              className="text-muted-foreground hover:text-foreground"
            >
              Edit
            </Button>
          </div>

          {profileData.headline ? (
            <p className="text-foreground font-medium">{profileData.headline}</p>
          ) : (
            <button
              onClick={handleEdit}
              className="text-primary text-sm hover:underline flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Add headline</span>
            </button>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {email && (
              <div className="flex items-center space-x-1.5">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </div>
            )}
            {profileData.institution && (
              <div className="flex items-center space-x-1.5">
                <Building2 className="h-4 w-4" />
                <span>{profileData.institution}</span>
              </div>
            )}
            {profileData.classYear && (
              <div className="flex items-center space-x-1.5">
                <GraduationCap className="h-4 w-4" />
                <span>{profileData.classYear}</span>
              </div>
            )}
            {profileData.location && (
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-4 w-4" />
                <span>{profileData.location}</span>
              </div>
            )}
          </div>

          {/* Skill Tags */}
          {topSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {topSkills.slice(0, 5).map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-primary/10 text-primary border border-primary/20 font-normal"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
