'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const schema = z.object({
  email: z.string().email(),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    toast.success(`Password reset link requested for ${email}.`);
    form.reset();
  });

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="ops@company.com" {...form.register('email')} />
        {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
      </div>
      <Button className="w-full" type="submit">
        Send reset link
      </Button>
    </form>
  );
}
