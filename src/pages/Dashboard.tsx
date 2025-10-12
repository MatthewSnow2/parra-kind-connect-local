import { useState } from "react";
import Navigation from "@/components/Navigation";
import SkipNavigation from "@/components/SkipNavigation";
import Footer from "@/components/Footer";
import ChatInterface from "@/components/ChatInterface";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle2, AlertTriangle, MessageSquare, Bell, FileDown, UserPlus } from "lucide-react";

const Dashboard = () => {
  const { toast } = useToast();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(1);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    relationship: ""
  });

  // Mock data for senior profiles
  const seniors = [
    {
      name: "Margaret Smith",
      age: 78,
      lastCheckIn: "2 hours ago",
      status: "ok",
      mood: "happy",
      avatar: "MS"
    },
    {
      name: "Robert Johnson",
      age: 82,
      lastCheckIn: "5 hours ago",
      status: "warning",
      mood: "neutral",
      avatar: "RJ"
    },
    {
      name: "Dorothy Williams",
      age: 75,
      lastCheckIn: "12 hours ago",
      status: "alert",
      mood: "concerned",
      avatar: "DW"
    }
  ];

  // Daily summary feed
  const summaryFeed = [
    { date: "Oct 6", checkIn: "Good morning 😊", observation: "Normal", action: "—", status: "ok" },
    { date: "Oct 5", checkIn: "No bedtime check-in", observation: "Mild risk", action: "View", status: "warning" },
    { date: "Oct 4", checkIn: "Feeling dizzy", observation: "High alert", action: "Alert sent", status: "alert" }
  ];

  // Mood trend data
  const moodData = [
    { day: "Mon", mood: 8, activity: 7 },
    { day: "Tue", mood: 7, activity: 6 },
    { day: "Wed", mood: 9, activity: 8 },
    { day: "Thu", mood: 6, activity: 5 },
    { day: "Fri", mood: 8, activity: 7 },
    { day: "Sat", mood: 9, activity: 9 },
    { day: "Sun", mood: 8, activity: 8 }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case "ok": return "#C9EBC0";
      case "warning": return "#FFEBA1";
      case "alert": return "#FF8882";
      default: return "#C9EBC0";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "ok": return <CheckCircle2 className="h-5 w-5" />;
      case "warning": return <AlertTriangle className="h-5 w-5" />;
      case "alert": return <AlertCircle className="h-5 w-5" />;
      default: return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch(mood) {
      case "happy": return "🙂";
      case "neutral": return "😐";
      case "concerned": return "🙁";
      default: return "😐";
    }
  };

  const handleRequestReport = () => {
    toast({
      title: "Status Report Requested",
      description: "Your status report will be ready in a few moments and sent to your email.",
    });
  };

  const handleAcknowledgeAlert = () => {
    setAlertsCount(0);
    toast({
      title: "Alert Acknowledged",
      description: "All alerts have been marked as read.",
    });
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Family Member Added",
      description: `${newMember.name} has been added to your care circle.`,
    });
    
    setAddMemberOpen(false);
    setNewMember({ name: "", email: "", relationship: "" });
  };

  const handleExportSummary = () => {
    const csvContent = `Date,Check-in,Observation,Status\n${summaryFeed.map(item => 
      `${item.date},"${item.checkIn}",${item.observation},${item.status}`
    ).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '7-day-summary.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Summary Exported",
      description: "Your 7-day summary has been downloaded.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SkipNavigation />
      <Navigation />
      <main id="main-content" className="flex-1 pt-24 pb-12 bg-background" tabIndex={-1}>
        <div className="container mx-auto px-4">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-2" style={{ color: '#2F4733' }}>
              Caregiver Dashboard
            </h1>
            <p className="text-xl" style={{ color: 'rgba(47, 71, 51, 0.7)' }}>
              Family wellness at a glance
            </p>
          </div>

          {/* Senior Profile Cards */}
          <div
            className="grid md:grid-cols-3 gap-6 mb-8"
            role="region"
            aria-label="Senior care recipient profiles"
          >
            {seniors.map((senior, index) => (
              <Card
                key={index}
                className="p-6 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  backgroundColor: 'white'
                }}
                role="article"
                aria-labelledby={`senior-name-${index}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      className="h-12 w-12"
                      style={{ backgroundColor: getStatusColor(senior.status) }}
                      role="img"
                      aria-label={`${senior.name} avatar`}
                    >
                      <AvatarFallback style={{ color: '#2F4733' }} aria-hidden="true">
                        {senior.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3
                        id={`senior-name-${index}`}
                        className="font-heading font-bold text-lg"
                        style={{ color: '#2F4733' }}
                      >
                        {senior.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(47, 71, 51, 0.6)' }}>
                        Age {senior.age}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 px-3 py-1 rounded-full"
                    style={{ backgroundColor: getStatusColor(senior.status), color: '#2F4733' }}
                    role="status"
                    aria-label={`Health status: ${senior.status}`}
                  >
                    {getStatusIcon(senior.status)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'rgba(47, 71, 51, 0.7)' }}>Last check-in:</span>
                    <span className="text-sm font-medium" style={{ color: '#2F4733' }}>{senior.lastCheckIn}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: 'rgba(47, 71, 51, 0.7)' }}>Mood:</span>
                    <span className="text-2xl">{getMoodEmoji(senior.mood)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#C9EBC0' }}>
                      <div className="text-xs" style={{ color: '#2F4733' }}>Medication</div>
                      <div className="text-lg">✓</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ backgroundColor: '#C9EBC0' }}>
                      <div className="text-xs" style={{ color: '#2F4733' }}>Activity</div>
                      <div className="text-lg">✓</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ backgroundColor: senior.status === 'alert' ? '#FF8882' : '#C9EBC0' }}>
                      <div className="text-xs" style={{ color: '#2F4733' }}>Sleep</div>
                      <div className="text-lg">{senior.status === 'alert' ? '⚠' : '✓'}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Daily Summary Feed */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6" style={{ backgroundColor: 'white' }} role="region" aria-labelledby="summary-feed-heading">
                <h2 id="summary-feed-heading" className="text-2xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
                  Daily Summary Feed
                </h2>
                <div className="space-y-3">
                  {summaryFeed.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ 
                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                        borderLeft: `4px solid ${getStatusColor(item.status)}`
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium" style={{ color: '#2F4733' }}>{item.date}</span>
                          <Badge 
                            variant="outline" 
                            style={{ 
                              backgroundColor: getStatusColor(item.status),
                              color: '#2F4733',
                              borderColor: '#2F4733'
                            }}
                          >
                            {item.observation}
                          </Badge>
                        </div>
                        <p style={{ color: 'rgba(47, 71, 51, 0.8)' }}>{item.checkIn}</p>
                      </div>
                      {item.action !== "—" && (
                        <Button variant="outline" size="sm">
                          {item.action}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Mood Trend Chart */}
              <Card className="p-6" style={{ backgroundColor: 'white' }} role="region" aria-labelledby="mood-trends-heading">
                <h2 id="mood-trends-heading" className="text-2xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
                  Weekly Mood & Activity Trends
                </h2>
                 <ResponsiveContainer width="100%" height={300}>
                   <LineChart data={moodData}>
                     <CartesianGrid 
                       strokeDasharray="3 3" 
                       stroke="rgba(47, 71, 51, 0.3)"
                       strokeWidth={1}
                     />
                     <XAxis 
                       dataKey="day" 
                       stroke="#2F4733"
                       style={{ fontSize: '14px' }}
                     />
                     <YAxis 
                       stroke="#2F4733"
                       style={{ fontSize: '14px' }}
                     />
                     <Tooltip 
                       contentStyle={{ 
                         backgroundColor: 'white',
                         border: '2px solid #C9EBC0',
                         borderRadius: '8px',
                         fontSize: '16px'
                       }}
                     />
                     <Line 
                       type="monotone" 
                       dataKey="mood" 
                       stroke="#C9EBC0" 
                       strokeWidth={3}
                       name="Mood Score"
                       dot={{ fill: '#C9EBC0', r: 5 }}
                     />
                     <Line 
                       type="monotone" 
                       dataKey="activity" 
                       stroke="#FF8882" 
                       strokeWidth={3}
                       name="Activity Level"
                       dot={{ fill: '#FF8882', r: 5 }}
                     />
                   </LineChart>
                 </ResponsiveContainer>
                 
                 {/* Progress Indicators */}
                 <div className="mt-6 space-y-4">
                   <div>
                     <div className="flex justify-between mb-2">
                       <span className="text-base font-medium" style={{ color: '#2F4733' }}>
                         Overall Wellness
                       </span>
                       <span className="text-base" style={{ color: '#2F4733' }}>85%</span>
                     </div>
                     <Progress 
                       value={85} 
                       className="h-3"
                       style={{
                         background: 'linear-gradient(to right, hsl(108, 52%, 83%), hsl(130, 20%, 50%))'
                       }}
                     />
                   </div>
                   <div>
                     <div className="flex justify-between mb-2">
                       <span className="text-base font-medium" style={{ color: '#2F4733' }}>
                         Social Engagement
                       </span>
                       <span className="text-base" style={{ color: '#2F4733' }}>62%</span>
                     </div>
                     <Progress 
                       value={62} 
                       className="h-3"
                       style={{
                         background: 'linear-gradient(to right, hsl(3, 100%, 76%), hsl(2, 79%, 66%))'
                       }}
                     />
                   </div>
                 </div>
              </Card>
            </div>

            {/* Right Panel: Chat & Quick Actions */}
            <div className="space-y-6">
              <ChatInterface />

              <Card className="p-6" style={{ backgroundColor: 'white' }} role="region" aria-labelledby="caregiver-notes-heading">
                <h2 id="caregiver-notes-heading" className="text-xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
                  Caregiver Notes
                </h2>
                <label htmlFor="caregiver-notes-textarea" className="sr-only">
                  Caregiver notes and reminders
                </label>
                <Textarea
                  id="caregiver-notes-textarea"
                  placeholder="Add reminders (e.g., 'Doctor visit Tue')..."
                  className="mb-4 text-lg"
                  style={{ borderColor: '#C9EBC0', minHeight: '100px' }}
                  aria-label="Caregiver notes text area"
                />
                <Button className="w-full">
                  Save Note
                </Button>
              </Card>

              <Card className="p-6" style={{ backgroundColor: 'white' }} role="region" aria-labelledby="quick-actions-heading">
                <h2 id="quick-actions-heading" className="text-xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
                  Quick Actions
                </h2>
                <div className="space-y-3" role="group" aria-labelledby="quick-actions-heading">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-base h-12"
                    onClick={handleRequestReport}
                  >
                    <MessageSquare className="h-5 w-5" />
                    Request Status Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-base h-12 relative"
                    onClick={handleAcknowledgeAlert}
                  >
                    <Bell className="h-5 w-5" />
                    Acknowledge Alert
                    {alertsCount > 0 && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0"
                        style={{ backgroundColor: '#FF8882', color: '#2F4733' }}
                      >
                        {alertsCount}
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-base h-12"
                    onClick={() => setAddMemberOpen(true)}
                  >
                    <UserPlus className="h-5 w-5" />
                    Add Family Member
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-base h-12"
                    onClick={handleExportSummary}
                  >
                    <FileDown className="h-5 w-5" />
                    Export 7-day Summary
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Add Family Member Dialog */}
          <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Member</DialogTitle>
                <DialogDescription>
                  Add a new family member to your care circle. They will receive updates and be able to view care information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Input
                    id="relationship"
                    placeholder="e.g., Daughter, Son, Sibling"
                    value={newMember.relationship}
                    onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember}>
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
