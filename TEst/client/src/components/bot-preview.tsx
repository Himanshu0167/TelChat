import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface BotPreviewProps {
  bot: any;
  menuStructure: any;
}

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

export function BotPreview({ bot, menuStructure }: BotPreviewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: bot.settings?.welcomeMessage || 'Welcome! Please choose an option:',
      timestamp: new Date(),
    }
  ]);
  const [currentMenu, setCurrentMenu] = useState(menuStructure);
  const [menuStack, setMenuStack] = useState<any[]>([]);

  const addMessage = (type: 'bot' | 'user', content: string) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleButtonClick = (itemId: string, buttonText: string) => {
    // Add user message
    addMessage('user', buttonText);

    // Find the menu item
    const menuItem = currentMenu[itemId];
    if (!menuItem) return;

    // Add bot response
    setTimeout(() => {
      if (menuItem.type === 'text') {
        addMessage('bot', menuItem.content || 'No content available');
      } else if (menuItem.type === 'image') {
        addMessage('bot', `🖼️ [Image] ${menuItem.content || ''}`);
      } else if (menuItem.type === 'submenu' && menuItem.children) {
        addMessage('bot', menuItem.content || 'Choose an option:');
        // Navigate to submenu
        setMenuStack(prev => [...prev, currentMenu]);
        setCurrentMenu(menuItem.children);
      }
    }, 500);
  };

  const goBack = () => {
    if (menuStack.length > 0) {
      addMessage('user', '← Back');
      setTimeout(() => {
        const previousMenu = menuStack[menuStack.length - 1];
        setCurrentMenu(previousMenu);
        setMenuStack(prev => prev.slice(0, -1));
        addMessage('bot', 'Choose an option:');
      }, 300);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: bot.settings?.welcomeMessage || 'Welcome! Please choose an option:',
        timestamp: new Date(),
      }
    ]);
    setCurrentMenu(menuStructure);
    setMenuStack([]);
  };

  return (
    <div className="h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Bot Preview</h3>
        <Button variant="outline" size="sm" onClick={resetChat}>
          Reset Chat
        </Button>
      </div>
      
      {/* Mock Telegram Interface */}
      <Card className="max-w-sm mx-auto h-[600px] flex flex-col">
        {/* Chat Header */}
        <CardHeader className="bg-primary text-white p-4 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">{bot.name}</p>
              <p className="text-xs text-white/80">@{bot.username}</p>
            </div>
          </div>
        </CardHeader>
        
        {/* Chat Messages */}
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  message.type === 'user' 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {/* Menu Buttons */}
          {Object.keys(currentMenu).length > 0 && (
            <div className="space-y-2 pt-2">
              {Object.entries(currentMenu).map(([key, item]: [string, any]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                  onClick={() => handleButtonClick(key, item.text)}
                >
                  {item.text}
                </Button>
              ))}
              
              {/* Back button for submenus */}
              {menuStack.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-gray-500 text-white border-gray-500 hover:bg-gray-600"
                  onClick={goBack}
                >
                  ← Back
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {Object.keys(currentMenu).length === 0 && (
        <p className="text-center text-gray-500 mt-4 text-sm">
          No menu items configured
        </p>
      )}
    </div>
  );
}
