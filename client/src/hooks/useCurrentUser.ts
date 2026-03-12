import { useState, useEffect } from 'react';
import { getCognitoUser, getCognitoToken, cognitoSignOut, initializeCognito } from '../cognito';

interface CurrentUser {
  userId: string | null;
  email: string | null;
  username: string | null;
  displayName: string | null;
  dob: string | null;
  location: string | null;
  profilePicUrl: string | null;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    userId: null,
    email: null,
    username: null,
    displayName: null,
    dob: null,
    location: null,
    profilePicUrl: null
  });
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    initializeCognito();
    
    const loadUserData = async () => {
      const savedUserId = localStorage.getItem('currentUserId');
      const savedUserEmail = localStorage.getItem('currentUserEmail');
      const savedUsername = localStorage.getItem('currentUsername');
      const savedDisplayName = localStorage.getItem('currentDisplayName') || localStorage.getItem('currentUserName');
      const savedDob = localStorage.getItem('currentUserDob');
      const savedLocation = localStorage.getItem('currentUserLocation');
      const savedProfilePicUrl = localStorage.getItem('currentUserProfilePicUrl');
      
      setCurrentUser({
        userId: savedUserId,
        email: savedUserEmail,
        username: savedUsername,
        displayName: savedDisplayName,
        dob: savedDob,
        location: savedLocation,
        profilePicUrl: savedProfilePicUrl
      });

      if (savedUserId && savedUserEmail) {
        try {
          const token = await getCognitoToken();
          if (token) {
            const response = await fetch('/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.profile) {
                const profile = data.profile;
                // CRITICAL: Use the userId from the backend profile (which handles Identity Linking)
                // instead of the savedUserId (which might be the raw Google Sub)
                const effectiveUserId = profile.userId || savedUserId;
                
                updateUser(
                  effectiveUserId,
                  savedUserEmail,
                  profile.username || savedUserEmail,
                  profile.displayName,
                  profile.dob,
                  profile.location,
                  profile.profilePicUrl
                );
              } else {
                updateUser(savedUserId, savedUserEmail, null, savedDisplayName, savedDob, savedLocation, savedProfilePicUrl);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      
      setProfileChecked(true);
      setLoading(false);
    };

    loadUserData();
  }, []);

  const updateUser = (
    userId: string, 
    email: string, 
    username?: string | null, 
    displayName?: string | null,
    dob?: string | null,
    location?: string | null,
    profilePicUrl?: string | null
  ) => {
    localStorage.setItem('currentUserId', userId);
    localStorage.setItem('currentUserEmail', email);
    
    if (displayName) {
      localStorage.setItem('currentDisplayName', displayName);
      localStorage.setItem('currentUserName', displayName);
    } else {
      localStorage.removeItem('currentDisplayName');
      localStorage.removeItem('currentUserName');
    }
    
    if (username) {
      localStorage.setItem('currentUsername', username);
    } else {
      localStorage.setItem('currentUsername', email); // Fallback to email
    }

    if (dob) {
      localStorage.setItem('currentUserDob', dob);
    } else {
      localStorage.removeItem('currentUserDob');
    }

    if (location) {
      localStorage.setItem('currentUserLocation', location);
    } else {
      localStorage.removeItem('currentUserLocation');
    }

    if (profilePicUrl) {
      localStorage.setItem('currentUserProfilePicUrl', profilePicUrl);
    } else {
      localStorage.removeItem('currentUserProfilePicUrl');
    }
    
    setCurrentUser({ 
      userId, 
      email,
      username: username || null,
      displayName: displayName || null,
      dob: dob || null,
      location: location || null,
      profilePicUrl: profilePicUrl || null
    });
  };

  const updateProfile = (username: string, displayName: string, dob?: string | null, location?: string | null, profilePicUrl?: string | null) => {
    localStorage.setItem('currentUsername', username);
    localStorage.setItem('currentDisplayName', displayName);
    localStorage.setItem('currentUserName', displayName);
    if (dob) localStorage.setItem('currentUserDob', dob);
    if (location) localStorage.setItem('currentUserLocation', location);
    if (profilePicUrl) localStorage.setItem('currentUserProfilePicUrl', profilePicUrl);

    setCurrentUser(prev => ({
      ...prev,
      username,
      displayName,
      dob: dob !== undefined ? dob : prev.dob,
      location: location !== undefined ? location : prev.location,
      profilePicUrl: profilePicUrl !== undefined ? profilePicUrl : prev.profilePicUrl
    }));
  };

  const clearUser = async () => {
    try {
      await cognitoSignOut();
    } catch (error) {
      console.error('Error signing out from Cognito:', error);
    }
    
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentDisplayName');
    localStorage.removeItem('currentUserName');
    setCurrentUser({ 
      userId: null, 
      email: null,
      username: null,
      displayName: null
    });
  };

  const getUserDisplayName = () => {
    return currentUser.displayName || currentUser.username || currentUser.email || 'Anonymous User';
  };

  const getUsername = () => {
    return currentUser.username || null;
  };

  const hasUsername = () => {
    return !!currentUser.username;
  };

  const isLoggedIn = () => {
    return !!currentUser.userId && !!currentUser.email;
  };

  return {
    currentUser,
    loading,
    profileChecked,
    updateUser,
    updateProfile,
    clearUser,
    getUserDisplayName,
    getUsername,
    hasUsername,
    isLoggedIn
  };
}
