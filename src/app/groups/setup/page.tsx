'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { KidsFirstLogo } from '@/components/icons';
import { Loader2, Users, Plus, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GroupSetupPage() {
  const { user, loading, createGroup, joinGroup, groupId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if(!user){
    router.replace('/login');
    return null;
  }
  
  if(groupId){
    router.replace('/');
    return null;
  }

  const handleCreateGroup = async () => {
    if (!user) return;
    if (!groupName.trim()) {
        setError('Please enter a name for your group.');
        return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const newGroupId = await createGroup(user.uid, groupName);
      toast({
        title: 'Group Created!',
        description: `Your new group code is: ${newGroupId}. Share it with the other parent.`,
      });
      router.push('/');
    } catch (e) {
      console.error(e);
      setError('Failed to create group. Please try again.');
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) return;
     if (!joinCode.trim()) {
        setError('Please enter a group code to join.');
        return;
    }
    setIsJoining(true);
    setError(null);
    try {
      const success = await joinGroup(user.uid, joinCode.trim().toUpperCase());
      if (success) {
        toast({
          title: 'Successfully Joined Group!',
          description: 'You are now ready to view the shared schedule.',
        });
        router.push('/');
      } else {
        setError('Invalid group code. Please check the code and try again.');
        setIsJoining(false);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to join group. Please try again.');
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-8">
            <KidsFirstLogo className="w-16 h-16 mb-4" />
             <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-[#FF8C00] via-[#E2583E] to-[#F472D0] text-transparent bg-clip-text">
                Set Up Your Family Group
            </h1>
            <p className="text-muted-foreground mt-2 text-center">To share a schedule, you need to be in a group with the other parent.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/20 p-2 rounded-full">
                            <Plus className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Create a New Group</CardTitle>
                    </div>
                    <CardDescription>Start a new schedule. You'll get a unique code to invite the other parent.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                        <label htmlFor="groupName" className="text-sm font-medium">Group Name</label>
                        <Input 
                            id="groupName"
                            placeholder="e.g., The Smith Kids" 
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleCreateGroup} disabled={isCreating || !groupName.trim()} className="w-full mt-4">
                        {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create Group
                    </Button>
                </CardContent>
            </Card>

            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/20 p-2 rounded-full">
                            <LogIn className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle>Join an Existing Group</CardTitle>
                    </div>
                    <CardDescription>If the other parent has already created a group, enter the code they shared with you.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                     <div className="space-y-2">
                        <label htmlFor="joinCode" className="text-sm font-medium">Group Code</label>
                        <Input
                            id="joinCode"
                            placeholder="Enter 6-digit code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            maxLength={6}
                        />
                    </div>
                    <Button onClick={handleJoinGroup} disabled={isJoining || !joinCode.trim()} className="w-full mt-4">
                         {isJoining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Join Group
                    </Button>
                </CardContent>
            </Card>
        </div>
         {error && <p className="text-destructive text-center mt-6">{error}</p>}
      </div>
    </div>
  );
}
