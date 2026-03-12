import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { CheckCircle, X as XIcon, Loader2, Calendar, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCognitoToken } from '../cognito';

interface UserIdSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (username: string) => void;
}

export function UserIdSetupDialog({ isOpen, onClose, onSuccess }: UserIdSetupDialogProps) {
  const [username, setUsername] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Generate arrays for date selection
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => String(currentYear - i));

  // Construct full DOB string
  const dob = day && month && year ? `${year}-${month}-${day}` : '';

  useEffect(() => {
    const checkUsername = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        setUsernameMessage('');
        return;
      }

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        setUsernameAvailable(false);
        setUsernameMessage('Username must be 3-20 characters (letters, numbers, underscore only)');
        return;
      }

      setCheckingUsername(true);
      try {
        const response = await fetch(`/api/user/check-username/${username}`);
        const data = await response.json();
        
        setUsernameAvailable(data.available);
        setUsernameMessage(data.message);
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
        setUsernameMessage('');
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounceTimer = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [username]);

  const handleSave = async () => {
    if (!usernameAvailable) {
      toast({
        description: 'Please provide a valid username',
        variant: 'destructive'
      });
      return;
    }

    if (!dob) {
      toast({
        description: 'Please provide your date of birth',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      console.log('🔐 Getting Cognito ID token...');
      const idToken = await getCognitoToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }
      console.log('✅ ID token obtained');
      
      console.log('📤 Sending profile save request:', {
        username: username.toLowerCase(),
        dob: dob
      });
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            username: username.toLowerCase(),
            dob: dob
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status, response.statusText);
        
        // Get response text first to check if it's HTML or JSON
        const responseText = await response.text();
        console.log('📄 Response text:', responseText.substring(0, 200));
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('❌ Failed to parse response as JSON');
          throw new Error('Server returned an invalid response. Please try again.');
        }
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to save profile');
        }

        console.log('✅ Profile saved successfully:', data);
        
        toast({
          description: 'Profile created successfully!'
        });

        onSuccess(username.toLowerCase());
        onClose();
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ Request timed out after 30 seconds');
          throw new Error('Request timed out. Please check your connection and try again.');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      toast({
        description: error.message || 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" data-testid="dialog-userid-setup">
        <DialogClose 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none" 
          onClick={onClose} 
          data-testid="button-close-dialog"
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="text-dialog-title">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-dialog-description">
            Choose a unique username and provide your date of birth
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Username Section */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="label-username">
              Username
            </Label>
            <div className="relative">
              <Input
                id="username"
                data-testid="input-username"
                placeholder="e.g., crypto_trader"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="pr-10 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checkingUsername && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" data-testid="icon-checking" />
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <CheckCircle className="h-4 w-4 text-green-500" data-testid="icon-available" />
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <XIcon className="h-4 w-4 text-red-500" data-testid="icon-unavailable" />
                )}
              </div>
            </div>
            {usernameMessage && (
              <p 
                className={`text-xs ${usernameAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                data-testid="text-username-message"
              >
                {usernameMessage}
              </p>
            )}
          </div>

          {/* Date of Birth Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="label-dob">
              Date of Birth
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {/* Month */}
              <div>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger 
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                    data-testid="select-month"
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-h-[200px]">
                    {months.map((m) => (
                      <SelectItem 
                        key={m.value} 
                        value={m.value}
                        className="text-gray-900 dark:text-white"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day */}
              <div>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger 
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                    data-testid="select-day"
                  >
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-h-[200px]">
                    {days.map((d) => (
                      <SelectItem 
                        key={d} 
                        value={d}
                        className="text-gray-900 dark:text-white"
                      >
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year */}
              <div>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger 
                    className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                    data-testid="select-year"
                  >
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-h-[200px]">
                    {years.map((y) => (
                      <SelectItem 
                        key={y} 
                        value={y}
                        className="text-gray-900 dark:text-white"
                      >
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!usernameAvailable || !dob || saving}
            data-testid="button-save"
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
