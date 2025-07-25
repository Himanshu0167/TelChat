import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, Edit, BarChart3, Trash2, MoreVertical } from "lucide-react";

interface BotCardProps {
  bot: {
    id: number;
    name: string;
    username: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
  };
}

export function BotCard({ bot }: BotCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteBotMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/bots/${bot.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      toast({
        title: "Success",
        description: "Bot deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bot",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${bot.name}"? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await deleteBotMutation.mutateAsync();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const gradientClasses = [
    "from-primary to-secondary",
    "from-blue-500 to-cyan-500", 
    "from-red-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-purple-500 to-violet-500",
    "from-orange-500 to-red-500",
  ];
  
  const gradientClass = gradientClasses[bot.id % gradientClasses.length];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${gradientClass} rounded-lg flex items-center justify-center`}>
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{bot.name}</h3>
              <p className="text-sm text-gray-600">@{bot.username}</p>
              <div className="flex items-center mt-1">
                <Badge variant={bot.isActive ? "default" : "secondary"} className="mr-3">
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    bot.isActive ? "bg-green-400" : "bg-gray-400"
                  }`}></span>
                  {bot.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-xs text-gray-500">
                  Created {new Date(bot.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right mr-4">
              <p className="text-sm font-medium text-gray-900">0</p>
              <p className="text-xs text-gray-500">users today</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link href={`/bot-builder/${bot.id}`}>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Bot
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
