import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from '@/lib/api/devices-api';
import { handleApiError } from '@/lib/api/error-handler';
import { CreateDeviceRequest, UpdateDeviceRequest } from '@/lib/api/types';
import { toast } from 'sonner';

export const useDevices = () => {
  const queryClient = useQueryClient();

  // Fetch all devices
  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.getAll,
    staleTime: 30000, // 30 seconds
  });

  // Fetch unassigned devices
  const unassignedDevicesQuery = useQuery({
    queryKey: ['devices', 'unassigned'],
    queryFn: devicesApi.getUnassigned,
    staleTime: 30000,
  });

  // Create device mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDeviceRequest) => devicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Update device mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDeviceRequest }) => 
      devicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Delete device mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => devicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => devicesApi.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success(`${ids.length} device(s) deleted successfully`);
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  return {
    // Queries
    devices: devicesQuery.data ?? [],
    unassignedDevices: unassignedDevicesQuery.data ?? [],
    isLoading: devicesQuery.isLoading,
    isError: devicesQuery.isError,
    error: devicesQuery.error,

    // Mutations
    createDevice: createMutation.mutate,
    updateDevice: updateMutation.mutate,
    deleteDevice: deleteMutation.mutate,
    bulkDeleteDevices: bulkDeleteMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,

    // Refetch
    refetch: devicesQuery.refetch,
  };
};
