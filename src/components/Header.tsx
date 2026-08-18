import { Bell, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Replace this with page title, quick actions, etc. as needed */}
      <span className="text-sm font-medium text-muted-foreground">
        Welcome back
      </span>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <Badge className="absolute -right-0.5 -top-0.5 size-2 rounded-full p-0" />
        </Button>
      </div>
    </header>
  );
};

export default Header;