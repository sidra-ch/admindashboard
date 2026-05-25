import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

export default function StaffUsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Users</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        User administration is wired to the Phase 1 API base for tenant-isolated staff management.
      </CardContent>
    </Card>
  );
}
