import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/use-appointments";
import { useToggleAvailability } from "@/hooks/use-workers";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, MapPin, Clock, Phone, User as UserIcon } from "lucide-react";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const toggleAvailability = useToggleAvailability();
  
  return (
    <div className="min-h-screen bg-muted/10">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Worker Portal</h1>
            <p className="text-muted-foreground">Manage your jobs and availability.</p>
          </div>
          
          <Card className="border-none shadow-md">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="font-bold text-sm">Availability Status</span>
                <span className={`text-xs ${user?.isAvailable ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {user?.isAvailable ? "You are online" : "You are offline"}
                </span>
              </div>
              <Switch 
                checked={user?.isAvailable} 
                onCheckedChange={(checked) => toggleAvailability.mutate({ isAvailable: checked })}
              />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="pending">New Requests</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Jobs</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <AppointmentList status="pending" />
          </TabsContent>
          <TabsContent value="scheduled">
            <AppointmentList status="accepted" />
          </TabsContent>
          <TabsContent value="history">
            <AppointmentList status="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AppointmentList({ status }: { status: "pending" | "accepted" | "completed" }) {
  const { data: appointments, isLoading } = useAppointments();
  
  // Filter appointments client-side for simplicity (API returns all user-relevant ones)
  // In a real app, backend would filter or we filter the array here
  // Note: Backend /api/appointments returns all for the logged in user/worker
  const filtered = appointments?.filter((apt: any) => 
    status === 'history' 
      ? ['completed', 'rejected'].includes(apt.status) 
      : apt.status === status
  ) || [];

  if (isLoading) return <div>Loading...</div>;
  if (filtered.length === 0) return (
    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
      <p className="text-muted-foreground">No appointments found in this category.</p>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((apt: any) => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: any }) {
  const updateStatus = useUpdateAppointmentStatus();
  const [visitTime, setVisitTime] = useState("");
  const [open, setOpen] = useState(false);

  const handleAccept = () => {
    // Need visit time to accept
    if (!visitTime) return;
    updateStatus.mutate({ 
      id: appointment.id, 
      status: "accepted", 
      visitTime: new Date(visitTime).toISOString() 
    });
    setOpen(false);
  };

  const handleComplete = () => {
    updateStatus.mutate({ id: appointment.id, status: "completed" });
  };

  const handleReject = () => {
    updateStatus.mutate({ id: appointment.id, status: "rejected" });
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base">{appointment.user?.fullName}</CardTitle>
              <CardDescription className="text-xs">{appointment.user?.mobile}</CardDescription>
            </div>
          </div>
          <Badge variant={appointment.status === 'pending' ? 'outline' : 'default'}>
            {appointment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/40 p-3 rounded-lg space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <span>{appointment.address}</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="font-medium shrink-0">Issue:</div>
            <span className="text-muted-foreground">{appointment.issueDescription}</span>
          </div>
        </div>
        
        {appointment.visitTime && (
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <Clock className="w-4 h-4" />
            {format(new Date(appointment.visitTime), "PPP p")}
          </div>
        )}

        {appointment.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">Accept</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Visit</DialogTitle>
                  <DialogDescription>When can you visit this customer?</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label>Visit Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={visitTime} 
                    onChange={(e) => setVisitTime(e.target.value)} 
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAccept} disabled={!visitTime}>Confirm Schedule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" className="flex-1" onClick={handleReject}>Reject</Button>
          </div>
        )}

        {appointment.status === 'accepted' && (
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleComplete}>
            Mark as Completed
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
