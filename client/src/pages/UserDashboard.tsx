import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { useWorkers } from "@/hooks/use-workers";
import { useAppointments, useCreateAppointment } from "@/hooks/use-appointments";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, Star, Calendar, Clock, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import type { User as UserType } from "@shared/schema";

export default function UserDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-muted/10">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-display font-bold">Hello, {user?.fullName} 👋</h1>
          <p className="text-muted-foreground">Find the right professional for your needs.</p>
        </div>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="find">Find Workers</TabsTrigger>
            <TabsTrigger value="appointments">My Appointments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="find" className="space-y-6">
            <FindWorkersSection />
          </TabsContent>
          
          <TabsContent value="appointments">
            <MyAppointmentsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FindWorkersSection() {
  const [pincode, setPincode] = useState("");
  const [type, setType] = useState<string>("");
  const { data: workers, isLoading } = useWorkers({ pincode, workerType: type === "all" ? undefined : type });

  return (
    <>
      {/* Search Bar */}
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 items-end md:items-center">
        <div className="flex-1 w-full space-y-2">
          <Label>Search by Pincode</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Enter pincode..." 
              className="pl-9"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 w-full space-y-2">
          <Label>Filter by Service</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="Plumber">Plumber</SelectItem>
              <SelectItem value="Electrician">Electrician</SelectItem>
              <SelectItem value="Carpenter">Carpenter</SelectItem>
              <SelectItem value="Cleaner">Cleaner</SelectItem>
              <SelectItem value="Painter">Painter</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="lg" className="w-full md:w-auto">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Results Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeletons
          Array(6).fill(0).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-muted" />
          ))
        ) : workers?.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-muted/30 rounded-xl">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">No workers found</h3>
            <p className="text-muted-foreground">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          workers?.map((worker: UserType) => (
            <WorkerCard key={worker.id} worker={worker} />
          ))
        )}
      </div>
    </>
  );
}

function WorkerCard({ worker }: { worker: UserType }) {
  const [open, setOpen] = useState(false);
  const createAppointment = useCreateAppointment();
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const handleBook = () => {
    createAppointment.mutate({
      workerId: worker.id,
      issueDescription: description,
      address: address,
    }, {
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 group overflow-hidden border-border/60">
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80" />
      <CardContent className="pt-0 -mt-12 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="w-24 h-24 rounded-xl border-4 border-card overflow-hidden shadow-sm bg-background">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.username}`} 
              alt={worker.fullName} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="mt-14">
            <Badge variant={worker.isAvailable ? "default" : "secondary"} className={worker.isAvailable ? "bg-green-500 hover:bg-green-600" : ""}>
              {worker.isAvailable ? "Available" : "Busy"}
            </Badge>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          <h3 className="font-bold text-xl">{worker.fullName}</h3>
          <p className="text-sm font-medium text-primary">{worker.workerType}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="w-3 h-3 mr-1" />
            {worker.pincode} • {worker.address}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm py-3 border-t border-b border-border/50 mb-4">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs">Visiting Charge</span>
            <span className="font-bold">₹{worker.visitingCharge}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground text-xs">Rating</span>
            <div className="flex items-center font-bold">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 mr-1" />
              4.8
            </div>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!worker.isAvailable}>
              {worker.isAvailable ? "Book Now" : "Currently Unavailable"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
              <DialogDescription>
                Request a service from {worker.fullName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Issue Description</Label>
                <Textarea 
                  placeholder="Describe what needs to be fixed..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input 
                  placeholder="Your address" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleBook} disabled={createAppointment.isPending}>
                {createAppointment.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MyAppointmentsSection() {
  const { data: appointments, isLoading } = useAppointments();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {appointments?.length === 0 ? (
        <Card className="p-12 text-center bg-muted/20 border-dashed">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-lg">No Appointments Yet</h3>
          <p className="text-muted-foreground">Book your first service professional today!</p>
        </Card>
      ) : (
        appointments?.map((apt: any) => (
          <Card key={apt.id} className="overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className={`w-full md:w-2 bg-gradient-to-b ${
                apt.status === 'completed' ? 'from-green-500 to-green-600' :
                apt.status === 'accepted' ? 'from-blue-500 to-blue-600' :
                apt.status === 'rejected' ? 'from-red-500 to-red-600' :
                'from-yellow-400 to-yellow-500'
              }`} />
              <div className="p-6 flex-1">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{apt.worker?.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{apt.worker?.workerType}</p>
                  </div>
                  <Badge className={`self-start ${
                    apt.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                    apt.status === 'accepted' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                    apt.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                    'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  }`}>
                    {apt.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Issue</p>
                    <p className="text-sm">{apt.issueDescription}</p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Location</p>
                    <p className="text-sm flex items-center">
                      <MapPin className="w-3 h-3 mr-1 opacity-70" />
                      {apt.address}
                    </p>
                  </div>
                </div>

                {apt.visitTime && (
                  <div className="flex items-center text-sm font-medium text-primary">
                    <Clock className="w-4 h-4 mr-2" />
                    Scheduled for: {format(new Date(apt.visitTime), "PPP p")}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
