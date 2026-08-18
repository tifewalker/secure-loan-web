import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  descriptionClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "text-muted-foreground",
  descriptionClassName = "text-muted-foreground"
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconClassName}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className={`text-xs ${descriptionClassName}`}>{description}</p>
        )}
      </CardContent>
    </Card>
  );
};