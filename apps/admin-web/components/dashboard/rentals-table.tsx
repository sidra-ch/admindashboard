'use client';

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const rows = [
  { renter: 'Olivia Brown', car: 'Toyota RAV4', branch: 'Sydney HQ', due: 'Today 4:30 PM', status: 'Active' },
  { renter: 'Liam Patel', car: 'Kia Carnival', branch: 'Melbourne South', due: 'Today 5:15 PM', status: 'Returning' },
  { renter: 'Noah Wilson', car: 'Tesla Model Y', branch: 'Brisbane CBD', due: 'Tomorrow 10:00 AM', status: 'Active' },
  { renter: 'Mia Chen', car: 'Hyundai Tucson', branch: 'Perth West', due: 'Overdue 2h', status: 'Overdue' },
];

const columnHelper = createColumnHelper<(typeof rows)[number]>();

const columns = [
  columnHelper.accessor('renter', { header: 'Renter' }),
  columnHelper.accessor('car', { header: 'Vehicle' }),
  columnHelper.accessor('branch', { header: 'Branch' }),
  columnHelper.accessor('due', { header: 'Due' }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => {
      const value = getValue();
      const variant = value === 'Overdue' ? 'destructive' : value === 'Returning' ? 'warning' : 'success';
      return <Badge variant={variant}>{value}</Badge>;
    },
  }),
];

export function RentalsTable() {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active rentals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-border/70 text-left text-muted-foreground">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-3 font-medium">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-border/50 last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
