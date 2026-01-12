import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockDevices, mockAssets } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Lock, Monitor, Package } from "lucide-react";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState({ username: user?.username || "", email: user?.email || "" });
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });

  const userDevices = mockDevices.filter((d) => d.assignedUserId === user?.id);
  const userAssets = mockAssets.filter((a) => a.assignedUserId === user?.id);

  const handleUpdateProfile = () => {
    updateProfile({ username: profileData.username, email: profileData.email });
    toast({ title: "Profile Updated", description: "Your profile has been updated." });
  };

  const handleChangePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (passwordData.new.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    toast({ title: "Password Changed", description: "Your password has been updated." });
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings.</p>
      </div>

      <div className="flex items-center gap-4 p-6 bg-card rounded-lg border">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.username}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
          <Badge variant="outline" className="mt-1 capitalize">{user?.role}</Badge>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="assigned">My Devices & Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={profileData.username} onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
              </div>
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} />
              </div>
              <Button onClick={handleChangePassword}>Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> My Devices ({userDevices.length})</CardTitle></CardHeader>
            <CardContent>
              {userDevices.length > 0 ? (
                <div className="space-y-2">
                  {userDevices.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div><p className="font-medium">{d.name}</p><p className="text-sm text-muted-foreground">{d.serialNumber}</p></div>
                      <Badge variant="outline">{d.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No devices assigned.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> My Assets ({userAssets.length})</CardTitle></CardHeader>
            <CardContent>
              {userAssets.length > 0 ? (
                <div className="space-y-2">
                  {userAssets.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div><p className="font-medium">{a.name}</p><p className="text-sm text-muted-foreground">{a.assetTag}</p></div>
                      <Badge variant="outline">{a.category}</Badge>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No assets assigned.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
