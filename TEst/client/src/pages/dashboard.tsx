import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { BotCard } from "@/components/bot-card";
import { BotCreationModal } from "@/components/bot-creation-modal";
import { useAuth } from "@/lib/auth";
import { Bot, Users, MessageSquare, TrendingUp, Plus, Search, Book, Copy } from "lucide-react";
import { useLocation } from "wouter";
import type { Bot as BotType } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: auth } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Redirect if not authenticated
  if (!auth?.user) {
    setLocation("/login");
    return null;
  }

  const { data: bots = [], isLoading: botsLoading } = useQuery<BotType[]>({
    queryKey: ["/api/bots"],
  });

  const { data: stats } = useQuery<{
    totalBots: number;
    activeBots: number;
    totalMessages: number;
    totalUsers: number;
    activeUsers: number;
    messagesToday: number;
    successRate: string;
    messagesSent: number;
    newUsers: number;
    uptime: string;
    storageUsed: string;
    storagePercentage: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const filteredBots = bots.filter((bot: BotType) => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && bot.isActive) ||
                         (statusFilter === "inactive" && !bot.isActive);
    return matchesSearch && matchesStatus;
  });

  const quickStats = [
    {
      title: "Total Bots",
      value: stats?.totalBots || bots.length,
      icon: Bot,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Users",
      value: stats?.activeUsers || "0",
      icon: Users,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Messages Today",
      value: stats?.messagesToday || "0",
      icon: MessageSquare,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Success Rate",
      value: stats?.successRate || "100%",
      icon: TrendingUp,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  const recentActivities = [
    {
      message: "No recent activity",
      time: "Just now",
      color: "bg-gray-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Welcome back, {auth.user.firstName || auth.user.username}! 👋
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your Telegram bots and create amazing automated experiences.
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create New Bot
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bot List Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Bots</CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Input
                        placeholder="Search bots..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {botsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredBots.length === 0 ? (
                  <div className="text-center py-12">
                    <Bot className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">No bots found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {bots.length === 0 ? "Get started by creating your first bot." : "No bots match your search criteria."}
                    </p>
                    {bots.length === 0 && (
                      <Button onClick={() => setIsModalOpen(true)} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Bot
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBots.map((bot: any) => (
                      <BotCard key={bot.id} bot={bot} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full justify-start bg-primary hover:bg-primary/90"
                >
                  <Plus className="mr-3 h-4 w-4" />
                  Create New Bot
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Copy className="mr-3 h-4 w-4" />
                  Browse Templates
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Book className="mr-3 h-4 w-4" />
                  Documentation
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 ${activity.color} rounded-full mt-2`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Messages Sent</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats?.messagesSent || "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Users</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats?.newUsers || "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-semibold text-green-600">
                    {stats?.uptime || "100%"}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Storage Used</span>
                    <span className="font-semibold text-gray-900">
                      {stats?.storageUsed || "0 MB"} / 1 GB
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${stats?.storagePercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BotCreationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
