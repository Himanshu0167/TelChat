interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
}

interface MenuStructure {
  [key: string]: {
    text: string;
    type: 'text' | 'image' | 'submenu';
    content?: string;
    imageUrl?: string;
    children?: MenuStructure;
  };
}

class TelegramService {
  private async makeRequest(token: string, method: string, data?: any) {
    const url = `https://api.telegram.org/bot${token}/${method}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    return response.json();
  }

  async validateBotToken(token: string): Promise<TelegramBotInfo | null> {
    try {
      const response = await this.makeRequest(token, 'getMe');
      if (response.ok) {
        return response.result;
      }
      return null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  async setWebhook(token: string, url: string): Promise<boolean> {
    try {
      const response = await this.makeRequest(token, 'setWebhook', { url });
      return response.ok;
    } catch (error) {
      console.error('Webhook setup error:', error);
      return false;
    }
  }

  async sendMessage(token: string, chatId: number, text: string, replyMarkup?: any) {
    console.log('Sending message:', { chatId, text, replyMarkup });
    return this.makeRequest(token, 'sendMessage', {
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    });
  }

  async sendPhoto(token: string, chatId: number, photo: string, caption?: string, replyMarkup?: any) {
    return this.makeRequest(token, 'sendPhoto', {
      chat_id: chatId,
      photo,
      caption,
      reply_markup: replyMarkup,
    });
  }

  async answerCallbackQuery(token: string, callbackQueryId: string, text?: string) {
    return this.makeRequest(token, 'answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  }

  private generateKeyboard(menuStructure: MenuStructure, currentPath: string = ''): any {
    const keyboard: any[][] = [];
    
    Object.entries(menuStructure).forEach(([key, item]) => {
      if (item && item.text) {
        // Ensure callback data is not too long (max 64 bytes)
        const callbackData = key.length > 60 ? key.substring(0, 60) : key;
        keyboard.push([{
          text: item.text,
          callback_data: callbackData,
        }]);
      }
    });

    // Add navigation buttons if not at root level
    if (currentPath && currentPath !== '') {
      const navButtons = [];
      
      // Go Back button
      const parentPath = currentPath.split('.').slice(0, -1).join('.');
      navButtons.push({
        text: "⬅️ Go Back",
        callback_data: parentPath || "main_menu"
      });
      
      // Main Menu button
      navButtons.push({
        text: "🏠 Main Menu", 
        callback_data: "main_menu"
      });
      
      keyboard.push(navButtons);
    }

    if (keyboard.length === 0) {
      return undefined;
    }

    return {
      inline_keyboard: keyboard,
    };
  }

  async handleUpdate(bot: any, update: TelegramUpdate) {
    const { storage } = await import('../storage');
    
    try {
      if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id.toString();
        const text = message.text || '';

        // Log interaction
        await storage.createBotInteraction({
          botId: bot.id,
          telegramUserId: userId,
          messageText: text,
          response: '',
        });

        // Handle /start command or show main menu
        if (text === '/start' || !bot.menuStructure || Object.keys(bot.menuStructure).length === 0) {
          const welcomeMessage = (bot.settings as any)?.welcomeMessage || 'Welcome! Please choose an option:';
          const menuStructure = bot.menuStructure || {};
          
          if (Object.keys(menuStructure).length > 0) {
            const keyboard = this.generateKeyboard(menuStructure, '');
            await this.sendMessage(bot.token, chatId, welcomeMessage, keyboard);
          } else {
            await this.sendMessage(bot.token, chatId, 'Hello! This bot is currently being configured. Please try again later.');
          }
        } else {
          // Handle text input - show main menu
          const menuStructure = bot.menuStructure || {};
          if (Object.keys(menuStructure).length > 0) {
            const keyboard = this.generateKeyboard(menuStructure, '');
            await this.sendMessage(bot.token, chatId, 'Please choose an option:', keyboard);
          } else {
            await this.sendMessage(bot.token, chatId, 'Thank you for your message! This bot is currently being configured.');
          }
        }

        // Update analytics
        await storage.updateBotAnalytics(bot.id, {
          messagesReceived: 1,
          activeUsers: 1,
        });

      } else if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message!.chat.id;
        const userId = callbackQuery.from.id.toString();
        const data = callbackQuery.data || '';

        await this.answerCallbackQuery(bot.token, callbackQuery.id);

        // Navigate through menu structure
        const menuStructure = bot.menuStructure || {};
        
        // Handle special navigation commands
        if (data === 'main_menu') {
          const welcomeMessage = (bot.settings as any)?.welcomeMessage || 'Main Menu - Please choose an option:';
          const keyboard = this.generateKeyboard(menuStructure, '');
          await this.sendMessage(bot.token, chatId, welcomeMessage, keyboard);
        } else {
          const menuItem = this.findMenuItem(menuStructure, data);

          if (menuItem) {
            if (menuItem.type === 'text') {
              // Show text content with navigation back to main menu
              const keyboard = this.generateKeyboard({}, 'main_menu');
              await this.sendMessage(bot.token, chatId, menuItem.content || 'No content available', keyboard);
            } else if (menuItem.type === 'image' && menuItem.imageUrl) {
              await this.sendPhoto(bot.token, chatId, menuItem.imageUrl, menuItem.content);
            } else if (menuItem.type === 'submenu' && menuItem.children) {
              const keyboard = this.generateKeyboard(menuItem.children, data);
              await this.sendMessage(bot.token, chatId, menuItem.content || 'Choose an option:', keyboard);
            }

            // Log interaction
            await storage.createBotInteraction({
              botId: bot.id,
              telegramUserId: userId,
              messageText: `Button: ${data}`,
              response: menuItem.content || '',
            });
          } else {
            // Unknown command, show main menu
            const keyboard = this.generateKeyboard(menuStructure, '');
            await this.sendMessage(bot.token, chatId, 'Sorry, I didn\'t understand that. Please choose from the menu:', keyboard);
          }
        }

        // Update analytics
        await storage.updateBotAnalytics(bot.id, {
          messagesSent: 1,
        });
      }
    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  private findMenuItem(menuStructure: MenuStructure, path: string): any {
    const parts = path.split('.');
    let current = menuStructure;
    
    for (const part of parts) {
      if (current[part]) {
        if (parts.indexOf(part) === parts.length - 1) {
          return current[part];
        }
        current = current[part].children || {};
      } else {
        return null;
      }
    }
    
    return current;
  }
}

export const telegramService = new TelegramService();
