import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { profileApi } from '@/api/profile';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/shared/Avatar';

const schema = z.object({
  name:             z.string().min(1, 'Name required'),
  email:            z.string().email('Invalid email'),
  current_password: z.string().optional(),
  new_password:     z.string().optional(),
}).refine(
  d => !d.new_password || !!d.current_password,
  { message: 'Current password required to change password', path: ['current_password'] }
);

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, updateUser }  = useAuthStore();
  const { push }              = useToastStore();
  const [avatarFile, setAvatar] = useState<File | null>(null);
  const [preview, setPreview]   = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const updateMutation = useMutation({
    mutationFn: (d: FormData) => {
      const fd = new FormData();
      fd.append('name',  d.name);
      fd.append('email', d.email);
      if (d.current_password) fd.append('current_password', d.current_password);
      if (d.new_password)     fd.append('new_password',     d.new_password);
      if (avatarFile)         fd.append('avatar',           avatarFile);
      return profileApi.update(fd);
    },
    onSuccess: (res) => {
      if (res.success) {
        updateUser(res.data.user, res.data.token);
        push('Profile updated', 'success');
      }
    },
    onError: (e: unknown) => push((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed', 'error'),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatar(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Settings</h2>

      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardBody>
          <div className="mb-6 flex items-center gap-5">
            <div className="relative">
              {preview ? (
                <img src={preview} alt="Preview" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-500" />
              ) : (
                <Avatar name={user?.name ?? ''} avatar={user?.avatar} size="lg" />
              )}
            </div>
            <div>
              <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Change photo
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
              <p className="mt-1 text-xs text-gray-400">JPG, PNG, GIF up to 2MB</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="flex flex-col gap-4">
            <Input label="Full Name" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />

            <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
              <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Change Password</p>
              <div className="flex flex-col gap-3">
                <Input label="Current Password" type="password" error={errors.current_password?.message} {...register('current_password')} />
                <Input label="New Password" type="password" {...register('new_password')} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={isSubmitting || updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
