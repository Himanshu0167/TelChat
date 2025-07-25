import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, GripVertical, Edit, Trash2, ArrowLeft, Home, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EnhancedMenuBuilderProps {
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

export function EnhancedMenuBuilder({ bot, menuStructure, onMenuStructureChange }: EnhancedMenuBuilderProps) {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const getCurrentMenu = () => {
    let current = menuStructure;
    for (const path of currentPath) {
      current = current[path]?.children || {};
    }
    return current;
  };

  const navigateToSubmenu = (itemId: string) => {
    setCurrentPath([...currentPath, itemId]);
  };

  const navigateBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
  };

  const navigateToRoot = () => {
    setCurrentPath([]);
  };

  const addMenuItem = (type: 'text' | 'submenu' = 'text') => {
    const newId = `item_${Date.now()}`;
    const newItem: MenuItem = {
      id: newId,
      text: "New Menu Item",
      type: type,
      content: type === 'submenu' ? "Choose an option:" : "Hello! This is a new menu item.",
      children: type === 'submenu' ? {} : undefined,
    };

    const updatedStructure = { ...menuStructure };
    let current = updatedStructure;
    
    // Navigate to current path
    for (const path of currentPath) {
      if (!current[path].children) current[path].children = {};
      current = current[path].children;
    }
    
    current[newId] = newItem;
    onMenuStructureChange(updatedStructure);
    setEditingItem(newItem);
    setIsAddingItem(false);
  };

  const updateMenuItem = (itemId: string, updates: Partial<MenuItem>) => {
    const updatedStructure = { ...menuStructure };
    let current = updatedStructure;
    
    // Navigate to current path
    for (const path of currentPath) {
      current = current[path].children;
    }
    
    current[itemId] = { ...current[itemId], ...updates };
    onMenuStructureChange(updatedStructure);
    setEditingItem(current[itemId]);
  };

  const deleteMenuItem = (itemId: string) => {
    const updatedStructure = { ...menuStructure };
    let current = updatedStructure;
    
    // Navigate to current path
    for (const path of currentPath) {
      current = current[path].children;
    }
    
    delete current[itemId];
    onMenuStructureChange(updatedStructure);
    setEditingItem(null);
  };

  const currentMenu = getCurrentMenu();
  const currentMenuItem = currentPath.length > 0 ? 
    currentPath.reduce((acc, path) => acc?.[path], menuStructure) : null;

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
        <Button variant="outline" size="sm" onClick={navigateToRoot}>
          <Home className="h-4 w-4 mr-1" />
          Main Menu
        </Button>
        {currentPath.map((path, index) => (
          <div key={path} className="flex items-center space-x-2">
            <span>/</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
            >
              {menuStructure[path]?.text || path}
            </Button>
          </div>
        ))}
        {currentPath.length > 0 && (
          <Button variant="outline" size="sm" onClick={navigateBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Menu Items</span>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => addMenuItem('text')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Text
                </Button>
                <Button size="sm" variant="outline" onClick={() => addMenuItem('submenu')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Submenu
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(currentMenu).length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No menu items yet. Add some items to get started!
              </p>
            ) : (
              Object.entries(currentMenu).map(([key, item]: [string, any]) => (
                <div
                  key={key}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    editingItem?.id === key
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white hover:shadow-sm"
                  }`}
                  onClick={() => setEditingItem(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{item.text}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={item.type === 'submenu' ? 'default' : 'secondary'}>
                            {item.type}
                          </Badge>
                          {item.type === 'submenu' && (
                            <span className="text-xs text-gray-500">
                              ({Object.keys(item.children || {}).length} items)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {item.type === 'submenu' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToSubmenu(key);
                          }}
                        >
                          <Menu className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMenuItem(key);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Edit Panel */}
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? `Edit: ${editingItem.text}` : 'Select an item to edit'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingItem ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Button Text</label>
                  <Input
                    value={editingItem.text}
                    onChange={(e) => updateMenuItem(editingItem.id, { text: e.target.value })}
                    placeholder="Button text..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <Select
                    value={editingItem.type}
                    onValueChange={(value: 'text' | 'submenu') => 
                      updateMenuItem(editingItem.id, { 
                        type: value,
                        children: value === 'submenu' ? (editingItem.children || {}) : undefined
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Response</SelectItem>
                      <SelectItem value="submenu">Submenu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {editingItem.type === 'submenu' ? 'Menu Description' : 'Response Text'}
                  </label>
                  <Textarea
                    value={editingItem.content || ''}
                    onChange={(e) => updateMenuItem(editingItem.id, { content: e.target.value })}
                    placeholder={
                      editingItem.type === 'submenu' 
                        ? "Message to show before submenu options..."
                        : "Response text when button is clicked..."
                    }
                    rows={4}
                  />
                </div>

                {editingItem.type === 'submenu' && (
                  <Button
                    onClick={() => navigateToSubmenu(editingItem.id)}
                    className="w-full"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Edit Submenu Items
                  </Button>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Select a menu item to edit its properties
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const ageTemplate = {
                  [`age_template_${Date.now()}`]: {
                    id: `age_template_${Date.now()}`,
                    text: "What is your age?",
                    type: "submenu",
                    content: "Please select your age:",
                    children: {
                      "age_17": { id: "age_17", text: "17", type: "text", content: "Content for age 17" },
                      "age_18": { id: "age_18", text: "18", type: "text", content: "Content for age 18" },
                      "age_19": { id: "age_19", text: "19", type: "text", content: "Content for age 19" },
                      "age_20": { id: "age_20", text: "20", type: "text", content: "Content for age 20" },
                    }
                  }
                };
                onMenuStructureChange({ ...menuStructure, ...ageTemplate });
              }}
            >
              Age Selection Template
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const genderTemplate = {
                  [`gender_template_${Date.now()}`]: {
                    id: `gender_template_${Date.now()}`,
                    text: "Select Gender",
                    type: "submenu",
                    content: "What is your gender?",
                    children: {
                      "male": { id: "male", text: "Male", type: "text", content: "Content for males" },
                      "female": { id: "female", text: "Female", type: "text", content: "Content for females" },
                      "other": { id: "other", text: "Other", type: "text", content: "Content for others" },
                    }
                  }
                };
                onMenuStructureChange({ ...menuStructure, ...genderTemplate });
              }}
            >
              Gender Selection Template
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                const contactTemplate = {
                  [`contact_template_${Date.now()}`]: {
                    id: `contact_template_${Date.now()}`,
                    text: "Contact Us",
                    type: "submenu",
                    content: "How would you like to contact us?",
                    children: {
                      "email": { id: "email", text: "📧 Email", type: "text", content: "Send us an email at: contact@example.com" },
                      "phone": { id: "phone", text: "📞 Phone", type: "text", content: "Call us at: +1-234-567-8900" },
                      "website": { id: "website", text: "🌐 Website", type: "text", content: "Visit our website: www.example.com" },
                    }
                  }
                };
                onMenuStructureChange({ ...menuStructure, ...contactTemplate });
              }}
            >
              Contact Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}