import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Loader2, Plus, Repeat, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import NoAccessPage from '@/components/NoAccessPage';
import { getErrorMessage, useCreateHoliday, useDeleteHoliday, useHolidays, type Holiday } from '@/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const thisYear = new Date().getFullYear();
const YEARS = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2];
const emptyHoliday = { name: '', date: '', recurring: false };

/** `date` is YYYY-MM-DD; parse it as a local date so it doesn't shift a day. */
const parseDay = (date?: string) => {
  const [y, m, d] = (date ?? '').split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
};

const HolidaysPage = () => {
  const { isAuthenticated, authInitialized, isLoading: authLoading, hasPermission, isAdmin } = useAuth();
  const canCreate = isAdmin || hasPermission('create_holidays');
  const canDelete = isAdmin || hasPermission('delete_holidays');

  const [year, setYear] = useState(String(thisYear));
  const holidaysQuery = useHolidays({ year }, { enabled: isAuthenticated });
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const [createOpen, setCreateOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState(emptyHoliday);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  if (!authInitialized || authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAuthenticated) return <NoAccessPage message="Please log in to manage holidays." />;

  // Recurring holidays repeat yearly, so show them on the selected year.
  const holidays = [...(holidaysQuery.data ?? [])]
    .map((h) => {
      const day = parseDay(h.date);
      const shown = day && h.recurring ? new Date(Number(year), day.getMonth(), day.getDate()) : day;
      return { ...h, shown };
    })
    .sort((a, b) => (a.shown?.getTime() ?? 0) - (b.shown?.getTime() ?? 0));

  const upcoming = holidays.filter((h) => h.shown && h.shown >= new Date(new Date().toDateString())).length;

  const handleCreate = async () => {
    if (!newHoliday.name.trim() || !newHoliday.date) {
      toast({ title: 'Missing fields', description: 'Enter a name and a date.', variant: 'destructive' });
      return;
    }
    try {
      await createHoliday.mutateAsync({ ...newHoliday, name: newHoliday.name.trim() });
      toast({ title: 'Holiday added', description: `${newHoliday.name} will be skipped by new repayment schedules.` });
      setNewHoliday(emptyHoliday);
      setCreateOpen(false);
    } catch (err) {
      toast({ title: 'Failed to add holiday', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!holidayToDelete?._id) return;
    try {
      await deleteHoliday.mutateAsync(holidayToDelete._id);
      toast({ title: 'Holiday deleted' });
      setHolidayToDelete(null);
    } catch (err) {
      toast({ title: 'Failed to delete holiday', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const statCards = [
    { label: `Holidays in ${year}`, value: holidays.length, icon: CalendarDays },
    { label: 'Recurring', value: holidays.filter((h) => h.recurring).length, icon: Repeat },
    { label: 'Upcoming', value: upcoming, icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Holidays</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Repayment due dates on a weekend or holiday move to the next business day.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Applies to schedules generated after the holiday is added; existing schedules are not changed.
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add Holiday
          </Button>
        )}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-muted-foreground/10 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <Icon className="size-3.5 text-muted-foreground" />
              </div>
              <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-9 w-[140px] border-dashed">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">{holidays.length} holidays</div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {holidaysQuery.isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : holidaysQuery.error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm text-destructive">{getErrorMessage(holidaysQuery.error, 'Failed to load holidays')}</p>
            <Button variant="outline" size="sm" onClick={() => holidaysQuery.refetch()}>Retry</Button>
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CalendarDays className="size-8 text-muted-foreground" />
            <h3 className="text-sm font-medium">No holidays for {year}</h3>
            <p className="text-sm text-muted-foreground">
              Add fixed dates (1 Jan, 1 May, 12 Jun, 1 Oct, 25–26 Dec) as recurring, and movable ones like Easter and Eid each year.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Holiday</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h) => (
                <TableRow key={h._id} className="group">
                  <TableCell className="text-sm">
                    <div className="font-medium">{h.shown ? format(h.shown, 'EEE, MMM dd') : h.date}</div>
                    <div className="text-xs text-muted-foreground">{h.shown ? format(h.shown, 'yyyy') : ''}</div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{h.name}</TableCell>
                  <TableCell>
                    {h.recurring ? (
                      <Badge variant="outline" className="flex w-fit items-center gap-1 border-blue-200 bg-blue-50 font-normal text-blue-700">
                        <Repeat className="size-3" />
                        Every year
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal">One-off</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {canDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        onClick={() => setHolidayToDelete(h)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>Due dates falling on this day will move to the next business day.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="holidayName">Name *</Label>
              <Input
                id="holidayName"
                className="mt-1"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="e.g., Independence Day"
              />
            </div>
            <div>
              <Label htmlFor="holidayDate">Date *</Label>
              <Input
                id="holidayDate"
                type="date"
                className="mt-1"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="holidayRecurring"
                checked={newHoliday.recurring}
                onCheckedChange={(checked) => setNewHoliday({ ...newHoliday, recurring: checked === true })}
              />
              <Label htmlFor="holidayRecurring" className="cursor-pointer text-sm font-normal leading-snug">
                Repeats every year on this month and day
                <span className="block text-xs text-muted-foreground">Leave unticked for movable holidays like Easter or Eid.</span>
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createHoliday.isPending}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createHoliday.isPending}>
              {createHoliday.isPending ? 'Adding...' : 'Add Holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!holidayToDelete}
        onOpenChange={(open) => !open && setHolidayToDelete(null)}
        title="Delete holiday?"
        description={holidayToDelete && <>"{holidayToDelete.name}" will be removed. Existing repayment schedules are not changed.</>}
        confirmLabel="Delete holiday"
        destructive
        isPending={deleteHoliday.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default HolidaysPage;
