import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertBotSchema } from "@shared/schema";
import { z } from "zod";
import { useLocation } from "wouter";

const botCreationSchema = insertBotSchema.omit({ userId: true }).extend({
  token: z.string().min(1, "Bot token is required"),
});

type BotCreationData = z.infer<typeof botCreationSchema>;

interface BotCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BotCreationModal({ isOpen, onClose }: BotCreationModalProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<BotCreationData>({
    resolver: zodResolver(botCreationSchema),
    defaultValues: {
      name: "",
      token: "",
      description: "",
      isActive: true,
      menuStructure: {},
      settings: {},
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async (data: BotCreationData) => {
      console.log("Submitting bot data:", data);
      const response = await apiRequest("POST", "/api/bots", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create bot");
      }
      return response.json();
    },
    onSuccess: (bot) => {
      console.log("Bot created successfully:", bot);
      queryClient.invalidateQueries({ queryKey: ["/api/bots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Bot created successfully!",
      });
      onClose();
      form.reset();
      // Navigate to bot builder
      setLocation(`/bot-builder/${bot.id}`);
    },
    onError: (error: any) => {
      console.error("Bot creation failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create bot",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: BotCreationData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    setIsValidating(true);
    try {
      await createBotMutation.mutateAsync(data);
    } catch (error) {
      console.error("Mutation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    if (!createBotMutation.isPending && !isValidating) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="create-bot-description">
        <DialogHeader>
          <DialogTitle>Create New Bot</DialogTitle>
          <p id="create-bot-description" className="text-sm text-muted-foreground">
            Create a new Telegram bot by providing the bot token from @BotFather
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Bot" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BotFather Token</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" 
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    Get this from @BotFather on Telegram
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What does this bot do?" 
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleClose}
                disabled={createBotMutation.isPending || isValidating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={createBotMutation.isPending || isValidating}
                onClick={() => console.log("Submit button clicked")}
              >
                {createBotMutation.isPending || isValidating ? "Creating..." : "Create Bot"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
