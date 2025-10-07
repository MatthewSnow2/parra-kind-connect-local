import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle2, AlertTriangle, MessageSquare, Bell, FileDown, UserPlus } from "lucide-react";

const Dashboard = () => {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-24 pb-12 bg-background">
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
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {seniors.map((senior, index) => (
              <Card 
                key={index}
                className="p-6 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  backgroundColor: 'white'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12" style={{ backgroundColor: getStatusColor(senior.status) }}>
                      <AvatarFallback style={{ color: '#2F4733' }}>{senior.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-heading font-bold text-lg" style={{ color: '#2F4733' }}>
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
              <Card className="p-6" style={{ backgroundColor: 'white' }}>
                <h2 className="text-2xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
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
              <Card className="p-6" style={{ backgroundColor: 'white' }}>
                <h2 className="text-2xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
                  Weekly Mood & Activity Trends
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 71, 51, 0.1)" />
                    <XAxis dataKey="day" stroke="#2F4733" />
                    <YAxis stroke="#2F4733" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '2px solid #C9EBC0',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mood" 
                      stroke="#C9EBC0" 
                      strokeWidth={3}
                      name="Mood Score"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="activity" 
                      stroke="#FF8882" 
                      strokeWidth={3}
                      name="Activity Level"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Right Panel: Caregiver Notes & Quick Actions */}
            <div className="space-y-6">
              <Card className="p-6" style={{ backgroundColor: 'white' }}>
                <h2 className="text-xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
                  Caregiver Notes
                </h2>
                <Textarea 
                  placeholder="Add reminders (e.g., 'Doctor visit Tue')..."
                  className="mb-4"
                  style={{ borderColor: '#C9EBC0' }}
                />
                <Button className="w-full">
                  Save Note
                </Button>
              </Card>

              <Card className="p-6" style={{ backgroundColor: 'white' }}>
                <h2 className="text-xl font-heading font-bold mb-4" style={{ color: '#2F4733' }}>
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Request Status Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Bell className="h-4 w-4" />
                    Acknowledge Alert
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Family Member
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileDown className="h-4 w-4" />
                    Export 7-day Summary
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
