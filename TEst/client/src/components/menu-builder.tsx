import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GripVertical, Edit, Trash2 } from "lucide-react";

interface MenuBuilderProps {
  bot: any;
  menuStructure: any;
  onMenuStructureChange: (structure: any) => void;
}

interface MenuItem {
  id: string;
  text: string;
  type: 'text' | 'image' | 'submenu';
  content?: string;
  imageUrl?: string;
  children?: { [key: string]: MenuItem };
}

export function MenuBuilder({ bot, menuStructure, onMenuStructureChange }: MenuBuilderProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (bot.menuStructure && Object.keys(menuStructure).length === 0) {
      onMenuStructureChange(bot.menuStructure);
    }
  }, [bot.menuStructure, menuStructure, onMenuStructureChange]);

  const addMenuItem = (parentId?: string) => {
    const newId = `item_${Date.now()}`;
    const newItem: MenuItem = {
      id: newId,
      text: "New Menu Item",
      type: "text",
      content: "Hello! This is a new menu item.",
    };

    const updatedStructure = { ...menuStructure };
    if (parentId) {
      // Add to submenu
      const parentItem = findMenuItem(updatedStructure, parentId);
      if (parentItem) {
        if (!parentItem.children) {
          parentItem.type = 'submenu';
          parentItem.children = {};
        }
        parentItem.children[newId] = newItem;
      }
    } else {
      // Add to root level
      updatedStructure[newId] = newItem;
    }

    onMenuStructureChange(updatedStructure);
    setSelectedItem(newId);
    setEditingItem(newItem);
  };

  const deleteMenuItem = (itemId: string) => {
    const updatedStructure = { ...menuStructure };
    deleteItemRecursively(updatedStructure, itemId);
    onMenuStructureChange(updatedStructure);
    if (selectedItem === itemId) {
      setSelectedItem(null);
      setEditingItem(null);
    }
  };

  const deleteItemRecursively = (structure: any, itemId: string) => {
    if (structure[itemId]) {
      delete structure[itemId];
      return true;
    }
    
    for (const key in structure) {
      if (structure[key].children) {
        if (deleteItemRecursively(structure[key].children, itemId)) {
          return true;
        }
      }
    }
    return false;
  };

  const findMenuItem = (structure: any, itemId: string): MenuItem | null => {
    if (structure[itemId]) {
      return structure[itemId];
    }
    
    for (const key in structure) {
      if (structure[key].children) {
        const found = findMenuItem(structure[key].children, itemId);
        if (found) return found;
      }
    }
    return null;
  };

  const updateMenuItem = (updatedItem: MenuItem) => {
    const updatedStructure = { ...menuStructure };
    updateItemRecursively(updatedStructure, updatedItem.id, updatedItem);
    onMenuStructureChange(updatedStructure);
    setEditingItem(updatedItem);
  };

  const updateItemRecursively = (structure: any, itemId: string, updatedItem: MenuItem) => {
    if (structure[itemId]) {
      structure[itemId] = { ...updatedItem };
      return true;
    }
    
    for (const key in structure) {
      if (structure[key].children) {
        if (updateItemRecursively(structure[key].children, itemId, updatedItem)) {
          return true;
        }
      }
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const isSelected = selectedItem === item.id;
    
    return (
      <div key={item.id} className="space-y-2">
        <div
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
            isSelected 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 bg-white hover:shadow-sm"
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => {
            setSelectedItem(item.id);
            setEditingItem(item);
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">{item.text}</span>
              {item.type === 'submenu' && (
                <span className="text-xs text-gray-500">({Object.keys(item.children || {}).length} items)</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMenuItem(item.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
        
        {item.children && Object.values(item.children).map((child: any) => 
          renderMenuItem(child, depth + 1)
        )}
        
        {item.type === 'submenu' && (
          <Button
            variant="outline"
            size="sm"
            className="ml-4"
            style={{ marginLeft: `${(depth + 1) * 20}px` }}
            onClick={() => addMenuItem(item.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sub-item
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Menu Structure Panel */}
      <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Menu Structure</h3>
          <Button onClick={() => addMenuItem()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
        
        <div className="space-y-2">
          {Object.keys(menuStructure).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No menu items yet</p>
              <Button onClick={() => addMenuItem()}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Menu Item
              </Button>
            </div>
          ) : (
            Object.values(menuStructure).map((item: any) => renderMenuItem(item))
          )}
        </div>
      </div>

      {/* Content Editor Panel */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingItem ? "Edit Menu Item" : "Select a menu item to edit"}
        </h3>
        
        {editingItem ? (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <Input
                  value={editingItem.text}
                  onChange={(e) => updateMenuItem({ ...editingItem, text: e.target.value })}
                  placeholder="📞 Contact Support"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Type
                </label>
                <Select
                  value={editingItem.type}
                  onValueChange={(value: 'text' | 'image' | 'submenu') => 
                    updateMenuItem({ ...editingItem, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Message</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="submenu">Submenu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {editingItem.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Content
                  </label>
                  <Textarea
                    rows={4}
                    value={editingItem.content || ''}
                    onChange={(e) => updateMenuItem({ ...editingItem, content: e.target.value })}
                    placeholder="Hello! How can we help you today?"
                  />
                </div>
              )}
              
              {editingItem.type === 'image' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image URL
                    </label>
                    <Input
                      value={editingItem.imageUrl || ''}
                      onChange={(e) => updateMenuItem({ ...editingItem, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption (Optional)
                    </label>
                    <Textarea
                      rows={3}
                      value={editingItem.content || ''}
                      onChange={(e) => updateMenuItem({ ...editingItem, content: e.target.value })}
                      placeholder="Image caption..."
                    />
                  </div>
                </>
              )}
              
              {editingItem.type === 'submenu' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submenu Message
                  </label>
                  <Textarea
                    rows={3}
                    value={editingItem.content || ''}
                    onChange={(e) => updateMenuItem({ ...editingItem, content: e.target.value })}
                    placeholder="Please choose an option:"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This message will be shown when users enter this submenu.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Select a menu item from the left to start editing
          </div>
        )}
      </div>
    </div>
  );
}
