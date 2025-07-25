import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Bot } from "lucide-react";
import { useAuth, useLogout } from "@/lib/auth";

export function Navigation() {
  const { data: auth } = useAuth();
  const logout = useLogout();
  const [location] = useLocation();

  const handleLogout = () => {
    logout.mutate();
  };

  if (!auth?.user) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/bots", label: "My Bots" },
    { href: "/templates", label: "Templates" },
    { href: "/analytics", label: "Analytics" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Bot className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-gray-900">TeleBuilder</span>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={`px-3 py-2 rounded-md font-medium ${
                        location === item.href
                          ? "text-primary"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5 text-gray-400" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {auth.user.firstName?.[0] || auth.user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block font-medium">
                    {auth.user.firstName || auth.user.username}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
