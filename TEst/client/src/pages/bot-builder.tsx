import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { MenuBuilder } from "@/components/menu-builder";
import { BotPreview } from "@/components/bot-preview";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Eye } from "lucide-react";
import type { Bot as BotType } from "@shared/schema";

export default function BotBuilder() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [menuStructure, setMenuStructure] = useState({});

  const { data: bot, isLoading } = useQuery<BotType>({
    queryKey: ["/api/bots", id],
    enabled: !!id,
  });

  const updateBotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/bots/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bots", id] });
      toast({
        title: "Success",
        description: "Bot updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bot",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Bot not found</h2>
            <Button onClick={() => setLocation("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateBotMutation.mutate({
      menuStructure,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Builder Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{bot?.name}</h1>
              <p className="text-sm text-gray-500">Menu Builder</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateBotMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateBotMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Builder Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Menu Builder Panel */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} border-r border-gray-200`}>
          <MenuBuilder 
            bot={bot}
            menuStructure={menuStructure}
            onMenuStructureChange={setMenuStructure}
          />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 bg-gray-100">
            <BotPreview 
              bot={bot}
              menuStructure={menuStructure}
            />
          </div>
        )}
      </div>
    </div>
  );
}
