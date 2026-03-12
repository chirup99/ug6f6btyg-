import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { 
  User, 
  Edit, 
  LogOut, 
  Settings, 
  Users, 
  UserPlus, 
  Loader2, 
  CheckCircle, 
  MapPin,
  Share2,
  Copy
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/use-toast';
import { getCognitoToken, cognitoSignOut } from '@/cognito';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface UserProfile {
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  location?: string;
  followers?: number;
  following?: number;
  dob?: string;
  avatar?: string;
}

export function UserProfileDropdown() {
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [editedDob, setEditedDob] = useState('');

  const fetchLocationSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setLocationSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: ['user-profile-dropdown', currentUser.email],
    queryFn: async () => {
      if (!currentUser.email) return null;
      
      const idToken = await getCognitoToken();
      if (!idToken) return null;

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Fetch stats to get accurate counts
          let followers = data.profile.followersCount ?? data.profile.followers ?? 0;
          let following = data.profile.followingCount ?? data.profile.following ?? 0;
          
          try {
            const statsResponse = await fetch(`/api/profile/${data.profile.username}/stats`);
            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              followers = statsData.followersCount ?? statsData.followers ?? followers;
              following = statsData.followingCount ?? statsData.following ?? following;
            }
          } catch (e) {
            console.error('Error fetching stats in dropdown:', e);
          }

          return {
            username: data.profile.username || currentUser.email?.split('@')[0] || 'user',
            displayName: data.profile.displayName || currentUser.email?.split('@')[0] || 'User',
            email: data.profile.email || currentUser.email || '',
            bio: data.profile.bio || '',
            location: data.profile.location || '',
            followers,
            following,
            dob: data.profile.dob,
            avatar: data.profile.profilePicUrl || ''
          };
        }
      }
      return null;
    },
    enabled: !!currentUser.email,
    staleTime: 30000, // Reduced staleTime to catch updates faster
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (profile) {
      setEditedBio(profile.bio || '');
      setEditedDisplayName(profile.displayName || '');
      setEditedLocation(profile.location || '');
      setEditedDob(profile.dob || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!editedDisplayName.trim()) {
      toast({
        description: 'Display name cannot be empty',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const idToken = await getCognitoToken();
      if (!idToken) throw new Error('Not authenticated');

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          displayName: editedDisplayName.trim(),
          bio: editedBio.trim(),
          location: editedLocation.trim(),
          dob: editedDob
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      queryClient.setQueryData(['user-profile-dropdown', currentUser.email], (prev: UserProfile | null) => prev ? {
        ...prev,
        displayName: editedDisplayName.trim(),
        bio: editedBio.trim(),
        location: editedLocation.trim(),
        dob: editedDob
      } : null);

      setIsEditing(false);
      toast({
        description: 'Profile updated successfully!'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('currentUserEmail');
      localStorage.removeItem('currentUsername');
      localStorage.removeItem('currentDisplayName');
      localStorage.removeItem('currentUserName');
      
      await cognitoSignOut();
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        description: 'Failed to logout',
        variant: 'destructive'
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
  const username = profile?.username || currentUser.username || currentUser.email?.split('@')[0] || 'user';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
            data-testid="button-profile-avatar"
          >
            <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-600">
              {profile?.avatar ? (
                <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                  {getInitials(displayName)}
                </AvatarFallback>
              )}
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-80 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          align="end"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-start gap-3 py-2">
              <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-600">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{username}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    const profileUrl = `${window.location.origin}/profile/${username}`;
                    if (navigator.share) {
                      navigator.share({
                        title: `${displayName}'s Profile`,
                        url: profileUrl
                      }).catch(() => {});
                    }
                  }}
                  title="Share Profile"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    const profileUrl = `${window.location.origin}/profile/${username}`;
                    navigator.clipboard.writeText(profileUrl);
                    toast({
                      title: "Link Copied",
                      description: "Profile link copied to clipboard",
                    });
                  }}
                  title="Copy Profile Link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {profile?.bio && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                {profile.bio}
              </p>
            )}
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.following || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {profile?.followers || 0}
                </span>
                <span className="text-gray-500 dark:text-gray-400">Followers</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showProfileDialog} onOpenChange={(open) => {
        setShowProfileDialog(open);
        if (!open) {
          setIsEditing(false);
          setEditedBio(profile?.bio || '');
          setEditedDisplayName(profile?.displayName || '');
          setEditedLocation(profile?.location || '');
        }
      }}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Profile' : 'Profile'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
              {isEditing ? 'Update your profile information' : 'Your profile details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-4 border-gray-200 dark:border-gray-600">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-2xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display Name
              </Label>
              {isEditing ? (
                <Input
                  value={editedDisplayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  placeholder="Your display name"
                  data-testid="input-display-name"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">
                  {profile?.displayName || 'Not set'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of Birth
              </Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedDob}
                  onChange={(e) => setEditedDob(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  data-testid="input-dob"
                />
              ) : (
                <p className="text-gray-900 dark:text-white font-medium">
                  {profile?.dob || 'Not set'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </Label>
              {isEditing ? (
                <div className="relative">
                  <Input
                    value={editedLocation}
                    onChange={(e) => {
                      setEditedLocation(e.target.value);
                      fetchLocationSuggestions(e.target.value);
                    }}
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 pr-10"
                    placeholder="Where are you based?"
                    data-testid="input-location"
                  />
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                  {locationSuggestions.length > 0 && (
                    <div className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                      {locationSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b last:border-0 border-gray-100 dark:border-gray-700"
                          onClick={() => {
                            setEditedLocation(suggestion.display_name);
                            setLocationSuggestions([]);
                            // Reset suggestions explicitly to hide dropdown
                            setIsSearchingLocation(false);
                          }}
                        >
                          {suggestion.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{profile?.location || 'Not set'}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </Label>
              <p className="text-gray-600 dark:text-gray-400">@{username}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </Label>
              {isEditing ? (
                <Textarea
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 min-h-[100px]"
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                  data-testid="textarea-bio"
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {profile?.bio || 'No bio added yet'}
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {editedBio.length}/200
                </p>
              )}
            </div>

            <div className="flex gap-6 py-4 border-t border-b border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.following || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Following</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile?.followers || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedBio(profile?.bio || '');
                    setEditedDisplayName(profile?.displayName || '');
                    setEditedLocation(profile?.location || '');
                  }}
                  className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-save-profile"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
