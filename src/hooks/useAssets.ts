import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from '@/lib/api/assets-api';
import { handleApiError } from '@/lib/api/error-handler';
import { CreateAssetRequest, UpdateAssetRequest } from '@/lib/api/types';
import { toast } from 'sonner';

export const useAssets = () => {
  const queryClient = useQueryClient();

  // Fetch all assets
  const assetsQuery = useQuery({
    queryKey: ['assets'],
    queryFn: assetsApi.getAll,
    staleTime: 30000, // 30 seconds
  });

  // Fetch available devices for configuration
  const availableDevicesQuery = useQuery({
    queryKey: ['assets', 'available-devices'],
    queryFn: assetsApi.getAvailableDevices,
    staleTime: 30000,
  });

  // Create asset mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAssetRequest) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset created successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Update asset mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetRequest }) => 
      assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset updated successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Delete asset mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Configure asset with device mutation
  const configureMutation = useMutation({
    mutationFn: ({ assetId, deviceId }: { assetId: number; deviceId: number }) => 
      assetsApi.configureWithDevice(assetId, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Asset configured with device successfully');
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => assetsApi.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(`${ids.length} asset(s) deleted successfully`);
    },
    onError: (error) => {
      toast.error(handleApiError(error));
    },
  });

  return {
    // Queries
    assets: assetsQuery.data ?? [],
    availableDevices: availableDevicesQuery.data ?? [],
    isLoading: assetsQuery.isLoading,
    isError: assetsQuery.isError,
    error: assetsQuery.error,

    // Mutations
    createAsset: createMutation.mutate,
    updateAsset: updateMutation.mutate,
    deleteAsset: deleteMutation.mutate,
    configureAssetWithDevice: configureMutation.mutate,
    bulkDeleteAssets: bulkDeleteMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isConfiguring: configureMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,

    // Refetch
    refetch: assetsQuery.refetch,
    refetchAvailableDevices: availableDevicesQuery.refetch,
  };
};
